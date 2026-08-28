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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import { ReportBusyError, ReportTimeoutError } from './errors.js';
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

// How many callers may wait for a slot. The queue is bounded because an
// unbounded one only moves the burst problem: every queued caller holds an open
// connection and its parsed request body until its own timeout, and the ones at
// the back wait past any useful deadline anyway. Past the bound, callers get a
// busy error the route turns into a fast 503.
const MAX_QUEUED = 8;

let active = 0;
const waiters = [];

function acquire(pageId) {
  if (active < MAX_CONCURRENT) {
    active += 1;
    return Promise.resolve();
  }
  if (waiters.length >= MAX_QUEUED) {
    return Promise.reject(
      new ReportBusyError(
        `Report generation is busy: ${MAX_CONCURRENT} running, ${waiters.length} queued. ` +
          `The report for page '${pageId}' was not generated; retry shortly.`
      )
    );
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

// Race the generation against a timer, and abort it when the timer wins. The
// abort is what makes the timeout mean anything: a report holds an engine
// context, a rendered document and its buffers, so a run that keeps going after
// its caller has been answered is pure leaked memory. The signal reaches both
// places a generation can outlive its deadline: every wait in the evaluation
// (evaluatePage races each phase against it — an init action or the drain
// awaiting a request that never settles is the usual wedge), and the phase
// boundaries of the pipeline here.
function withTimeout(promise, timeoutMs, pageId, controller) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = new ReportTimeoutError(
        `Report generation for page '${pageId}' timed out after ${timeoutMs}ms. ` +
          'A request that never settles during the drain is the usual cause.'
      );
      // Abort with the same error the caller sees, so whatever the generation
      // rejects with downstream carries the same cause.
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Stop between phases once the caller has aborted. Each phase — evaluating the
// page, walking it to IR, laying out the document — is a chunk of CPU work that
// nobody is waiting for any more.
function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw signal.reason ?? new ReportTimeoutError('Report generation was aborted.');
  }
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
  icons = {},
  stylesheets,
  user,
  lowdefyGlobal,
  serverUrl,
  origin,
  logger,
  now,
  signal,
}) {
  const pageId = pageConfig?.pageId ?? pageConfig?.id;

  const spec = FORMATS[format];
  if (!spec) {
    // The caller asked for something the config surface does not offer, so this
    // is a ConfigError like any other bad config value — the routes answer 400.
    throw new ConfigError(
      `Report format '${format}' is not supported for page '${pageId}'. Use 'pdf' or 'xlsx'.`
    );
  }

  const {
    context,
    warnings: skippedActions,
    assertUserNotEvaluated,
  } = await evaluatePage({
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
    signal,
  });
  throwIfAborted(signal);

  const report = evaluateReport({ context, pageConfig, pageId });
  // report.title/header/footer are parsed with the same operators as the page,
  // so a system render whose only _user sits in the report chrome would slip
  // past the per-phase guards inside evaluatePage (they run before this). Assert
  // once more here, before any document bytes exist.
  assertUserNotEvaluated();

  const renderContext = {
    logger,
    fonts,
    icons,
    stylesheets,
    contentWidth: contentWidthOf(report),
    signal,
  };

  const walked = await walkBlocks(context, registry, reportOptions, renderContext);
  throwIfAborted(signal);
  const skippedBlockTypes = walked.warnings;
  const renderErrors = walked.renderErrors ?? [];

  let buffer;
  if (format === 'pdf') {
    buffer = await renderPdfBuffer(walked.nodes, report, { now, origin, logger });
  } else {
    // format === 'xlsx' — project the same IR's table nodes into a workbook.
    buffer = await toXlsx(walked.nodes);
  }

  const warnings = { skippedActions, skippedBlockTypes, renderErrors };

  if (
    logger &&
    (skippedActions.length > 0 || skippedBlockTypes.length > 0 || renderErrors.length > 0)
  ) {
    logger.warn(
      { pageId, format, warnings },
      `Report for page '${pageId}' generated with warnings: ` +
        `${skippedActions.length} skipped action(s), ` +
        `${skippedBlockTypes.length} unsupported block type(s), ` +
        `${renderErrors.length} block(s) that failed to render.`
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
 * @param {object} [options.icons] The build's icon components, keyed by name.
 * @param {string} [options.stylesheets] Compiled report CSS (Html/chart sizing).
 * @param {object|null} [options.user] The invoking user (null for system).
 * @param {object} [options.lowdefyGlobal]
 * @param {string} [options.serverUrl] Base URL for `_location`/`_url`.
 * @param {string} [options.origin] The app's own origin, threaded to the image
 *   resolver: relative image paths are made absolute against it and fetched.
 * @param {object} [options.logger] Pino-style logger.
 * @param {Date} [options.now] Fixes the footer timestamp (tests).
 * @param {number} [options.timeoutMs] Generation timeout; default 30000.
 * @returns {Promise<{ buffer: Buffer, contentType: string, filename: string, warnings: object }>}
 */
async function generateReport(options) {
  const pageId = options?.pageConfig?.pageId ?? options?.pageConfig?.id;
  const timeoutMs = type.isNumber(options?.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  await acquire(pageId);
  const controller = new AbortController();
  const generation = runGeneration({ ...options, signal: controller.signal });
  // The race below reports the first outcome to the caller; this tracks the
  // generation's own, which is what the slot is held against. The handlers
  // swallow the rejection here because the caller already sees it through the
  // race — without them a timed-out generation would look unhandled.
  const settled = generation.then(
    () => undefined,
    () => undefined
  );
  try {
    return await withTimeout(generation, timeoutMs, pageId, controller);
  } finally {
    // Release when the work stops, not when the caller gives up. Freeing the
    // slot on the timeout alone hands it to the next caller while the aborted
    // generation is still holding its engine context and buffers, so a page that
    // wedges every time would accumulate orphans past MAX_CONCURRENT — the bound
    // would fail exactly when the process is under stress. Held this way, a
    // wedge that somehow ignores the abort surfaces as a busy 503 rather than as
    // silent memory growth.
    settled.then(release);
  }
}

export default generateReport;
