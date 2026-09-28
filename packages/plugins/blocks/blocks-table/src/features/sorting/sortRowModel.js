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

// Sort keys are built for the core rows, whatever subset is sorted: a filtered subset (every
// row still a core row) reads its keys through the rows' core index, so a filter change never
// rebuilds a column's keys (a text column's collator ranking is the slow part). Rows that are
// not core rows (grouped rows) get keys of their own.
function getSubsetKeys({ table, rows }) {
  const coreRows = table.getCoreRowModel().rows;
  if (rows === coreRows) return { keyRows: rows, positions: null };
  const positions = new Uint32Array(rows.length);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (coreRows[row.index] !== row) return { keyRows: rows, positions: null };
    positions[i] = row.index;
  }
  return { keyRows: coreRows, positions };
}

// Sorts a Uint32Array of row indices over precomputed Float64 keys instead of sorting row objects
// with a comparator that reads values on every call (D10.7). Ties keep source order, and empty
// values (NaN keys) sort last whichever the direction.
function sortRowModel(table) {
  const preSorted = table.getPreSortedRowModel();
  const sorting = table.atoms.sorting?.get();
  const rows = preSorted.rows;
  if (!rows.length || !sorting?.length) return preSorted;

  const { keyRows, positions } = getSubsetKeys({ table, rows });
  const entries = [];
  sorting.forEach((sort) => {
    const column = table.getColumn(sort.id);
    if (!column || !column.getCanSort()) return;
    const columnKeys = getSortKeys({ rows: keyRows, column });
    let keys = columnKeys;
    if (positions !== null) {
      keys = new Float64Array(rows.length);
      for (let i = 0; i < rows.length; i++) keys[i] = columnKeys[positions[i]];
    }
    entries.push({ keys, desc: sort.desc === true });
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
