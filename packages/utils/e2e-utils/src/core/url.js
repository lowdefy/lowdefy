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

import { waitForReady } from './navigation.js';

// Navigates through the app's own router rather than calling history.pushState
// directly. A bare pushState updates the URL without notifying the router, so
// the page config is never re-fetched and Dynamic pages keep serving content
// resolved from the previous urlQuery. Routing through the router is what a
// Link or SetUrlQuery action in the app does.
async function setUrlQuery(page, { key, value }) {
  // A router navigation always re-fetches the page config, so wait for that
  // response before returning — otherwise a test can read a Dynamic page before
  // the content resolved from the new urlQuery has been applied. Listening
  // starts before the navigation so the response cannot be missed. On timeout,
  // fall through and let the test's own assertion report the failure.
  const pageConfigFetched = page
    .waitForResponse((response) => response.url().includes('/api/page/'), { timeout: 30000 })
    .catch(() => undefined);

  await page.evaluate(
    ({ k, v }) => {
      const router = window.lowdefy?._internal?.router;
      if (!router) {
        throw new Error('Lowdefy client not initialized. Call goto() before setting urlQuery.');
      }
      const url = new URL(window.location.href);
      if (v === null || v === undefined) {
        url.searchParams.delete(k);
      } else {
        url.searchParams.set(k, v);
      }
      const basePath = router.basePath ?? '';
      const pathname =
        basePath && url.pathname.startsWith(basePath)
          ? url.pathname.slice(basePath.length)
          : url.pathname;
      // scroll: false keeps the viewport where it was — a query change is not a
      // page navigation from the test's point of view.
      router.push({ pathname, query: url.searchParams.toString(), scroll: false });
    },
    { k: key, v: value }
  );

  await pageConfigFetched;
  await waitForReady(page);
}

export { setUrlQuery };
