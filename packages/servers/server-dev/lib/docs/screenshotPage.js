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
import { validateJourneySteps } from '@lowdefy/node-utils';

import createJourneyActors from './createJourneyActors.js';
import { getBrowser, openPage, buildPageUrl } from './getBrowser.js';
import { runSteps, MAIN_ACTOR } from './runJourney.js';
import unsettledPageNote from './unsettledPageNote.js';
import validateViewport from './validateViewport.js';

// A feedback annotation's elementRect/shapes are captured in the developer's
// live tab, viewport-relative at whatever scroll position they were at
// (batch.viewport.scrollX/scrollY) — so to recapture the same region
// headless, this scrolls to that same offset first, then converts the
// viewport-relative clip to document coordinates by adding the scroll
// offset back in. Mutually exclusive with fullPage: an explicit clip always
// wins, since it targets a specific annotated region rather than the page.
async function resolveClip({ page, clip, scrollX, scrollY }) {
  if (type.isNone(clip)) {
    return undefined;
  }
  const hasValidPosition = type.isNumber(clip.x) && type.isNumber(clip.y);
  const hasPositiveDims =
    type.isNumber(clip.width) && type.isNumber(clip.height) && clip.width > 0 && clip.height > 0;
  if (!hasValidPosition || !hasPositiveDims) {
    // Invalid clip — fall back to a normal viewport screenshot rather than
    // failing the whole request over a bad clip rect.
    return undefined;
  }

  await page.evaluate(({ x, y }) => window.scrollTo(x, y), { x: scrollX, y: scrollY });
  // Let scroll-triggered rendering (sticky headers, lazy content) settle
  // before clipping, mirroring the load-settle wait below.
  await page.waitForTimeout(200);

  return {
    x: clip.x + scrollX,
    y: clip.y + scrollY,
    width: clip.width,
    height: clip.height,
  };
}

// Opens the page and, when `steps` are given, runs them before the capture —
// the same step engine lowdefy_run_journey uses, so an agent can capture an
// open dropdown, a picker's calendar or a modal. Returns the page, a cleanup
// function and any step failure; the capture happens on whatever state the
// steps left (also after a failed step, which is what the agent needs to see).
async function openAndRunSteps({ browser, steps, stepTimeout, ...pageOptions }) {
  if (steps.length === 0) {
    const opened = await openPage({ browser, ...pageOptions });
    return { opened, close: () => opened.context.close() };
  }
  const { origin } = pageOptions;
  const actors = createJourneyActors({ browser, ...pageOptions });
  try {
    const opened = await actors.switchTo(MAIN_ACTOR);
    const journey = {
      actors,
      origin,
      configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd(),
      startedAt: Date.now(),
      openTimeout: Math.max(pageOptions.timeout, stepTimeout),
      stepTimeout,
    };
    const { failure } = await runSteps({ journey, steps });
    return {
      opened: { ...actors.current(), ready: opened.ready },
      close: actors.closeAll,
      failure,
    };
  } catch (error) {
    await actors.closeAll();
    throw error;
  }
}

// screenshotPage lets an agent visually verify a page rendered by the
// running dev server, at a given viewport size and colour scheme. `urlQuery`
// opens the page at a query string, and `steps` (see validateJourneySteps)
// drive it first — open a dropdown, click a button — so the capture shows
// that state. Popups antd renders in a portal at the end of <body> are part
// of the document, so a fullPage or clip capture includes them.
async function screenshotPage({
  origin,
  pageId,
  urlQuery,
  steps = [],
  stepTimeout = 5000,
  fullPage = false,
  clip,
  scrollX = 0,
  scrollY = 0,
  user,
  width = 1280,
  height = 800,
  colorScheme = 'light',
  timeout = 15000,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `screenshotPage requires an "origin" string. Received ${JSON.stringify(origin)}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `screenshotPage requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return {
      error: `screenshotPage requires "urlQuery" to be an object. Received ${JSON.stringify(
        urlQuery
      )}.`,
    };
  }
  const { error: stepsError } = validateJourneySteps({ steps });
  if (!type.isUndefined(stepsError)) {
    return { error: stepsError };
  }
  const viewportError = validateViewport({ width, height, colorScheme });
  if (!type.isUndefined(viewportError)) {
    return { error: viewportError };
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

  let close;
  try {
    const run = await openAndRunSteps({
      browser,
      origin,
      pageId,
      urlQuery,
      user,
      width,
      height,
      colorScheme,
      timeout,
      steps,
      stepTimeout,
    });
    const { opened, failure } = run;
    close = run.close;
    // Let post-load rendering (fonts, transitions, client-side state) settle.
    await opened.page.waitForTimeout(300);

    const docClip = await resolveClip({ page: opened.page, clip, scrollX, scrollY });
    const screenshotOptions = docClip ? { type: 'png', clip: docClip } : { type: 'png', fullPage };
    const buffer = await opened.page.screenshot(screenshotOptions);
    const result = { data: buffer.toString('base64'), mimeType: 'image/png' };
    if (!type.isUndefined(failure)) {
      result.failure = failure;
    }
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return result;
  } catch (error) {
    return { error: `Failed to screenshot "${url}": ${error.message}` };
  } finally {
    if (close) {
      await close();
    }
  }
}

export default screenshotPage;
