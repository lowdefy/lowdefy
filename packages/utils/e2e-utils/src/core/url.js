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

import { waitForReady } from './navigation.js';

// The client router's createUrl prepends basePath, so the pathname handed to it
// must have basePath stripped or a basePath app receives it twice.
function createTargetLocation({ basePath = '', href, key, value }) {
  const url = new URL(href);
  if (type.isNone(value)) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }
  const pathname =
    basePath && url.pathname.startsWith(basePath)
      ? url.pathname.slice(basePath.length)
      : url.pathname;
  return { pathname, query: url.searchParams.toString() };
}

// Navigates through the app's own router rather than calling history.pushState
// directly. A bare pushState updates the URL without notifying the router, so
// the page config is never re-fetched and Dynamic pages keep serving content
// resolved from the previous urlQuery. Routing through the router is what a
// Link or SetUrlQuery action in the app does.
async function setUrlQuery(page, { key, value }) {
  const { basePath, dynamic, href } = await page.evaluate(() => {
    const lowdefy = window.lowdefy;
    const router = lowdefy?._internal?.router;
    if (!router) {
      throw new Error('Lowdefy client not initialized. Call goto() before setting urlQuery.');
    }
    return {
      basePath: router.basePath ?? '',
      dynamic: lowdefy.contexts[`page:${lowdefy.pageId}`]?._internal?.pageConfig?.dynamic === true,
      href: window.location.href,
    };
  });

  // A router navigation always re-fetches the page config, and blocks reading
  // _url_query re-render only once that config is applied. Listening starts
  // before the navigation so the response cannot be missed.
  const pageConfigFetched = page
    .waitForResponse((response) => response.url().includes('/api/page/'), { timeout: 30000 })
    .catch((error) => {
      // A response that never arrives must not hang the suite — fall through and
      // let the test's own assertion report it. Anything else is a real fault.
      if (error.name !== 'TimeoutError') throw error;
    });

  // A Dynamic page's content is resolved server-side from urlQuery, and the
  // engine rebuilds its context whenever a new config object arrives (see
  // getContext). Waiting for that rebuild proves the re-resolved content is in
  // place; the response arriving only proves it is on its way. Static pages keep
  // a memoized context, so there is no identity change to wait for.
  const previousPageConfig = dynamic
    ? await page.evaluateHandle(
        () => window.lowdefy.contexts[`page:${window.lowdefy.pageId}`]._internal.pageConfig
      )
    : null;

  await page.evaluate(({ pathname, query }) => {
    // scroll: false keeps the viewport where it was — a query change is not a
    // page navigation from the test's point of view.
    window.lowdefy._internal.router.push({ pathname, query, scroll: false });
  }, createTargetLocation({ basePath, href, key, value }));

  await pageConfigFetched;

  if (previousPageConfig) {
    await page.waitForFunction(
      (previous) =>
        window.lowdefy.contexts[`page:${window.lowdefy.pageId}`]?._internal?.pageConfig !==
        previous,
      previousPageConfig,
      { timeout: 30000 }
    );
    await previousPageConfig.dispose();
  }

  await waitForReady(page);
}

export { createTargetLocation, setUrlQuery };
