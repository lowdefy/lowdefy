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
import readPageArtifact from './readPageArtifact.js';
import { runSteps } from './runJourney.js';
import unsettledPageNote from './unsettledPageNote.js';
import validateJourneySteps from './validateJourneySteps.js';

// The state paths a page declares as non-deterministic (`~snapshotIgnore` on
// the page block) travel with the snapshot so the comparison — which lives in
// the CLI and never reads build artefacts — can drop them from both sides.
function readSnapshotIgnore({ pageId }) {
  const page = readPageArtifact({ pageId });
  const ignore = page?.['~snapshotIgnore'];
  if (!type.isArray(ignore)) {
    return [];
  }
  return ignore.filter((path) => type.isString(path));
}

// Runs in the page, immediately before the capture. Freezing animations and
// transitions removes the only remaining source of pixel drift between two
// renders of unchanged config: the frame an animation happened to be on.
function settleForCapture() {
  const style = document.createElement('style');
  style.textContent =
    '*, *::before, *::after { animation: none !important; transition: none !important; }';
  document.head.appendChild(style);
  return document.fonts.ready.then(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      })
  );
}

// Runs in the page. `state` only: requests and eventLog are call logs, not
// rendered output, and would make every snapshot dirty. The JSON round-trip
// mirrors inspectStateHeadless — functions and undefined dropped, Dates as ISO
// strings — so state.json is plain JSON a diff tool can read.
function captureInPage(id) {
  const root = document.getElementById('root');
  const pageContext = window.lowdefy?.contexts?.[`page:${id}`];
  return {
    dom: root ? root.outerHTML : document.documentElement.outerHTML,
    state: JSON.parse(JSON.stringify(pageContext?.state ?? {})),
  };
}

// snapshotPage renders a page as a named user under deterministic browser
// settings and returns everything a golden snapshot is diffed against: the
// viewport PNG, the app root's outerHTML and the page state. An optional
// journey (task 27 steps) runs first so a snapshot can capture a reached state
// — a modal open, a filter applied — not only the initial render. A failing
// journey step is an error: the golden would otherwise silently record the
// wrong state.
async function snapshotPage({
  origin,
  pageId,
  user,
  urlQuery,
  journey,
  width = 1280,
  height = 800,
  timeout = 15000,
  stepTimeout = 5000,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `snapshotPage requires an "origin" string. Received ${JSON.stringify(origin)}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `snapshotPage requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return {
      error: `snapshotPage requires "urlQuery" to be an object. Received ${JSON.stringify(
        urlQuery
      )}.`,
    };
  }
  const steps = type.isNone(journey) ? [] : journey;
  const { error: stepsError } = validateJourneySteps({ steps });
  if (!type.isUndefined(stepsError)) {
    return { error: `Invalid journey: ${stepsError}` };
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
      width,
      height,
      timeout,
      contextOptions: deterministicContextOptions,
    });
    context = opened.context;
    if (steps.length > 0) {
      const { failure } = await runSteps({ page: opened.page, steps, stepTimeout });
      if (!type.isUndefined(failure)) {
        return {
          error: `Journey step ${failure.index} failed before the snapshot was taken: ${failure.message}`,
          failure,
        };
      }
    }
    // A golden is compared pixel for pixel, so the capture waits for the frame
    // to be final rather than for a fixed number of milliseconds: web fonts
    // loaded, animations and transitions switched off, and two paints elapsed.
    await opened.page.evaluate(settleForCapture);
    const captured = await opened.page.evaluate(captureInPage, pageId);
    const buffer = await opened.page.screenshot({ type: 'png' });
    const result = {
      pageId,
      screenshot: buffer.toString('base64'),
      dom: captured.dom,
      state: captured.state,
      snapshotIgnore: readSnapshotIgnore({ pageId }),
    };
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return result;
  } catch (error) {
    return { error: `Failed to snapshot "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default snapshotPage;
