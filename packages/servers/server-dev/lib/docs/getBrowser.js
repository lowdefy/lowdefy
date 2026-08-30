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
import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

import lowdefyConfig from '../build/config.js';
import isPageReady from './isPageReady.js';
import { HEADLESS_USER_COOKIE } from '../server/auth/headlessUser.js';
import resolveHeadlessUser from '../server/auth/resolveHeadlessUser.js';

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
// launched once and reused across every headless caller (screenshots, state
// inspection, operator evaluation). Cached as a promise so concurrent calls
// awaiting startup share the same launch instead of racing.
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

// `origin` should already include any configured basePath prefix that the
// caller can't derive itself (e.g. from a request URL) — here it's read from
// build/config.json (the same source app.js uses to mount the app) so
// callers only need to pass the bare origin. `urlQuery` (an object) is
// appended as a query string, serialized by the same helper the engine uses
// for Link urlQuery, so a page reads it back through _url_query unchanged.
function buildPageUrl({ origin, pageId, urlQuery }) {
  const basePath = lowdefyConfig.basePath ?? '';
  const url = `${origin}${basePath}/${pageId}`;
  const query = urlQueryFn.stringify(urlQuery);
  if (query === '') {
    return url;
  }
  return `${url}?${query}`;
}

// Opens a fresh browser context + page at the app's pageId route. Callers
// obtain `browser` via getBrowser() themselves so they can map a launch
// failure to their own "no browser available" error message, separate from
// navigation failures.
async function openPage({
  browser,
  origin,
  pageId,
  user,
  urlQuery,
  width = 1280,
  height = 800,
  timeout = 15000,
}) {
  const url = buildPageUrl({ origin, pageId, urlQuery });
  // Resolved before the context is created so an invalid `user` can't leave an
  // orphaned context behind.
  const injectedUser = resolveHeadlessUser({ user });
  const context = await browser.newContext({ viewport: { width, height } });
  // From here a failure must close the context before rethrowing: callers only
  // learn about the context from the return value, so an error thrown mid-open
  // (a navigation that times out on both waits, a crashed page) would otherwise
  // leak a browser context — and its renderer process — on every failed call.
  try {
    // Inject an authenticated user so auth-protected pages don't 404 for the
    // cookieless headless context. Mirrors the e2e user-cookie pattern; scoped to
    // `origin` so it rides along on the same-origin /api/* fetches.
    await context.addCookies([
      {
        name: HEADLESS_USER_COOKIE,
        value: Buffer.from(JSON.stringify(injectedUser)).toString('base64'),
        url: origin,
      },
    ]);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout });
    } catch {
      // Pages with long-polling/SSE connections (reload, websockets) never
      // go network-idle — fall back to 'load' rather than failing outright.
      await page.goto(url, { waitUntil: 'load', timeout });
    }
    // The engine builds the page context (and runs onInit + initial requests)
    // after the bundle loads — 'load'/'networkidle' fire before that. Every
    // caller (screenshot, inspect, eval, checkpoint load) needs the app's async
    // lifecycle to have settled, not just the bundle to have loaded, so wait on
    // isPageReady. Tolerant: on timeout proceed with ready: false and let the
    // caller surface what it finds — a snapshot of a hung page is still useful
    // signal, and a far better answer than a tool failure.
    let ready = true;
    await page.waitForFunction(isPageReady, pageId, { timeout }).catch(() => {
      ready = false;
    });
    return { context, page, ready, url };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}

export { getBrowser, openPage, buildPageUrl };
