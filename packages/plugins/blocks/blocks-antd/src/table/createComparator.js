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

import compareSortKeys from './compareSortKeys.js';
import createSortKeyGetter from './createSortKeyGetter.js';

// A comparator over two cell values of this column, typed by the column's cell
// type: numbers numerically, dates by time, enums by option order, text with a
// shared collator (case- and accent-insensitive, numeric-aware). Empty values
// sort last in both directions, so pass `desc` rather than negating the result.
function createComparator({ column, desc = false }) {
  const getKey = createSortKeyGetter({ column });
  return function compare(a, b) {
    return compareSortKeys(getKey(a), getKey(b), desc);
  };
}

export default createComparator;
