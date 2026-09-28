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

import collectSortKeys from './collectSortKeys.js';
import getCachedSortKeys from './getCachedSortKeys.js';
import getSortKeys from './getSortKeys.js';
import isNumericSortType from './isNumericSortType.js';
import rankSortKeys from './rankSortKeys.js';
import setCachedSortKeys from './setCachedSortKeys.js';
import sortInSlices from './sortInSlices.js';
import toFloatSortKeys from './toFloatSortKeys.js';

// Below this many distinct text keys the synchronous build is fast enough to run in the render.
const SLICED_THRESHOLD = 5000;

// Builds a column's sort keys before its sort is applied, in time slices for large text columns
// (the collator sort of 100k distinct strings is the one step that can exceed the D10 blocking
// budget). Resolves once the keys are cached for `rows`; they equal buildSortKeys' keys.
async function prepareSortKeys({ rows, column }) {
  if (getCachedSortKeys({ rows, columnId: column.id })) return;
  const { accessor, getSortKey, column: definition } = column.columnDef.meta;
  if (isNumericSortType(definition.type)) {
    getSortKeys({ rows, column });
    return;
  }
  const { rowKeys, distinct, numeric } = collectSortKeys({ rows, accessor, getSortKey });
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
