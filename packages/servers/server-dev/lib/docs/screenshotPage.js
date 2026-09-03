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

import { getBrowser, openPage, buildPageUrl } from './getBrowser.js';
import unsettledPageNote from './unsettledPageNote.js';

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

// screenshotPage lets an agent visually verify a page rendered by the
// running dev server.
async function screenshotPage({
  origin,
  pageId,
  fullPage = false,
  clip,
  scrollX = 0,
  scrollY = 0,
  user,
  width = 1280,
  height = 800,
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

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const url = buildPageUrl({ origin, pageId });

  let context;
  try {
    const opened = await openPage({ browser, origin, pageId, user, width, height, timeout });
    context = opened.context;
    // Let post-load rendering (fonts, transitions, client-side state) settle.
    await opened.page.waitForTimeout(300);

    const docClip = await resolveClip({ page: opened.page, clip, scrollX, scrollY });
    const screenshotOptions = docClip ? { type: 'png', clip: docClip } : { type: 'png', fullPage };
    const buffer = await opened.page.screenshot(screenshotOptions);
    const result = { data: buffer.toString('base64'), mimeType: 'image/png' };
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return result;
  } catch (error) {
    return { error: `Failed to screenshot "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default screenshotPage;
