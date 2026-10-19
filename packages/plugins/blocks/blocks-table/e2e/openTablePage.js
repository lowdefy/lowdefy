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

// Opens a test page and waits until its tables show their rows. Until a lazy table's code has
// loaded it shows its fallback, which renders the table's header and skeleton rows (design D17),
// and a table whose rows are already there may keep that skeleton for its minimum time (the
// root's `data-skeleton-holding`): a spec that reads headers, rows or the scroller must not find
// the skeleton's instead. Tables that are still loading their rows (`data-loading-state="initial"`
// without the hold) are left to the spec.
async function openTablePage(page, pageId) {
  const response = await navigateToTestPage(page, pageId);
  await page.waitForFunction(
    () =>
      document.querySelector('[data-lf-fallback]') === null &&
      document.querySelector('[data-skeleton-holding]') === null &&
      document.querySelector('.lf-table, .lf-table-light-block') !== null
  );
  return response;
}

export default openTablePage;
