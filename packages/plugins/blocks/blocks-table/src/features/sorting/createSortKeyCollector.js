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

// Collects each row's sort key from the shared column core's key getter (null for an empty
// value) and the distinct non-null keys, a range of rows at a time, so a large column can be read
// in time slices. The getter runs once per distinct primitive value, so low-cardinality columns
// (statuses, dates, owners) cost one key per value, not per row. `numeric` is true when every key
// is a number (numbers, dates, booleans, enums whose values all have options): those keys order
// the rows as they are, without ranking.
function createSortKeyCollector({ count, getSortKey }) {
  const rowKeys = new Array(count);
  const byValue = new Map();
  const distinct = new Set();
  let numeric = true;
  function collect({ rows, accessor, start, end }) {
    for (let i = start; i < end; i++) {
      const value = accessor(rows[i].original);
      let key;
      if (type.isPrimitive(value)) {
        key = byValue.get(value);
        if (key === undefined) {
          key = getSortKey(value);
          byValue.set(value, key);
        }
      } else {
        key = getSortKey(value);
      }
      rowKeys[i] = key;
      if (key !== null) {
        distinct.add(key);
        if (numeric && !type.isNumber(key)) numeric = false;
      }
    }
  }
  function result() {
    return { rowKeys, distinct: Array.from(distinct), numeric };
  }
  return { collect, result };
}

export default createSortKeyCollector;
