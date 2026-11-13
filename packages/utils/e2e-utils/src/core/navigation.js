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

import { buildPagePath, type, urlQuery } from '@lowdefy/helpers';

import pageContextExpression from './instanceKey.js';

// The page instance on screen is ready once its onInit has finished. Its context exists earlier:
// the engine creates it while the page first renders, before onInit runs, and the page shows no
// blocks and holds no onInit state until onInit is done.
async function waitForReady(page) {
  await page.waitForFunction(
    `${pageContextExpression}?._internal?.onInitDone === true`,
    undefined,
    { timeout: 30000 }
  );
}

// A target is a URL path, or { basePath, pageId, path, pathParams, urlQuery } where `path` is
// the page's path pattern (omit it for a page served at its id) and `basePath` the app's
// config.basePath (omit it for an app served at the root). A string target is used as written,
// so it carries its own basePath. The query is written as the app's links write it, so
// `_url_query` reads back numbers, booleans and objects.
function createPageUrl(target) {
  if (type.isString(target)) {
    return target;
  }
  const { basePath = '', pageId, path, pathParams, urlQuery: query } = target;
  const pathname = `${basePath}/${buildPagePath({ pageId, path, pathParams })}`;
  const search = urlQuery.stringify(query);
  return search ? `${pathname}?${search}` : pathname;
}

async function goto(page, target) {
  const path = createPageUrl(target);
  // domcontentloaded is sufficient — waitForReady gates on the page's onInit
  // having finished, which is a stronger readiness signal than the browser 'load' event.
  // Using 'load' can hang when pages have WebSocket connections or slow resources.
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await waitForReady(page);
}

async function waitForPage(page, target) {
  await page.waitForURL(createPageUrl(target), { waitUntil: 'domcontentloaded' });
  await waitForReady(page);
}

export { createPageUrl, goto, waitForReady, waitForPage };
