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

import { chromium } from 'playwright-core';
import { type } from '@lowdefy/helpers';

import lowdefyConfig from '../build/config.js';

// playwright-core does not bundle a browser (unlike @playwright/test) — it
// only drives one that is already installed. `channel: 'chrome'` picks up a
// system Chrome install first since that's more likely to already be
// present than a Playwright-managed Chromium in a dev environment.
async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    return await chromium.launch();
  }
}

// Module-level singleton — a browser process is expensive to start, so it is
// launched once and reused across calls. Cached as a promise so concurrent
// calls awaiting startup share the same launch instead of racing.
let browserPromise = null;

async function getBrowser() {
  if (type.isNone(browserPromise)) {
    // Clear the cache on failure so the next call retries the launch
    // instead of replaying a cached rejection forever.
    browserPromise = launchBrowser().catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  let browser = await browserPromise;
  if (!browser.isConnected()) {
    browserPromise = launchBrowser().catch((error) => {
      browserPromise = null;
      throw error;
    });
    browser = await browserPromise;
  }
  return browser;
}

// screenshotPage lets an agent visually verify a page rendered by the
// running dev server. `origin` should already include any configured
// basePath prefix that the caller can't derive itself (e.g. from a request
// URL) — here it's read from build/config.json (the same source app.js uses
// to mount the app) so callers only need to pass the bare origin.
async function screenshotPage({
  origin,
  pageId,
  fullPage = false,
  width = 1280,
  height = 800,
  timeout = 15000,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return { error: `screenshotPage requires an "origin" string. Received ${JSON.stringify(origin)}.` };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return { error: `screenshotPage requires a "pageId" string. Received ${JSON.stringify(pageId)}.` };
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const basePath = lowdefyConfig.basePath ?? '';
  const url = `${origin}${basePath}/${pageId}`;

  let context;
  try {
    context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout });
    } catch {
      // Pages with long-polling/SSE connections (reload, websockets) never
      // go network-idle — fall back to 'load' rather than failing outright.
      await page.goto(url, { waitUntil: 'load', timeout });
    }
    // Let post-load rendering (fonts, transitions, client-side state) settle.
    await page.waitForTimeout(300);
    const buffer = await page.screenshot({ type: 'png', fullPage });
    return { data: buffer.toString('base64'), mimeType: 'image/png' };
  } catch (error) {
    return { error: `Failed to screenshot "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default screenshotPage;
