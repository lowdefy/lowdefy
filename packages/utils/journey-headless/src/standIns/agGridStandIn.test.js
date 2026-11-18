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

import runTestJourney, { readLog, record } from '../tests/runTestJourney.js';

const ROWS = [
  { id: 1, name: 'Ada', meta: { city: 'Cape Town' }, active: false, archived: false },
  { id: 2, name: 'Grace', meta: { city: 'Durban' }, active: true, archived: true },
];

function gridPage({ properties = {}, events = {}, type = 'AgGridAlpine', blocks = [] } = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'people',
        type,
        properties: {
          rowData: ROWS,
          columnDefs: [
            { field: 'name' },
            { field: 'meta.city', colId: 'city' },
            { field: 'secret', hide: true },
            {
              headerName: 'Group',
              children: [{ field: 'id', pinned: 'left' }],
            },
            {
              field: 'actions',
              cell: {
                type: 'buttons',
                buttons: [
                  { eventName: 'onEdit', title: 'Edit', hiddenField: 'archived' },
                  { eventName: 'onView', title: 'View', disabledField: 'archived' },
                ],
              },
            },
            {
              field: 'menu',
              cell: {
                type: 'menu',
                items: [
                  { eventName: 'onArchive', title: 'Archive' },
                  { eventName: 'onDelete', titleField: 'name', hidden: true },
                ],
              },
            },
            { field: 'active', cell: { type: 'switch', eventName: 'onToggle' } },
          ],
          ...properties,
        },
        events: {
          onCellClick: [record('onCellClick')],
          onRowClick: [record('onRowClick')],
          onEdit: [record('onEdit')],
          onView: [record('onView')],
          onArchive: [record('onArchive')],
          onToggle: [record('onToggle')],
          ...events,
        },
      },
      ...blocks,
    ],
  };
}

test('AgGrid row by key clicks its first cell, pinned left first: onCellClick, then onRowClick', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage()],
    steps: [{ click: { blockId: 'people', rowKey: '2' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    [
      'onCellClick',
      {
        cell: { column: 'id', value: 2 },
        colId: 'id',
        row: ROWS[1],
        rowIndex: 1,
        selected: [],
      },
    ],
    ['onRowClick', { row: ROWS[1], rowIndex: 1, selected: [] }],
  ]);
});

test('AgGrid column reads its field as a dot path, by colId', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage({ events: { onRowClick: [] } })],
    steps: [{ click: { blockId: 'people', rowKey: '1', column: 'city' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)[0]).toEqual([
    'onCellClick',
    {
      cell: { column: 'meta.city', value: 'Cape Town' },
      colId: 'city',
      row: ROWS[0],
      rowIndex: 0,
      selected: [],
    },
  ]);
});

test('AgGrid fires only the events the block defines', async () => {
  const page = gridPage();
  delete page.blocks[0].events.onCellClick;
  const { log, result } = await runTestJourney({
    pages: [page],
    steps: [{ click: { blockId: 'people', rowKey: '1', column: 'name' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onRowClick', { row: ROWS[0], rowIndex: 0, selected: [] }]]);
});

test('AgGrid rowKey given as text matches a numeric id', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage()],
    steps: [{ click: { blockId: 'people', rowKey: '2', column: 'name' } }],
  });
  expect(result.passed).toBe(true);
  expect(log[0].event.row).toEqual(ROWS[1]);
  expect(ROWS[1].id).toBe(2);
});

test('AgGrid rows are keyed by the rowId field before id and _id', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      gridPage({
        properties: {
          rowId: 'code',
          rowData: [
            { id: 'a', code: 'x1', name: 'Ada' },
            { id: 'b', _id: 'c', name: 'Grace' },
          ],
        },
      }),
    ],
    steps: [
      { click: { blockId: 'people', rowKey: 'x1', column: 'name' } },
      { click: { blockId: 'people', rowKey: 'b', column: 'name' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(
    log.filter(({ name }) => name === 'onRowClick').map(({ event }) => event.row.name)
  ).toEqual(['Ada', 'Grace']);
});

test('AgGrid refuses a generated row key, naming the grid and the fix', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage()],
    steps: [{ click: { blockId: 'people', rowKey: '__row_1' } }],
  });
  expect(result.failure.message).toBe(
    'Row key "__row_1" is a key block "people" (AgGridAlpine) generated for a row with no key of its own, and it changes between renders: give rows an `id` or set `rowId`, and name the row by that key.'
  );
  expect(log).toEqual([]);
});

