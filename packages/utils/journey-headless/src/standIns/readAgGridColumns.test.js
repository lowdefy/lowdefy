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
  [
    'a group whose children is not an array, which AG Grid still makes a group',
    [{ headerName: 'A' }, { children: {} }, { children: 'ab' }, { headerName: 'B' }],
    ['0', '3', '4', '5'],
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

test.each([
  ['null', [{ field: 'a' }, null], 'columnDefs.1'],
  ['undefined', [{ children: [{ field: 'a' }, undefined] }], 'columnDefs.0.children.1'],
])(
  'A %s column entry fails the step, as the browser grid does not render',
  (_name, columnDefs, path) => {
    expect(() => readAgGridColumns({ columnDefs }, { description: 'AgGrid "grid"' })).toThrow(
      expect.objectContaining({
        name: 'HeadlessStepError',
        message: expect.stringContaining(`AgGrid "grid" has a ${_name} column at ${path}`),
      })
    );
  }
);

// Each case's shown columns are what ag-grid-community 36.3.0 displayed for the same properties
// (getAllDisplayedColumns), read by running the grid in jsdom.
test.each([
  [
    'a closed group shows its always and closed columns',
    {
      columnDefs: [
        {
          headerName: 'G',
          children: [
            { field: 'a' },
            { field: 'b', columnGroupShow: 'open' },
            { field: 'c', columnGroupShow: 'closed' },
          ],
        },
      ],
    },
    ['a', 'c'],
  ],
  [
    'an openByDefault group shows its always and open columns',
    {
      columnDefs: [
        {
          headerName: 'G',
          openByDefault: true,
          children: [
            { field: 'a' },
            { field: 'b', columnGroupShow: 'open' },
            { field: 'c', columnGroupShow: 'closed' },
          ],
        },
      ],
    },
    ['a', 'b'],
  ],
  [
    'a group with nothing shown only while closed is not expandable, so its open columns show',
    {
      columnDefs: [
        {
          headerName: 'G',
          children: [
            { field: 'a', columnGroupShow: 'open' },
            { field: 'b', columnGroupShow: 'open' },
          ],
        },
      ],
    },
    ['a', 'b'],
  ],
  [
    'an open-only group inside a closed group hides with its leaves',
    {
      columnDefs: [
        {
          headerName: 'P',
          children: [
            { field: 'a' },
            {
              headerName: 'C',
              columnGroupShow: 'open',
              openByDefault: true,
              children: [{ field: 'x' }, { field: 'y' }],
            },
          ],
        },
      ],
    },
    ['a'],
  ],
  [
    'a group inside an open group applies its own columnGroupShow to its leaves',
    {
      columnDefs: [
        {
          headerName: 'P',
          openByDefault: true,
          children: [
            { field: 'a' },
            {
              headerName: 'C',
              columnGroupShow: 'open',
              children: [
                { field: 'x' },
                { field: 'y', columnGroupShow: 'open' },
                { field: 'z', columnGroupShow: 'closed' },
              ],
            },
          ],
        },
      ],
    },
    ['a', 'x', 'z'],
  ],
  [
    'a closed-only group inside a closed group shows, by its own columnGroupShow',
    {
      columnDefs: [
        {
          headerName: 'P',
          children: [
            { field: 'a', columnGroupShow: 'open' },
            {
              headerName: 'C',
              columnGroupShow: 'closed',
              children: [
                { field: 'x' },
                { field: 'y', columnGroupShow: 'open' },
                { field: 'z', columnGroupShow: 'closed' },
              ],
            },
          ],
        },
      ],
    },
    ['x', 'z'],
  ],
  [
    'a group three levels deep, each level by its own group',
    {
      columnDefs: [
        {
          headerName: 'A',
          openByDefault: true,
          children: [
            { field: 'a0' },
            {
              headerName: 'B',
              columnGroupShow: 'open',
              children: [
                { field: 'b0' },
                {
                  headerName: 'C',
                  columnGroupShow: 'closed',
                  openByDefault: true,
                  children: [{ field: 'c0' }, { field: 'c1', columnGroupShow: 'closed' }],
                },
              ],
            },
          ],
        },
      ],
    },
    ['a0', 'b0', 'c0'],
  ],
  [
    'a hidden column does not make its group expandable',
    {
      columnDefs: [
        {
          headerName: 'G',
          children: [
            { field: 'a', hide: true },
            { field: 'b', columnGroupShow: 'open' },
          ],
        },
      ],
    },
    ['b'],
  ],
  [
    "a column above the deepest level takes its padding group's defaultColGroupDef columnGroupShow",
    {
      defaultColGroupDef: { columnGroupShow: 'open' },
      columnDefs: [
        {
          headerName: 'P',
          groupId: 'p',
          columnGroupShow: 'always',
          children: [
            { field: 'a', columnGroupShow: 'closed' },
            { field: 'b' },
            { headerName: 'C', groupId: 'c', children: [{ field: 'x' }] },
          ],
        },
      ],
    },
    [],
  ],
  [
    'defaultColGroupDef openByDefault opens every group',
    {
      defaultColGroupDef: { openByDefault: true },
      columnDefs: [
        {
          headerName: 'G',
          children: [
            { field: 'a' },
            { field: 'b', columnGroupShow: 'open' },
            { field: 'c', columnGroupShow: 'closed' },
          ],
        },
      ],
    },
    ['a', 'b'],
  ],
  [
    'defaultColDef columnGroupShow applies to every column',
    {
      defaultColDef: { columnGroupShow: 'closed' },
      columnDefs: [
        {
          headerName: 'G',
          openByDefault: true,
          children: [{ field: 'a', columnGroupShow: 'open' }, { field: 'b' }],
        },
      ],
    },
    ['a'],
  ],
  [
    'columnGroupShow outside a group does nothing',
    {
      columnDefs: [
        { field: 'a', columnGroupShow: 'open' },
        { field: 'b', columnGroupShow: 'closed' },
      ],
    },
    ['a', 'b'],
  ],
  [
    'a padded column hides when defaultColGroupDef columnGroupShow is closed and its group is open',
    {
      defaultColGroupDef: { columnGroupShow: 'closed' },
      columnDefs: [
        {
          headerName: 'P',
          openByDefault: true,
          columnGroupShow: 'always',
          children: [
            { field: 'a', columnGroupShow: 'open' },
            { field: 'b' },
            { headerName: 'C', groupId: 'c', columnGroupShow: 'open', children: [{ field: 'x' }] },
          ],
        },
      ],
    },
    ['x'],
  ],
])('AgGrid shown columns: %s', (_name, properties, ids) => {
  expect(readAgGridColumns(properties).shown.map((column) => column.id)).toEqual(ids);
});
