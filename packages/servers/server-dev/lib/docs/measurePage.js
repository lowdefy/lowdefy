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

import { getBrowser, openPage, buildPageUrl, deterministicContextOptions } from './getBrowser.js';
import { runSteps } from './runJourney.js';
import unsettledPageNote from './unsettledPageNote.js';
import validateJourneySteps from './validateJourneySteps.js';

// How many synthetic state changes to run when the caller gives no steps. One
// update is enough to count parses, but a spread of timings is what makes the
// p50/p95 mean anything, and a first update after page load is warm-up.
const SYNTHETIC_UPDATES = 6;
const HEAVIEST_BLOCKS = 5;

// The engine's counters live per page context behind lowdefy.startPerf, which
// the client only exposes on a dev or e2e build.
function startPerfInPage() {
  if (!window.lowdefy || !window.lowdefy.startPerf) return false;
  window.lowdefy.startPerf();
  return true;
}

function runSyntheticUpdates({ pageId, times }) {
  const context = window.lowdefy.contexts[`page:${pageId}`];
  if (!context) return false;
  for (let i = 0; i < times; i += 1) {
    context._internal.update();
  }
  return true;
}

function readPerfInPage() {
  return window.lowdefy.readPerf();
}

function percentile({ sorted, fraction }) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor(fraction * sorted.length));
  return sorted[index];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function summarizeUpdateMs(updateMs) {
  const sorted = [...updateMs].sort((a, b) => a - b);
  return {
    p50: round(percentile({ sorted, fraction: 0.5 })),
    p95: round(percentile({ sorted, fraction: 0.95 })),
    max: round(sorted.length === 0 ? 0 : sorted[sorted.length - 1]),
  };
}

function heaviestBlocks(blocks) {
  return [...blocks]
    .sort((a, b) => b.ms - a.ms || b.parses - a.parses)
    .slice(0, HEAVIEST_BLOCKS)
    .map(({ blockId, parses, ms, nodes }) => ({ blockId, parses, ms: round(ms), nodes }));
}

// The one sentence the P6 go/no-go is made of: how much operator evaluation one
// state change costs on a real page. Everything else in the result is the
// working behind it.
function verdict({ blocks, updates, parses, msPerUpdate, driver }) {
  if (updates === 0) {
    return `No state change was measured on ${blocks} blocks — ${driver} triggered no engine update, so there is nothing to gate on.`;
  }
  const perUpdate = Math.round(parses / updates);
  return `${perUpdate} parses per state update on ${blocks} blocks (${updates} updates from ${driver}, p50 ${msPerUpdate.p50}ms, p95 ${msPerUpdate.p95}ms per update).`;
}

// Measures what one state change costs the engine on a page of the running dev
// server: how many blocks it re-evaluates, how many operator parses that is, by
// which of the block's expressions, and how long each update takes. This is the
// measurement decision R23 gates the operator-closure work on — run it before
// building anything, and again after, on the same page and the same steps.
async function measurePage({
  origin,
  pageId,
  steps,
  stepTimeout = 5000,
  timeout = 15000,
  urlQuery,
  user,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `measurePage requires an "origin" string. Received ${JSON.stringify(origin)}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return { error: `measurePage requires a "pageId" string. Received ${JSON.stringify(pageId)}.` };
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return {
      error: `measurePage requires "urlQuery" to be an object. Received ${JSON.stringify(
        urlQuery
      )}.`,
    };
  }
  const measureSteps = type.isNone(steps) ? [] : steps;
  if (measureSteps.length > 0) {
    const { error: stepsError } = validateJourneySteps({ steps: measureSteps });
    if (!type.isUndefined(stepsError)) {
      return { error: stepsError };
    }
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const url = buildPageUrl({ origin, pageId, urlQuery });

  let context;
  try {
    const opened = await openPage({
      browser,
      origin,
      pageId,
      user,
      urlQuery,
      timeout,
      contextOptions: deterministicContextOptions,
    });
    context = opened.context;
    // Counting starts after the page has settled, so the numbers describe a
    // state change on a live page and not the one-off cost of building it.
    const started = await opened.page.evaluate(startPerfInPage);
    if (!started) {
      return {
        error:
          'Perf counters unavailable: window.lowdefy.startPerf is not exposed. This tool needs a dev build of the app (lowdefy dev).',
      };
    }

    const driver =
      measureSteps.length > 0
        ? `${measureSteps.length} journey steps`
        : `${SYNTHETIC_UPDATES} synthetic updates`;
    let failure;
    if (measureSteps.length > 0) {
      ({ failure } = await runSteps({ page: opened.page, steps: measureSteps, stepTimeout }));
    } else {
      const ran = await opened.page.evaluate(runSyntheticUpdates, {
        pageId,
        times: SYNTHETIC_UPDATES,
      });
      if (!ran) {
        return { error: `No live context for page "${pageId}".` };
      }
    }

    const contexts = await opened.page.evaluate(readPerfInPage);
    const measured = contexts.find(({ id }) => id === `page:${pageId}`);
    if (type.isNone(measured)) {
      return { error: `No perf counters for page "${pageId}" — the page context was rebuilt.` };
    }

    const msPerUpdate = summarizeUpdateMs(measured.updateMs);
    const result = {
      pageId,
      blocks: measured.blocks,
      updates: measured.updates,
      blockVisits: measured.blockVisits,
      parses: measured.parses,
      copyNodes: measured.copyNodes,
      msPerUpdate,
      heaviestBlocks: heaviestBlocks(measured.blockCosts),
      verdict: verdict({
        blocks: measured.blocks,
        updates: measured.updates,
        parses: measured.parses.total,
        msPerUpdate,
        driver,
      }),
    };
    if (!type.isUndefined(failure)) {
      result.failure = failure;
    }
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return result;
  } catch (error) {
    return { error: `Failed to measure "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default measurePage;
