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

import { navigateToTestPage } from '@lowdefy/block-dev-e2e';

// Opens a test page and waits until its tables' code has loaded. Until then each lazy table shows
// its fallback, which renders the table's header and skeleton rows (design D17): a spec that
// reads headers, rows or the scroller must not find the fallback's instead.
async function openTablePage(page, pageId) {
  const response = await navigateToTestPage(page, pageId);
  await page.waitForFunction(
    () =>
      document.querySelector('[data-lf-fallback]') === null &&
      document.querySelector('.lf-table, .lf-table-light-block') !== null
  );
  return response;
}

export default openTablePage;
