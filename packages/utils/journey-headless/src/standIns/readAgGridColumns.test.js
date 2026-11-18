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

import { expect, test } from 'vitest';

import readAgGridColumns from './readAgGridColumns.js';

// Each case's ids are what ag-grid-community 36.3.0 gave the same columnDefs (getColumns, colId),
// read by running the grid in jsdom on the entries processColDefs hands it.
test.each([
  [
    'anonymous columns',
    [{ headerName: 'A' }, { field: 'name' }, { headerName: 'B' }],
    ['0', 'name', '1'],
  ],
  [
    'repeated keys',
    [{ field: 'name' }, { field: 'name' }, { colId: 'name' }, { field: 'name_1' }],
    ['name', 'name_1', 'name_2', 'name_1_1'],
  ],
  [
    'numbers a column already uses',
    [{ headerName: 'A' }, { field: '0' }, { field: '1', colId: '2' }, { headerName: 'B' }],
    ['1', '0', '2', '3'],
  ],
  [
    'groups with no groupId',
    [
      { headerName: 'A' },
      { headerName: 'G', children: [{ headerName: 'B' }, { field: 'x' }] },
      { headerName: 'C' },
    ],
    ['0', '2', 'x', '3'],
  ],
  [
    'groupIds',
    [
      { groupId: 'x', children: [{ field: 'x' }] },
      { field: 'y' },
      { groupId: 'y', children: [{ headerName: 'C' }] },
    ],
    ['x_1', 'y', '0'],
  ],
  [
    'padding groups',
    [
      { headerName: 'A' },
      { children: [{ children: [{ headerName: 'B' }] }, { headerName: 'C' }] },
      { field: 'z' },
      { headerName: 'D' },
    ],
    ['0', '3', '4', 'z', '5'],
  ],
  [
    'padding groups past numbers a column uses',
    [
      { field: '0' },
      { field: '1' },
      { headerName: 'A' },
      { children: [{ headerName: 'B' }] },
      { headerName: 'C' },
    ],
    ['0', '1', '2', '7', '8'],
  ],
  [
    'hidden and pinned columns',
    [
      { headerName: 'A', hide: true },
      { headerName: 'B', pinned: 'right' },
      { field: 'n', hide: true },
      { field: 'n' },
    ],
    ['0', '1', 'n', 'n_1'],
  ],
  [
    'an empty group, which still adds a level',
    [{ field: '0' }, { headerName: 'A' }, { children: [] }, { headerName: 'B' }],
    ['0', '1', '5'],
  ],
  [
    'entries that are not objects, which reach AG Grid as columns with no key',
    ['note', { headerName: 'Actions' }, false, { field: 'name' }, { headerName: 'B' }],
    ['0', '1', '2', 'name', '3'],
  ],
  [
    'a column with children null beside others, each given its own padding',
    [
      { field: '0' },
      { field: '1' },
      { field: '2' },
      { children: [{ headerName: 'B', children: null }, { headerName: 'C' }, { headerName: 'E' }] },
      { children: [{ children: [{ headerName: 'X' }] }] },
      { headerName: 'F' },
      { headerName: 'G' },
    ],
    ['0', '1', '2', '4', '5', '6', '18', '19', '22'],
  ],
])('AgGrid column ids: %s', (_name, columnDefs, ids) => {
  expect(readAgGridColumns({ columnDefs }).all.map((column) => column.id)).toEqual(ids);
});

test('AgGrid column ids come from the column, not defaultColDef or a column type', () => {
  const { all } = readAgGridColumns({
    columnDefs: [{ headerName: 'A', type: 't' }, { headerName: 'B' }],
    defaultColDef: { field: 'q', colId: 'w' },
    columnTypes: { t: { field: 'tt' } },
  });
  expect(all.map((column) => [column.id, column.colDef.field])).toEqual([
    ['0', 'tt'],
    ['1', 'q'],
  ]);
});