test('AgGrid refuses a key no row has, listing the keys and the fix for rows with none', async () => {
  const { result } = await runTestJourney({
    pages: [gridPage({ properties: { rowData: [...ROWS, { name: 'Linus' }] } })],
    steps: [{ click: { blockId: 'people', rowKey: '9' } }],
  });
  expect(result.failure.message).toBe(
    'AgGridAlpine "people" has no row with key "9". Its row keys: 1, 2. 1 of its rows have no key of their own: give rows an `id` or set `rowId`.'
  );
});

test('AgGrid refuses a key several rows share', async () => {
  const { result } = await runTestJourney({
    pages: [gridPage({ properties: { rowData: [ROWS[0], ROWS[0]] } })],
    steps: [{ click: { blockId: 'people', rowKey: '1' } }],
  });
  expect(result.failure.message).toBe(
    'Matched 2 rows with key "1" in AgGridAlpine "people"; a row key names one row, so give each row its own key.'
  );
});

test('AgGrid refuses a column it does not show', async () => {
  const { result } = await runTestJourney({
    pages: [gridPage()],
    steps: [{ click: { blockId: 'people', rowKey: '1', column: 'secret' } }],
  });
  expect(result.failure.message).toBe(
    'AgGridAlpine "people" shows no column "secret". Its shown columns: id, name, city, actions, menu, active.'
  );
});

test('AgGrid cell button fires its event and no row or cell event', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage({ type: 'AgGridLowdefy' })],
    steps: [{ click: { blockId: 'people', rowKey: '1', control: 'onEdit' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    [
      'onEdit',
      {
        row: ROWS[0],
        value: undefined,
        button: { eventName: 'onEdit', title: 'Edit' },
        buttonIndex: 0,
      },
    ],
  ]);
});

test('AgGrid button hidden by a row field is missing, and one disabled by a row field refuses', async () => {
  const hidden = await runTestJourney({
    pages: [gridPage()],
    steps: [{ click: { blockId: 'people', rowKey: '2', control: 'onEdit' } }],
  });
  expect(hidden.result.failure.message).toBe(
    'AgGridAlpine "people" has no control keyed "onEdit". Its control keys: onView, onArchive, onToggle.'
  );
  const disabled = await runTestJourney({
    pages: [gridPage()],
    steps: [{ click: { blockId: 'people', rowKey: '2', control: 'onView' } }],
  });
  expect(disabled.result.failure.message).toBe(
    'Control "onView" in row "2" of AgGridAlpine "people" is disabled.'
  );
  expect(disabled.log).toEqual([]);
});

test('AgGrid cell target on a column of buttons clicks the first shown button', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage()],
    steps: [
      { click: { blockId: 'people', rowKey: '1', column: 'actions' } },
      { click: { blockId: 'people', rowKey: '2', column: 'actions' } },
    ],
  });
  expect(result.failure.message).toBe(
    'Control "onView" in row "2" of AgGridAlpine "people" is disabled.'
  );
  expect(readLog(log).map(([name]) => name)).toEqual(['onEdit']);
});

test('AgGrid cell menu item fires its event; a click on the cell opens the menu and fires nothing', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage()],
    steps: [
      { click: { blockId: 'people', rowKey: '1', column: 'menu' } },
      { click: { blockId: 'people', rowKey: '1', control: 'onArchive' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    [
      'onArchive',
      {
        row: ROWS[0],
        value: undefined,
        item: { eventName: 'onArchive', title: 'Archive' },
        itemIndex: 0,
      },
    ],
  ]);
});

