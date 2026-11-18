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
  { _id: 'a1', id: 'x', name: 'Ada', first: 'Ada', last: 'Lovelace', archived: false },
  { _id: 'b2', name: 'Grace', first: 'Grace', last: 'Hopper', archived: true },
];

function tablePage({ properties = {}, events = {}, pages = [] } = {}) {
  return [
    {
      id: 'home',
      blocks: [
        {
          id: 'people',
          type: 'Table',
          properties: {
            data: ROWS,
            columns: [
              'name',
              { key: 'full', kind: 'formula', template: '{{ first }} {{ last }}' },
              { key: 'secret', hidden: true },
              { key: 'code', field: '_id', pinned: 'start' },
              { key: 'tail', field: 'last', pinned: 'end' },
              {
                title: 'Actions',
                children: [
                  {
                    key: 'actions',
                    type: 'buttons',
                    cell: {
                      buttons: [
                        {
                          eventName: 'onEdit',
                          title: 'Edit',
                          hidden: { when: { key: 'archived', op: 'eq', value: true } },
                        },
                        { eventName: 'onView', title: 'View', disabled: true },
                      ],
                    },
                  },
                  {
                    key: 'menu',
                    type: 'menu',
                    cell: {
                      items: [
                        { eventName: 'onArchive', titleField: 'name' },
                        { eventName: 'onDelete', hiddenField: 'archived' },
                      ],
                    },
                  },
                ],
              },
            ],
            ...properties,
          },
          events: {
            onCellClick: [record('onCellClick')],
            onRowClick: [record('onRowClick')],
            onEdit: [record('onEdit')],
            onView: [record('onView')],
            onArchive: [record('onArchive')],
            onDelete: [record('onDelete')],
            ...events,
          },
        },
      ],
    },
    ...pages,
  ];
}

