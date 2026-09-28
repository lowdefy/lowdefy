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

import getSortKeys from './getSortKeys.js';

// Sorts a Uint32Array of row indices over precomputed Float64 keys instead of sorting row objects
// with a comparator that reads values on every call (D10.7). Ties keep source order, and empty
// values (NaN keys) sort last whichever the direction.
function sortRowModel(table) {
  const preSorted = table.getPreSortedRowModel();
  const sorting = table.atoms.sorting?.get();
  const rows = preSorted.rows;
  if (!rows.length || !sorting?.length) return preSorted;

  const entries = [];
  sorting.forEach((sort) => {
    const column = table.getColumn(sort.id);
    if (!column || !column.getCanSort()) return;
    entries.push({ keys: getSortKeys({ rows, column }), desc: sort.desc === true });
  });
  if (!entries.length) return preSorted;

  const count = rows.length;
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[i] = i;
  const entryCount = entries.length;
  order.sort((a, b) => {
    for (let e = 0; e < entryCount; e++) {
      const { keys, desc } = entries[e];
      const left = keys[a];
      const right = keys[b];
      if (left !== right) {
        const leftEmpty = Number.isNaN(left);
        const rightEmpty = Number.isNaN(right);
        if (leftEmpty && rightEmpty) continue;
        if (leftEmpty) return 1;
        if (rightEmpty) return -1;
        return desc ? right - left : left - right;
      }
    }
    return a - b;
  });

  const sortedRows = new Array(count);
  for (let i = 0; i < count; i++) sortedRows[i] = rows[order[i]];
  return { rows: sortedRows, flatRows: sortedRows, rowsById: preSorted.rowsById };
}

export default sortRowModel;
