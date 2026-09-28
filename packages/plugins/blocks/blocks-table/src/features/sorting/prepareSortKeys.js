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

import compareSortKeys from '@lowdefy/blocks-antd/table/compareSortKeys.js';

import createSortKeyCollector from './createSortKeyCollector.js';
import getCachedSortKeys from './getCachedSortKeys.js';
import getSortKeys from './getSortKeys.js';
import isNumericSortType from './isNumericSortType.js';
import rankSortKeys from './rankSortKeys.js';
import setCachedSortKeys from './setCachedSortKeys.js';
import sortInSlices from './sortInSlices.js';
import toFloatSortKeys from './toFloatSortKeys.js';
import yieldToMain from './yieldToMain.js';

// Below this many rows (or distinct text keys) the synchronous build is fast enough to run at once.
const SLICED_THRESHOLD = 5000;
const CHUNK_ROWS = 5000;
const BUDGET_MS = 12;

async function collectInSlices({ rows, accessor, getSortKey }) {
  const collector = createSortKeyCollector({ count: rows.length, getSortKey });
  // The header click paints (the table dims) before the first slice runs.
  await yieldToMain();
  let sliceStart = performance.now();
  for (let start = 0; start < rows.length; start += CHUNK_ROWS) {
    collector.collect({ rows, accessor, start, end: Math.min(rows.length, start + CHUNK_ROWS) });
    if (performance.now() - sliceStart >= BUDGET_MS) {
      await yieldToMain();
      sliceStart = performance.now();
    }
  }
  return collector.result();
}

// Builds a column's sort keys before its sort is applied, in time slices for large non-numeric
// columns (reading 100k values and the collator sort of their distinct strings are the steps that
// can exceed the D10 blocking budget). Resolves once the keys are cached for `rows`; they equal
// buildSortKeys' keys.
async function prepareSortKeys({ rows, column }) {
  if (getCachedSortKeys({ rows, columnId: column.id })) return;
  const { accessor, getSortKey, column: definition } = column.columnDef.meta;
  if (isNumericSortType(definition.type) || rows.length < SLICED_THRESHOLD) {
    getSortKeys({ rows, column });
    return;
  }
  const { rowKeys, distinct, numeric } = await collectInSlices({ rows, accessor, getSortKey });
  let keys;
  if (numeric) {
    keys = toFloatSortKeys(rowKeys);
  } else {
    const ordered =
      distinct.length < SLICED_THRESHOLD
        ? distinct.sort(compareSortKeys)
        : await sortInSlices({ items: distinct, compare: compareSortKeys });
    keys = rankSortKeys({ rowKeys, ordered });
  }
  setCachedSortKeys({ rows, columnId: column.id, keys });
}

export default prepareSortKeys;
