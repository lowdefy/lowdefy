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

import createRowTest from './createRowTest.js';
import getFilterResultKey from './getFilterResultKey.js';
import getFilterResults from './getFilterResults.js';
import yieldToMain from '../sorting/yieldToMain.js';

// Tests every row against a filter and search before they apply, yielding to the browser every
// `budgetMs`, so no filter (a nested condition over 100k rows, the first search formatting every
// searched cell) blocks input or paint. The flags are cached for the filtered row model, which
// then only gathers the kept rows. A search that extends an earlier one under the same filter
// (typing on) only tests the rows the earlier one kept.
async function prepareFilterResult({ rows, condition, search, context, searchColumns }) {
  const test = createRowTest({ condition, search, context, searchColumns });
  if (test === null) return;
  const results = getFilterResults({ rows, context, searchColumns });
  const { key, filterKey, searchKey } = getFilterResultKey({ condition, search });
  if (results.get(key)) return;
  const candidates = results.narrowest({ filterKey, searchKey });
  const flags = new Uint8Array(rows.length);
  const budgetMs = 12;
  let sliceStart = performance.now();
  for (let i = 0; i < rows.length; i++) {
    if (candidates !== null && candidates[i] === 0) continue;
    if (test(rows[i].original)) flags[i] = 1;
    if ((i & 31) === 0 && performance.now() - sliceStart >= budgetMs) {
      await yieldToMain();
      sliceStart = performance.now();
    }
  }
  results.set(key, { filterKey, searchKey, flags });
}

export default prepareFilterResult;
