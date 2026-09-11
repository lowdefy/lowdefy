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

import { type } from '@lowdefy/helpers';

import { ReportBusyError } from './errors.js';
import createSemaphore from './generation/createSemaphore.js';
import runGeneration from './generation/runGeneration.js';
import withTimeout from './generation/withTimeout.js';

// At most this many generations run at once per process; further calls queue
// FIFO up to MAX_QUEUED, then fail fast with a busy error the route turns into a
// 503. A generation is CPU- and memory-heavy (a full engine context plus a PDF
// render), so an unbounded burst — a dashboard emailing every user, a cron fan
// out — would exhaust the process.
const MAX_CONCURRENT = 2;
const MAX_QUEUED = 8;

const DEFAULT_TIMEOUT_MS = 30000;

const semaphore = createSemaphore({ maxConcurrent: MAX_CONCURRENT, maxQueued: MAX_QUEUED });

const noop = () => undefined;

/**
 * Generate a report document for one page. This is the entry point the
 * RenderReport request resolver calls; it owns the operational guardrails (the
 * per-process concurrency semaphore and the generation timeout) and hands the
 * pipeline itself to runGeneration.
 *
 * Nothing is cached between runs except module-level constants (fonts). Each
 * call builds a fresh headless context, so one generation never leaks state
 * into the next.
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
 * @param {string} [options.origin] The app's own origin, the last-resort base
 *   for relative image paths.
 * @param {string} [options.publicDirectory] The server's copied public folder,
 *   where relative image paths are read from first.
 * @param {object} [options.logger] Pino-style logger.
 * @param {Date} [options.now] Fixes the footer timestamp (tests).
 * @param {number} [options.timeoutMs] Generation timeout, queue wait included;
 *   default 30000.
 * @returns {Promise<{ buffer: Buffer, contentType: string, filename: string, warnings: object }>}
 */
async function generateReport(options) {
  const pageId = options?.pageConfig?.pageId ?? options?.pageConfig?.id;
  const timeoutMs = type.isNumber(options?.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const busy = ({ active, queued }) =>
    new ReportBusyError(
      `Report generation is busy: ${active} running, ${queued} queued. ` +
        `The report for page '${pageId}' was not generated; retry shortly.`
    );

  // The deadline covers the queue wait: under load a caller parked in the queue
  // has already spent part of its budget before its work starts, and a render
  // that started after the client was answered would only be leaked memory.
  const generation = semaphore.acquire({ signal: controller.signal, busy }).then(async () => {
    try {
      return await runGeneration({ ...options, signal: controller.signal });
    } finally {
      // Release when the work stops, not when the caller gives up. Freeing the
      // slot on the timeout alone would hand it to the next caller while the
      // aborted generation still holds its engine context and buffers, so a
      // page that wedges every time would accumulate orphans past
      // MAX_CONCURRENT — the bound would fail exactly when the process is under
      // stress. Held this way, a wedge that somehow ignores the abort surfaces
      // as a busy 503 rather than as silent memory growth.
      semaphore.release();
    }
  });
  // The race reports the first outcome to the caller; when the timeout wins the
  // generation's own later rejection has nobody listening, so swallow it here.
  generation.catch(noop);

  return withTimeout(generation, { timeoutMs, pageId, controller });
}

export default generateReport;
