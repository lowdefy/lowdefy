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

import { buildPagePath, type } from '@lowdefy/helpers';

import pageContextExpression from './instanceKey.js';

async function waitForReady(page) {
  // Wait for the context of the page instance on screen to exist.
  await page.waitForFunction(`Boolean(${pageContextExpression})`, undefined, { timeout: 30000 });
}

// A target is a URL path, or { pageId, path, pathParams, urlQuery } where `path` is the page's
// path pattern (omit it for a page without placeholders).
function createPageUrl(target) {
  if (type.isString(target)) {
    return target;
  }
  const { pageId, path, pathParams, urlQuery } = target;
  const pathname = `/${buildPagePath({ pageId, path, pathParams })}`;
  const query = new URLSearchParams(urlQuery ?? {}).toString();
  return query ? `${pathname}?${query}` : pathname;
}

async function goto(page, target) {
  const path = createPageUrl(target);
  // domcontentloaded is sufficient — waitForReady gates on the Lowdefy client
  // context, which is a stronger readiness signal than the browser 'load' event.
  // Using 'load' can hang when pages have WebSocket connections or slow resources.
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await waitForReady(page);
}

async function waitForPage(page, target) {
  await page.waitForURL(createPageUrl(target), { waitUntil: 'domcontentloaded' });
  await waitForReady(page);
}

export { createPageUrl, goto, waitForReady, waitForPage };