test('AgGrid switch writes its new value into the row before its event, and keeps it', async () => {
  const { log, result } = await runTestJourney({
    pages: [gridPage()],
    steps: [
      { click: { blockId: 'people', rowKey: '1', control: 'onToggle' } },
      { click: { blockId: 'people', rowKey: '1', column: 'active' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onToggle', { row: { ...ROWS[0], active: true }, value: false, newValue: true }],
    ['onToggle', { row: { ...ROWS[0], active: false }, value: true, newValue: false }],
  ]);
});

test('AgGrid switch write lasts until the block rowData changes', async () => {
  const page = gridPage({
    properties: { rowData: { _state: 'rows' } },
    blocks: [
      {
        id: 'reload',
        type: 'Button',
        events: { onClick: [{ id: 'set', type: 'SetState', params: { rows: [{ ...ROWS[0] }] } }] },
      },
    ],
  });
  page.events = { onInit: [{ id: 'init', type: 'SetState', params: { rows: ROWS } }] };
  const { log, result } = await runTestJourney({
    pages: [page],
    steps: [
      { click: { blockId: 'people', rowKey: '1', control: 'onToggle' } },
      { click: 'reload' },
      { click: { blockId: 'people', rowKey: '1', control: 'onToggle' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([, event]) => event.newValue)).toEqual([true, true]);
});

test('AgGrid cell controls come from the column, not defaultColDef', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      gridPage({
        properties: {
          columnDefs: [{ field: 'name' }],
          defaultColDef: { cell: { type: 'buttons', buttons: [{ eventName: 'onEdit' }] } },
        },
      }),
    ],
    steps: [{ click: { blockId: 'people', rowKey: '1' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual(['onCellClick', 'onRowClick']);
});

test('AgGrid control key in two columns needs a column, which narrows it', async () => {
  const columnDefs = [
    { field: 'name', cell: { type: 'buttons', buttons: [{ eventName: 'onOpen' }] } },
    { field: 'id', cell: { type: 'buttons', buttons: [{ eventName: 'onOpen' }] } },
  ];
  const twice = await runTestJourney({
    pages: [gridPage({ properties: { columnDefs }, events: { onOpen: [record('onOpen')] } })],
    steps: [{ click: { blockId: 'people', rowKey: '1', control: 'onOpen' } }],
  });
  expect(twice.result.failure.message).toBe(
    'AgGridAlpine "people" has 2 controls keyed "onOpen"; a control target names one.'
  );
  const narrowed = await runTestJourney({
    pages: [gridPage({ properties: { columnDefs }, events: { onOpen: [record('onOpen')] } })],
    steps: [{ click: { blockId: 'people', rowKey: '1', column: 'id', control: 'onOpen' } }],
  });
  expect(narrowed.result.passed).toBe(true);
  expect(narrowed.log[0].event.value).toBe(1);
});

test('AgGrid features that change the rows a person sees leave the step to the browser', async () => {
  const cases = [
    [{ pagination: true }, 'pagination'],
    [{ defaultColDef: { sort: 'asc' } }, 'a sort on column "name"'],
    [{ quickFilterValue: 'Ada' }, 'a quick filter (quickFilterValue)'],
    [{ rowSelection: { mode: 'singleRow' } }, 'row selection'],
    [{ treeData: true }, 'tree data'],
    [{ pinnedTopRowData: [{ id: 9 }] }, 'pinned rows'],
  ];
  for (const [properties, feature] of cases) {
    const { log, result } = await runTestJourney({
      pages: [gridPage({ properties })],
      steps: [{ click: { blockId: 'people', rowKey: '1' } }],
    });
    expect(result.browserOnly.reason).toBe(
      `AgGridAlpine "people" uses ${feature}, so the rows a person sees can differ from its rowData: the step runs in a browser.`
    );
    expect(log).toEqual([]);
  }
});

test('AgGrid filter set by a method leaves later row steps to the browser', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      gridPage({
        blocks: [
          {
            id: 'filter',
            type: 'Button',
            events: {
              onClick: [
                {
                  id: 'call',
                  type: 'CallMethod',
                  params: { blockId: 'people', method: 'setQuickFilter', args: ['Ada'] },
                },
              ],
            },
          },
        ],
      }),
    ],
    steps: [{ click: 'filter' }, { click: { blockId: 'people', rowKey: '1' } }],
  });
  expect(result.browserOnly).toEqual({
    index: 1,
    step: { click: { blockId: 'people', rowKey: '1' } },
    reason:
      'AgGridAlpine "people" uses a quick filter set by setQuickFilter, so the rows a person sees can differ from its rowData: the step runs in a browser.',
  });
  expect(log).toEqual([]);
});

test("AgGrid link, input and valueGetter cells are the browser's", async () => {
  const cases = [
    [{ field: 'name', cell: { type: 'link' } }, 'a link cell'],
    [{ field: 'name', cell: { type: 'textInput' } }, 'a textInput cell'],
    [{ field: 'name', valueGetter: 'data.name' }, 'a valueGetter'],
    [{ field: 'name', editable: true }, 'cell editing (editable)'],
    [
      { field: 'name', cell: { type: 'avatar', link: { pageId: 'person' } } },
      'an avatar cell with a link',
    ],
  ];
  for (const [column, what] of cases) {
    const { result } = await runTestJourney({
      pages: [gridPage({ properties: { columnDefs: [column] } })],
      steps: [{ click: { blockId: 'people', rowKey: '1' } }],
    });
    expect(result.browserOnly.reason).toBe(
      `Column "name" of AgGridAlpine "people" has ${what}, which the headless stand-in does not model: the step runs in a browser.`
    );
  }
});

test('AgGrid expect visible and hidden on a row by key and column', async () => {
  const { result } = await runTestJourney({
    pages: [gridPage()],
    steps: [
      { expect: { visible: { blockId: 'people', rowKey: '1' } } },
      { expect: { visible: { blockId: 'people', rowKey: '2', column: 'city' } } },
      { expect: { hidden: { blockId: 'people', rowKey: '3' } } },
      { expect: { hidden: { blockId: 'people', rowKey: '1', column: 'secret' } } },
    ],
  });
  expect(result.passed).toBe(true);
});

test('AgGrid expect visible fails for a missing row, and hidden for a shown one', async () => {
  const visible = await runTestJourney({
    pages: [gridPage()],
    steps: [{ expect: { visible: { blockId: 'people', rowKey: '3' } } }],
  });
  expect(visible.result.failure.message).toBe('Expected block "people" row key "3" to be visible.');
  const hidden = await runTestJourney({
    pages: [gridPage()],
    steps: [{ expect: { hidden: { blockId: 'people', rowKey: '1', column: 'name' } } }],
  });
  expect(hidden.result.failure.message).toBe(
    'Expected block "people" row key "1" column "name" to be hidden.'
  );
});

test('AgGrid expect reads whether the grid is shown', async () => {
  const page = gridPage();
  page.blocks[0].visible = false;
  const { result } = await runTestJourney({
    pages: [page],
    steps: [{ expect: { hidden: { blockId: 'people', rowKey: '1' } } }],
  });
  expect(result.passed).toBe(true);
  const visible = await runTestJourney({
    pages: [page],
    steps: [{ expect: { visible: { blockId: 'people', rowKey: '1' } } }],
  });
  expect(visible.result.failure.message).toBe('Expected block "people" row key "1" to be visible.');
});

test('AgGrid row removed from the data reads hidden', async () => {
  const page = gridPage({
    properties: { rowData: { _state: 'rows' } },
    blocks: [
      {
        id: 'remove',
        type: 'Button',
        events: { onClick: [{ id: 'set', type: 'SetState', params: { rows: [ROWS[1]] } }] },
      },
    ],
  });
  page.events = { onInit: [{ id: 'init', type: 'SetState', params: { rows: ROWS } }] };
  const { result } = await runTestJourney({
    pages: [page],
    steps: [
      { expect: { visible: { blockId: 'people', rowKey: '1' } } },
      { click: 'remove' },
      { expect: { hidden: { blockId: 'people', rowKey: '1' } } },
    ],
  });
  expect(result.passed).toBe(true);
});
