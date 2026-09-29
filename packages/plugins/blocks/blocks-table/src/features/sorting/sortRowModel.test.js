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

import createSortKeyGetter from '@lowdefy/blocks-antd/table/createSortKeyGetter.js';

import sortRowModel from './sortRowModel.js';
import sortKeysCache from './sortKeysCache.js';

function createTable({ values, subset }) {
  const coreRows = values.map((value, index) => ({
    id: String(index),
    index,
    original: { value },
  }));
  const rows = subset ? subset.map((index) => coreRows[index]) : coreRows;
  const column = {
    id: 'value',
    getCanSort: () => true,
    columnDef: {
      meta: {
        accessor: (row) => row.value,
        getSortKey: createSortKeyGetter({ column: { key: 'value', type: 'number' } }),
        column: { type: 'number' },
      },
    },
  };
  return {
    coreRows,
    table: {
      getCoreRowModel: () => ({ rows: coreRows }),
      getPreSortedRowModel: () => ({ rows, flatRows: rows, rowsById: {} }),
      atoms: { sorting: { get: () => [{ id: 'value', desc: false }] } },
      getColumn: () => column,
    },
  };
}

test('sortRowModel sorts a filtered subset with the keys of the core rows', () => {
  const { table, coreRows } = createTable({ values: [5, 1, 4, 2, 3], subset: [0, 2, 4] });
  const sorted = sortRowModel(table).rows;
  expect(sorted.map((row) => row.original.value)).toEqual([3, 4, 5]);
  // The keys were built once, for the core rows, not for the subset.
  expect(sortKeysCache.get(coreRows).get('value')).toBeInstanceOf(Float64Array);
});

test('sortRowModel builds keys of their own for rows that are not core rows', () => {
  const { table } = createTable({ values: [2, 1] });
  const grouped = [{ id: 'g', index: 0, original: { value: 9 } }];
  table.getPreSortedRowModel = () => ({ rows: grouped, flatRows: grouped, rowsById: {} });
  expect(sortRowModel(table).rows).toEqual(grouped);
});
