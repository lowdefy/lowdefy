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
import getSearchColumns from './getSearchColumns.js';
import pruneCondition from './pruneCondition.js';

// Client-side filtering (D6): `view.filter` compiled once into a row test, `view.search` matched
// against the searched columns' display text. A filter or search applied through the table
// (applyFiltering) arrives prepared as one flag per row, so this only gathers the kept rows; one
// set through the value (SetState, defaultView) is tested here. Kept rows keep their TanStack Row
// objects, so sorting and the body see the same rows as before, only fewer.
function filterRowModel(table) {
  const preFiltered = table.getPreFilteredRowModel();
  const source = preFiltered.rows;
  const { filter, search } = table.options.state;
  const context = table.options.lowdefyFiltering;
  const condition = pruneCondition(filter);
  const searchColumns = getSearchColumns({
    columns: context.columns,
    columnVisibility: table.atoms.columnVisibility.get(),
  });
  const { key } = getFilterResultKey({ condition, search });
  const prepared = getFilterResults({ rows: source, context, searchColumns }).get(key);
  const test = prepared ? null : createRowTest({ condition, search, context, searchColumns });
  if (!prepared && test === null) return preFiltered;

  const rows = [];
  const rowsById = {};
  for (let i = 0; i < source.length; i++) {
    const row = source[i];
    const kept = prepared ? prepared.flags[i] === 1 : test(row.original);
    if (!kept) continue;
    rows.push(row);
    rowsById[row.id] = row;
  }
  return { rows, flatRows: rows, rowsById };
}

export default filterRowModel;