test('Table row by key clicks its first cell, pinned to the start first: onCellClick, then onRowClick', async () => {
  const { log, result } = await runTestJourney({
    pages: tablePage(),
    steps: [{ click: { blockId: 'people', rowKey: 'b2' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    [
      'onCellClick',
      { row: ROWS[1], rowKey: 'b2', column: { key: 'code', field: '_id' }, value: 'b2' },
    ],
    ['onRowClick', { row: ROWS[1], rowKey: 'b2', index: 1 }],
  ]);
});

test('Table formula column value is its template over the row', async () => {
  const { log, result } = await runTestJourney({
    pages: tablePage(),
    steps: [{ click: { blockId: 'people', rowKey: 'a1', column: 'full' } }],
  });
  expect(result.passed).toBe(true);
  expect(log[0].event).toEqual({
    row: ROWS[0],
    rowKey: 'a1',
    column: { key: 'full', field: 'full' },
    value: 'Ada Lovelace',
  });
});

test('Table rowKey reads its path and nothing else; a numeric key matches as text', async () => {
  const data = [
    { meta: { code: 7 }, _id: 'z', name: 'Ada' },
    { meta: { code: { n: 1 } }, name: 'Grace' },
  ];
  const { log, result } = await runTestJourney({
    pages: tablePage({ properties: { data, rowKey: 'meta.code' } }),
    steps: [
      { click: { blockId: 'people', rowKey: '7', column: 'name' } },
      { click: { blockId: 'people', rowKey: '{"n":1}', column: 'name' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(log.filter(({ name }) => name === 'onRowClick').map(({ event }) => event.rowKey)).toEqual([
    7,
    '{"n":1}',
  ]);
  const byId = await runTestJourney({
    pages: tablePage({ properties: { data, rowKey: 'meta.code' } }),
    steps: [{ click: { blockId: 'people', rowKey: 'z' } }],
  });
  expect(byId.result.failure.message).toBe(
    'Table "people" has no row with key "z". Its row keys: 7, {"n":1}.'
  );
});

test('Table rows are keyed by _id, then id', async () => {
  const { result } = await runTestJourney({
    pages: tablePage(),
    steps: [{ click: { blockId: 'people', rowKey: 'x' } }],
  });
  expect(result.failure.message).toBe(
    'Table "people" has no row with key "x". Its row keys: a1, b2.'
  );
});

test('Table refuses a generated row key, naming the grid and the fix', async () => {
  const { result } = await runTestJourney({
    pages: tablePage({ properties: { data: [{ name: 'Ada' }] } }),
    steps: [{ click: { blockId: 'people', rowKey: '__row_1' } }],
  });
  expect(result.failure.message).toBe(
    'Row key "__row_1" is a key block "people" (Table) generated for a row with no key of its own, and it changes between renders: give rows an `_id` or `id`, or set `rowKey`, and name the row by that key.'
  );
});

test('Table button hidden by a { when } condition is missing; a disabled one refuses', async () => {
  const hidden = await runTestJourney({
    pages: tablePage(),
    steps: [{ click: { blockId: 'people', rowKey: 'b2', control: 'onEdit' } }],
  });
  expect(hidden.result.failure.message).toBe(
    'Table "people" has no control keyed "onEdit". Its control keys: onView, onArchive.'
  );
  const disabled = await runTestJourney({
    pages: tablePage(),
    steps: [{ click: { blockId: 'people', rowKey: 'a1', control: 'onView' } }],
  });
  expect(disabled.result.failure.message).toBe(
    'Control "onView" in row "a1" of Table "people" is disabled.'
  );
});

test('Table cell button fires its event with the row key, and no row or cell event', async () => {
  const { log, result } = await runTestJourney({
    pages: tablePage(),
    steps: [
      { click: { blockId: 'people', rowKey: 'a1', control: 'onEdit' } },
      { click: { blockId: 'people', rowKey: 'a1', column: 'actions' } },
    ],
  });
  expect(result.passed).toBe(true);
  const event = {
    row: ROWS[0],
    rowKey: 'a1',
    value: undefined,
    button: { eventName: 'onEdit', title: 'Edit' },
    buttonIndex: 0,
  };
  expect(readLog(log)).toEqual([
    ['onEdit', event],
    ['onEdit', event],
  ]);
});

test('Table cell target on a column whose first shown button is disabled refuses', async () => {
  const { log, result } = await runTestJourney({
    pages: tablePage(),
    steps: [{ click: { blockId: 'people', rowKey: 'b2', column: 'actions' } }],
  });
  expect(result.failure.message).toBe(
    'Control "onView" in row "b2" of Table "people" is disabled.'
  );
  expect(log).toEqual([]);
});

test('Table cell menu item fires its event; a click on the cell opens the menu and fires nothing', async () => {
  const { log, result } = await runTestJourney({
    pages: tablePage(),
    steps: [
      { click: { blockId: 'people', rowKey: 'a1', column: 'menu' } },
      { click: { blockId: 'people', rowKey: 'b2', control: 'onArchive' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    [
      'onArchive',
      {
        row: ROWS[1],
        rowKey: 'b2',
        value: undefined,
        item: { eventName: 'onArchive', title: 'Grace' },
        itemIndex: 0,
      },
    ],
  ]);
});

test('Table control key in several rows without rowKey fails with the count', async () => {
  const { result } = await runTestJourney({
    pages: tablePage(),
    steps: [{ click: { blockId: 'people', control: 'onArchive' } }],
  });
  expect(result.failure.message).toBe(
    'Table "people" has 2 controls keyed "onArchive"; a control target names one.'
  );
});

test('Table rowLink is followed when there is no onRowClick, and not when there is', async () => {
  const pages = [{ id: 'person', blocks: [{ id: 'title', type: 'Paragraph' }] }];
  const rowLink = { pageId: 'person', urlQuery: { id: '_id' } };
  const unclickable = tablePage({ properties: { rowLink }, pages });
  delete unclickable[0].blocks[0].events.onRowClick;
  const linked = await runTestJourney({
    pages: unclickable,
    steps: [
      { click: { blockId: 'people', rowKey: 'a1', column: 'name' } },
      { expect: { url: { contains: 'person?id=a1' } } },
      { expect: { visible: 'title' } },
    ],
  });
  expect(linked.result.passed).toBe(true);
  expect(readLog(linked.log).map(([name]) => name)).toEqual(['onCellClick']);
  const clicked = await runTestJourney({
    pages: tablePage({ properties: { rowLink }, pages }),
    steps: [
      { click: { blockId: 'people', rowKey: 'a1', column: 'name' } },
      { expect: { visible: { blockId: 'people', rowKey: 'a1' } } },
    ],
  });
  expect(clicked.result.passed).toBe(true);
  expect(readLog(clicked.log).map(([name]) => name)).toEqual(['onCellClick', 'onRowClick']);
});

test('Table collapsible group shows its columns by showWhen', async () => {
  const columns = [
    {
      title: 'Person',
      collapsible: true,
      collapsed: true,
      children: [
        { key: 'first', showWhen: 'open' },
        { key: 'last', showWhen: 'closed' },
      ],
    },
    'name',
  ];
  const { log, result } = await runTestJourney({
    pages: tablePage({ properties: { columns } }),
    steps: [
      { click: { blockId: 'people', rowKey: 'a1' } },
      { expect: { hidden: { blockId: 'people', rowKey: 'a1', column: 'first' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(log[0].event.column).toEqual({ key: 'last', field: 'last' });
});

test('Table properties the stand-in does not model leave the step to the browser', async () => {
  const cases = [
    [{ pagination: true }, '`pagination`'],
    [{ views: [] }, '`views`'],
    [{ rowSelection: { type: 'checkbox' } }, '`rowSelection`'],
    [{ data: { mode: 'server', request: 'people' } }, 'server data'],
    [{ somethingNew: true }, '`somethingNew`'],
  ];
  for (const [properties, feature] of cases) {
    const { log, result } = await runTestJourney({
      pages: tablePage({ properties }),
      steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
    });
    expect(result.browserOnly.reason).toBe(
      `Table "people" uses ${feature}, which the headless stand-in does not model: the step runs in a browser.`
    );
    expect(log).toEqual([]);
  }
  const looks = await runTestJourney({
    pages: tablePage({ properties: { bordered: true, size: 'compact', pagination: false } }),
    steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
  });
  expect(looks.result.passed).toBe(true);
});

test('Table enrichment and editable columns leave the step to the browser', async () => {
  const cases = [
    [
      { columns: [{ key: 'name', kind: 'ai', prompt: 'Who is {{ name }}?' }] },
      'enrichment columns',
    ],
    [
      { columns: [{ title: 'G', children: [{ key: 'name', status: { field: 's' } }] }] },
      'enrichment columns',
    ],
    [{ columns: ['name'], defaultColumn: { editable: true } }, 'an editable column'],
  ];
  for (const [properties, feature] of cases) {
    const { log, result } = await runTestJourney({
      pages: tablePage({ properties }),
      steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
    });
    expect(result.browserOnly.reason).toBe(
      `Table "people" uses ${feature}, which the headless stand-in does not model: the step runs in a browser.`
    );
    expect(log).toEqual([]);
  }
});

test("Table link cells are the browser's", async () => {
  const { result } = await runTestJourney({
    pages: tablePage({ properties: { columns: [{ key: 'name', type: 'link' }] } }),
    steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Column "name" of Table "people" is a link cell, which draws a link a click lands on: the step runs in a browser.'
  );
});

function htmlColumnPage(cell) {
  return tablePage({ properties: { columns: [{ key: 'name', type: 'html', cell }] } });
}

test("Table html cell holding a link or data-event is the browser's", async () => {
  const cells = [
    { template: '<a href="/people/{{ row._id }}">{{ value }}</a>' },
    { template: '<span data-event="onOpen">{{ value }}</span>' },
    { template: '<a data-page-id="person">{{ value }}</a>' },
  ];
  for (const cell of cells) {
    const { log, result } = await runTestJourney({
      pages: htmlColumnPage(cell),
      steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
    });
    expect(result.browserOnly.reason).toBe(
      'Column "name" of Table "people" has an html cell holding a link or data-event, which the headless stand-in does not model: the step runs in a browser.'
    );
    expect(log).toEqual([]);
  }
});

test("Table html cell value with a link is the browser's, read per row", async () => {
  const rows = [
    { _id: 'a1', name: '<a href="https://example.com">Ada</a>' },
    { _id: 'b2', name: '<b>Grace</b>' },
  ];
  const pages = tablePage({ properties: { data: rows, columns: [{ key: 'name', type: 'html' }] } });
  const linked = await runTestJourney({
    pages,
    steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
  });
  expect(linked.result.browserOnly.reason).toMatch(/^Column "name" of Table "people" has an html/);
  const plain = await runTestJourney({
    pages,
    steps: [{ click: { blockId: 'people', rowKey: 'b2' } }],
  });
  expect(plain.result.passed).toBe(true);
  expect(readLog(plain.log).map(([name]) => name)).toEqual(['onCellClick', 'onRowClick']);
});

test('Table plain html cell stays headless, as does a link the sanitiser strips', async () => {
  const cells = [
    { template: '<b>{{ value }}</b> <em>{{ row.last }}</em>' },
    { template: '<a href="javascript:alert(1)">{{ value }}</a>' },
  ];
  for (const cell of cells) {
    const { log, result } = await runTestJourney({
      pages: htmlColumnPage(cell),
      steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
    });
    expect(result.passed).toBe(true);
    expect(readLog(log)).toEqual([
      [
        'onCellClick',
        { row: ROWS[0], rowKey: 'a1', column: { key: 'name', field: 'name' }, value: 'Ada' },
      ],
      ['onRowClick', { row: ROWS[0], rowKey: 'a1', index: 0 }],
    ]);
  }
});

test('Table expect visible and hidden on a row by key and column', async () => {
  const { result } = await runTestJourney({
    pages: tablePage(),
    steps: [
      { expect: { visible: { blockId: 'people', rowKey: 'a1', column: 'full' } } },
      { expect: { hidden: { blockId: 'people', rowKey: 'a1', column: 'secret' } } },
      { expect: { hidden: { blockId: 'people', rowKey: 'zz' } } },
    ],
  });
  expect(result.passed).toBe(true);
  const missing = await runTestJourney({
    pages: tablePage(),
    steps: [{ expect: { visible: { blockId: 'people', rowKey: 'zz' } } }],
  });
  expect(missing.result.failure.message).toBe(
    'Expected block "people" row key "zz" to be visible.'
  );
});

test('Table with a view in its value leaves the step to the browser', async () => {
  const pages = tablePage();
  pages[0].events = {
    onInit: [
      {
        id: 'init',
        type: 'SetState',
        params: { people: { view: { sort: [{ key: 'name', desc: true }] } } },
      },
    ],
  };
  const { log, result } = await runTestJourney({
    pages,
    steps: [{ click: { blockId: 'people', rowKey: 'a1' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Table "people" uses a view in its value, which the headless stand-in does not model: the step runs in a browser.'
  );
  expect(log).toEqual([]);
});

test('Table row methods leave the journey to the browser at the call, naming the method', async () => {
  const cases = [
    ['setFilter', [{ key: 'name', op: 'eq', value: 'Ada' }], 'sets a filter'],
    ['setSearch', ['Ada'], 'sets a search'],
    ['applyTransaction', [{ remove: ['a1'] }], 'changes its rows'],
  ];
  for (const [method, args, what] of cases) {
    const pages = tablePage();
    pages[0].blocks.push({
      id: 'change',
      type: 'Button',
      events: {
        onClick: [{ id: 'call', type: 'CallMethod', params: { blockId: 'people', method, args } }],
      },
    });
    const { log, result } = await runTestJourney({
      pages,
      steps: [{ click: 'change' }, { click: { blockId: 'people', rowKey: 'a1' } }],
    });
    expect(result.browserOnly).toEqual({
      index: 0,
      step: { click: 'change' },
      reason: `CallMethod ${method} on Table "people" ${what}, which the headless stand-in does not model: the step runs in a browser.`,
    });
    expect(log).toEqual([]);
  }
});
