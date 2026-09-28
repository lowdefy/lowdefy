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

import collectDistinct from './collectDistinct.js';
import isEmptySortValue from './isEmptySortValue.js';
import isNumericSortType from './isNumericSortType.js';
import rankValues from './rankValues.js';

function toNumber(value) {
  if (type.isNumber(value)) return value;
  if (type.isDate(value)) return value.getTime();
  if (type.isString(value) && value !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

// Precomputes one typed sort key per row, so the sort itself only compares numbers. Numeric types
// read the number; every other type ranks its distinct values once with the column comparator
// (the shared Intl.Collator for text), which also makes low-cardinality columns cheap. Empty
// values are NaN, which the sort places last in both directions. This is the synchronous path;
// prepareSortKeys builds the same keys in time slices ahead of a header click.
function buildSortKeys({ rows, accessor, comparator, columnType }) {
  if (isNumericSortType(columnType)) {
    const keys = new Float64Array(rows.length);
    for (let i = 0; i < rows.length; i++) {
      const value = accessor(rows[i].original);
      keys[i] = isEmptySortValue(value) ? NaN : toNumber(value);
    }
    return keys;
  }
  const { values, distinct } = collectDistinct({ rows, accessor });
  const ordered = distinct.sort(comparator);
  return rankValues({ values, ordered, comparator });
}

export default buildSortKeys;
