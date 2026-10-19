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
import isNumericSortType from './isNumericSortType.js';
import rankSortKeys from './rankSortKeys.js';
import toFloatSortKeys from './toFloatSortKeys.js';

function readNumericKeys({ rows, accessor, getSortKey }) {
  const keys = new Float64Array(rows.length);
  for (let i = 0; i < rows.length; i++) {
    const key = getSortKey(accessor(rows[i].original));
    keys[i] = key === null ? NaN : key;
  }
  return keys;
}

// Precomputes one Float64 sort key per row, so the sort itself only compares numbers (D10.7).
// The keys come from the shared column core's `createSortKeyGetter` and text ranks from its
// `compareSortKeys`, so the index sort orders rows exactly as `createComparator({ column, desc })`
// does, empty values last in both directions (NaN keys). This is the synchronous path;
// prepareSortKeys builds the same keys in time slices ahead of a header click.
function buildSortKeys({ rows, accessor, getSortKey, columnType }) {
  if (isNumericSortType(columnType)) {
    return readNumericKeys({ rows, accessor, getSortKey });
  }
  const { rowKeys, distinct, numeric } = collectSortKeys({ rows, accessor, getSortKey });
  if (numeric) return toFloatSortKeys(rowKeys);
  return rankSortKeys({ rowKeys, ordered: distinct.sort(compareSortKeys) });
}

export default buildSortKeys;
