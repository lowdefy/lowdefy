/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/**
 * The single entry point the report server (task 17) and the `RenderReport`
 * routine step (task 19) call. It ties the pipeline together — evaluate the
 * page headlessly, walk the evaluated tree into IR, translate to the requested
 * format — and owns the operational guardrails: a per-process concurrency
 * semaphore, a generation timeout, and the aggregated warning summary.
 *
 * Nothing is cached between runs except module-level constants (fonts). Each
 * call builds a fresh headless context, so one generation never leaks state
 * into the next.
 */

import { type } from '@lowdefy/helpers';

import evaluatePage from './evaluatePage/evaluatePage.js';
import walkBlocks from './render/walkBlocks.js';
import { renderPdfBuffer, contentWidthOf } from './render/pdf/toPdfMake.js';
import toXlsx from './render/xlsx/toXlsx.js';
import { fonts } from './fonts/fonts.js';

// --- Concurrency semaphore ---------------------------------------------------
// At most this many generations run at once per process; further calls queue
// FIFO. A generation is CPU- and memory-heavy (a full engine context plus a PDF
// render), so an unbounded burst — a dashboard emailing every user, a cron fan
// out — would exhaust the process. A simple promise-chain semaphore needs no
// dependency: `acquire` resolves when a slot is free, `release` hands the slot
// to the next waiter in order.

const MAX_CONCURRENT = 2;

let active = 0;
const waiters = [];

function acquire() {
  if (active < MAX_CONCURRENT) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiters.push(resolve));
}

function release() {
  const next = waiters.shift();
  if (next) {
    // Hand the slot straight to the next waiter — `active` stays unchanged.
    next();
  } else {
    active -= 1;
  }
}

// --- Timeout -----------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30000;

// Race the generation against a timer. The generation cannot be cancelled — the
// engine has no abort — but the timeout frees the semaphore slot and surfaces a
// clear error naming the page, so a wedged run (a request that never settles is
// the usual suspect, since the drain awaits every outstanding request) never
// blocks the queue forever.
function withTimeout(promise, timeoutMs, pageId) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `Report generation for page '${pageId}' timed out after ${timeoutMs}ms. ` +
            'A request that never settles during the drain is the usual cause.'
        )
      );
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// --- Report chrome -----------------------------------------------------------

const FORMATS = {
  pdf: { contentType: 'application/pdf', ext: 'pdf' },
  xlsx: {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: 'xlsx',
  },
};

// Evaluate one config value in the page's client-operator context. `_user`,
// `_state`, `_string`, … all resolve exactly as they do for the live page
// (operators work everywhere). `undefined` short-circuits to `undefined`.
function evaluate(parser, input, location) {
  if (type.isUndefined(input)) return undefined;
  const { output } = parser.parse({ input, location, arrayIndices: [] });
  return output;
}

// Build the already-evaluated page-level report options toPdfMake consumes.
// `size`/`orientation` arrive build-validated and pass through untouched;
// `title`/`header`/`footer` evaluate now. Title defaults to the page's own
// title, else the pageId.
function evaluateReport({ context, pageConfig, pageId }) {
  const parser = context._internal.parser;
  const reportKey = pageConfig?.report ?? {};

  const title =
    evaluate(parser, reportKey.title, pageId) ??
    evaluate(parser, pageConfig?.properties?.title, pageId) ??
    pageId;

  return {
    title,
    size: reportKey.size,
    orientation: reportKey.orientation,
    header: evaluate(parser, reportKey.header, pageId),
    footer: evaluate(parser, reportKey.footer, pageId),
  };
}

// --- Generation --------------------------------------------------------------

async function runGeneration({
  pageConfig,
  format,
  snapshot = {},
  reportOptions = {},
  invocation,
  callRequest,
  operators,
  jsMap,
  blockMetas,
  registry = {},
  stylesheets,
  user,
  lowdefyGlobal,
  serverUrl,
  publicDir,
  logger,
  now,
}) {
  const pageId = pageConfig?.pageId ?? pageConfig?.id;

  const spec = FORMATS[format];
  if (!spec) {
    throw new Error(
      `Report format '${format}' is not supported for page '${pageId}'. Use 'pdf' or 'xlsx'.`
    );
  }

  const { context, warnings: skippedActions } = await evaluatePage({
    pageConfig,
    seed: snapshot,
    invocation,
    callRequest,
    operators,
    jsMap,
    blockMetas,
    user,
    lowdefyGlobal,
    serverUrl,
    logger,
  });

  const report = evaluateReport({ context, pageConfig, pageId });

  const renderContext = {
    logger,
    fonts,
    stylesheets,
    contentWidth: contentWidthOf(report),
  };

  const walked = await walkBlocks(context, registry, reportOptions, renderContext);
  const skippedBlockTypes = walked.warnings;

  let buffer;
  if (format === 'pdf') {
    buffer = await renderPdfBuffer(walked.nodes, report, { now, publicDir, logger });
  } else {
    // format === 'xlsx' — project the same IR's table nodes into a workbook.
    buffer = await toXlsx(walked.nodes);
  }

  const warnings = { skippedActions, skippedBlockTypes };

  if (logger && (skippedActions.length > 0 || skippedBlockTypes.length > 0)) {
    logger.warn(
      { pageId, format, warnings },
      `Report for page '${pageId}' generated with warnings: ` +
        `${skippedActions.length} skipped action(s), ` +
        `${skippedBlockTypes.length} unsupported block type(s).`
    );
  }

  return {
    buffer,
    contentType: spec.contentType,
    filename: `${pageId}.${spec.ext}`,
    warnings,
  };
}

/**
 * Generate a report document for one page.
 *
 * @param {object} options
 * @param {object} options.pageConfig Built page JSON (the runtime artifact).
 * @param {'pdf'|'xlsx'} options.format Output format.
 * @param {object} [options.snapshot] `{ urlQuery, input, state }` seeded into
 *   the headless render before `onInit` (WYSIWYG).
 * @param {object} [options.reportOptions] Per-block `report:` options keyed by
 *   blockId, extracted by the caller from the built page JSON.
 * @param {'user'|'system'} [options.invocation] `system` fails fast on `_user`.
 * @param {Function} options.callRequest Injected request executor.
 * @param {object} options.operators Client operator map.
 * @param {object} [options.jsMap] Compiled `_js` map.
 * @param {object} [options.blockMetas] Block type → `{ category, … }`.
 * @param {object} options.registry Block type → `{ toReport }` static renderer.
 * @param {string} [options.stylesheets] Compiled report CSS (Html/chart sizing).
 * @param {object|null} [options.user] The invoking user (null for system).
 * @param {object} [options.lowdefyGlobal]
 * @param {string} [options.serverUrl] Base URL for `_location`/`_url`.
 * @param {string} [options.publicDir] Absolute path to the app's public assets
 *   directory, threaded to the image resolver for relative-path image sources.
 * @param {object} [options.logger] Pino-style logger.
 * @param {Date} [options.now] Fixes the footer timestamp (tests).
 * @param {number} [options.timeoutMs] Generation timeout; default 30000.
 * @returns {Promise<{ buffer: Buffer, contentType: string, filename: string, warnings: object }>}
 */
async function generateReport(options) {
  const pageId = options?.pageConfig?.pageId ?? options?.pageConfig?.id;
  const timeoutMs = type.isNumber(options?.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  await acquire();
  try {
    return await withTimeout(runGeneration(options), timeoutMs, pageId);
  } finally {
    release();
  }
}

export default generateReport;
