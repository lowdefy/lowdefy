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

// --page adds pages for the walks that take the run's default pages: a run
// without charters, or a charter that names no pages. When every charter in a
// --charters file names its own pages, nothing would walk the --page pages, so
// --page is refused rather than dropped without a word.
function checkManualPagesWalked({ charters, manualPages }) {
  if (manualPages.length === 0 || charters.length === 0) return;
  if (charters.some((charter) => type.isUndefined(charter.pages))) return;
  throw new Error(
    `--page ${manualPages
      .map((pageId) => `"${pageId}"`)
      .join(
        ', '
      )} would not be walked: every charter names its own pages. Add the pages to a charter, or leave one charter without pages to walk them.`
  );
}

export default checkManualPagesWalked;
