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

import runTestJourney, { methodButton, readLog, record } from './tests/runTestJourney.js';

// Rows that fire the same event with no data-id, each with an Open button, a popover whose Archive
// asks first, and a Remove that asks first.
const ROWS = [
  '<div data-event="onPick" data-name="Acme"><span>Acme Ltd</span><span>acme@example.com</span></div>',
  '<button data-event="onOpen" data-row="1">Open</button>',
  '<div data-event="onPick" data-name="Beta"><span>Beta Corp</span></div>',
  '<button data-event="onOpen" data-row="2">Open</button>',
  '<span data-popover="more">More</span>',
  '<div data-popover-content="more"><button data-event="onArchive">Archive</button></div>',
  '<button data-event="onRemove">Remove</button>',
].join('');

function rowsPage({ blocks = [], dataEvents, html = ROWS } = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'rows',
        type: 'ClickableHtml',
        properties: {
          dataEvents: dataEvents ?? [
            'onPick',
            'onOpen',
            { name: 'onArchive', confirm: 'Archive it?' },
            { name: 'onRemove', confirm: 'Remove it?' },
          ],
          html,
        },
        events: {
          onPick: [record('onPick')],
          onOpen: [record('onOpen')],
          onArchive: [record('onArchive')],
          onRemove: [record('onRemove')],
        },
      },
      ...blocks,
    ],
  };
}

const other = { id: 'other', type: 'Button', events: { onClick: [record('other')] } };

test('a containing target clicks the row it names, and records no control that names two rows', async () => {
  const { log, result } = await runTestJourney({
    pages: [rowsPage()],
    steps: [
      { click: { containing: 'beta corp' } },
      { click: { blockId: 'rows', text: 'Open', nth: 1 } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onPick', { name: 'Beta' }],
    ['onOpen', { row: '2' }],
  ]);
  expect(result.steps.map((step) => step.control)).toEqual([undefined, undefined]);
});

test('a text click records the control it landed on when no other element carries it', async () => {
  const { result } = await runTestJourney({
    pages: [rowsPage({ html: '<button data-event="onOpen" data-id="r1">Open</button>' })],
    steps: [{ click: { text: 'Open' } }],
  });
  expect(result.steps[0].control).toEqual({ blockId: 'rows', control: 'onOpen', rowKey: 'r1' });
});

test('several matches with no nth fail naming each, and an nth past the last fails', async () => {
  const several = await runTestJourney({
    pages: [rowsPage()],
    steps: [{ click: { text: 'Open' } }],
  });
  expect(several.result.failure.message).toBe(
    'Matched 2 controls with text "Open" in the page; add nth: 0..1, or a blockId/row to narrow it. They are: data-event "onOpen" in ClickableHtml "rows"; data-event "onOpen" in ClickableHtml "rows".'
  );
  const past = await runTestJourney({
    pages: [rowsPage()],
    steps: [{ click: { blockId: 'rows', text: 'Open', nth: 2 } }],
  });
  expect(past.result.failure.message).toBe(
    'No control with text "Open" at nth 2 in block "rows": it matched 2 controls.'
  );
});

test('text no ClickableHtml shows, or another block may show too, goes to the browser at once', async () => {
  const started = Date.now();
  const none = await runTestJourney({
    pages: [{ id: 'home', blocks: [{ ...other, properties: { title: 'Save' } }] }],
    steps: [{ click: { text: 'Save' } }],
    stepTimeout: 2000,
  });
  expect(Date.now() - started).toBeLessThan(1500);
  expect(none.result.browserOnly.reason).toBe(
    'Button "other" may show the text "Save", and a headless run reads text only in ClickableHtml blocks: the step runs in a browser.'
  );
  const spread = await runTestJourney({
    pages: [
      rowsPage({
        blocks: [{ id: 'note', type: 'Markdown', properties: { content: '**Beta** Corp' } }],
      }),
    ],
    steps: [{ click: { containing: 'Beta Corp' } }],
  });
  expect(spread.result.browserOnly.reason).toContain(
    'Markdown "note" may show text containing "Beta Corp"'
  );
});

test('a popover opens and closes on its trigger, and its button asks from inside it', async () => {
  const { log, result } = await runTestJourney({
    pages: [rowsPage()],
    steps: [
      { expect: { hidden: { text: 'Archive' } } },
      { click: { text: 'More' } },
      { expect: { visible: { text: 'Archive' } } },
      { click: { text: 'More' } },
      { expect: { hidden: { text: 'Archive' } } },
      { click: { text: 'More' } },
      { click: { text: 'Archive' } },
      { expect: { visible: { containing: 'Archive it?' } } },
      { click: { text: 'Cancel' } },
      { expect: { visible: { text: 'Archive' } } },
      { click: { text: 'Archive' } },
      { click: { text: 'OK' } },
      { expect: { hidden: { text: 'Archive' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toBeUndefined();
  expect(readLog(log)).toEqual([['onArchive', {}]]);
});

test('a click the open popover or confirm may cover goes to the browser', async () => {
  const outside = await runTestJourney({
    pages: [rowsPage({ blocks: [other] })],
    steps: [{ click: { text: 'More' } }, { click: 'other' }],
  });
  expect(outside.result.browserOnly).toEqual({
    index: 1,
    step: { click: 'other' },
    reason:
      'ClickableHtml "rows" has its popover open, which may cover what the step clicks: the step runs in a browser.',
  });
  const inside = await runTestJourney({
    pages: [rowsPage()],
    steps: [{ click: { text: 'Remove' } }, { click: { containing: 'Beta Corp' } }],
  });
  expect(inside.result.browserOnly.reason).toBe(
    'ClickableHtml "rows" has its confirm open, which may cover what the step clicks: the step runs in a browser.'
  );
});

test("the confirm's OK and Cancel go to the browser in an app with i18n locales", async () => {
  const { result } = await runTestJourney({
    i18n: { defaultLocale: 'af', locales: [{ code: 'af' }] },
    pages: [rowsPage()],
    steps: [{ click: { text: 'Remove' } }, { click: { text: 'Cancel' } }],
  });
  expect(result.browserOnly).toMatchObject({
    index: 1,
    reason:
      'In a ClickableHtml, the open confirm labels its buttons in the app locale: the step runs in a browser.',
  });
});

test('a match behind an open Modal, a menu role in the html, or a closed details is not clicked headless', async () => {
  const modal = await runTestJourney({
    pages: [
      rowsPage({
        blocks: [
          methodButton({ id: 'open', blockId: 'modal', method: 'setOpen', args: [{ open: true }] }),
          { id: 'modal', type: 'Modal', blocks: [{ id: 'inside', type: 'Paragraph' }] },
        ],
      }),
    ],
    steps: [{ click: 'open' }, { click: { containing: 'Beta Corp' } }],
  });
  expect(modal.result.browserOnly.reason).toBe(
    'data-event "onPick" in ClickableHtml "rows" sits behind an open popup\'s mask, which takes a browser\'s click: the step runs in a browser.'
  );
  const menu = await runTestJourney({
    pages: [
      rowsPage({ html: '<ul role="menu"><li><button data-event="onOpen">Open</button></li></ul>' }),
    ],
    steps: [{ click: { text: 'Open' } }],
  });
  expect(menu.result.browserOnly.reason).toBe(
    'a ClickableHtml draws a menu or dialog role, a layer a browser looks in before the page: the step runs in a browser.'
  );
  const details = await runTestJourney({
    pages: [
      rowsPage({
        html: '<details><summary>More</summary><button data-event="onOpen">Edit</button></details>',
      }),
    ],
    steps: [{ expect: { hidden: { blockId: 'rows', text: 'Edit' } } }],
  });
  expect(details.result.passed).toBe(true);
});

const ORDER_ROW = '<div data-event="onPick" data-name="order">Order 1042</div>';
const paragraph1042 = { id: 'total', type: 'Paragraph', properties: { content: 1042 } };

test('expect.hidden by text another block shows as a number goes to the browser', async () => {
  const { result } = await runTestJourney({
    pages: [rowsPage({ blocks: [paragraph1042] })],
    steps: [{ expect: { hidden: { containing: '1042' } } }],
  });
  expect(result.browserOnly).toMatchObject({
    index: 0,
    reason:
      'Paragraph "total" may show text containing "1042", and a headless run reads text only in ClickableHtml blocks: the step runs in a browser.',
  });
});

test('a text click goes to the browser when a block shows the text as a number or a default label', async () => {
  const number = await runTestJourney({
    pages: [rowsPage({ html: ORDER_ROW, blocks: [paragraph1042] })],
    steps: [{ click: { containing: '1042' } }],
  });
  expect(number.log).toEqual([]);
  expect(number.result.browserOnly.reason).toContain('Paragraph "total" may show');
  const label = await runTestJourney({
    pages: [
      rowsPage({
        html: '<div data-event="onPick">Notes</div>',
        blocks: [{ id: 'notes', type: 'TextInput' }],
      }),
    ],
    steps: [{ click: { containing: 'Notes' } }],
  });
  expect(label.log).toEqual([]);
  expect(label.result.browserOnly.reason).toContain('TextInput "notes" may show');
});

test('a text click goes to the browser when a message the app displayed may show the text', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      rowsPage({
        html: ORDER_ROW,
        blocks: [
          {
            id: 'save',
            type: 'Button',
            properties: { title: 'Save' },
            events: {
              onClick: [
                {
                  id: 'saved',
                  type: 'Record',
                  params: 'saved',
                  messages: { success: 'Order 1042 saved' },
                },
              ],
            },
          },
        ],
      }),
    ],
    steps: [{ click: 'save' }, { click: { containing: '1042' } }],
  });
  expect(readLog(log)).toEqual([['saved']]);
  expect(result.browserOnly.reason).toContain('may show text containing "1042"');
});

// A Box `panel` holds a ClickableHtml and a Modal holding another, which antd draws in its own
// portal, outside the panel.
function panelPage() {
  return {
    id: 'home',
    blocks: [
      methodButton({ id: 'open', blockId: 'dialog', method: 'setOpen', args: [{ open: true }] }),
      {
        id: 'panel',
        type: 'Box',
        blocks: [
          { id: 'list', type: 'ClickableHtml', properties: { html: '<p>Beta Corp</p>' } },
          {
            id: 'dialog',
            type: 'Modal',
            properties: { footer: false },
            blocks: [
              { id: 'inner', type: 'ClickableHtml', properties: { html: '<p>Acme Ltd</p>' } },
            ],
          },
        ],
      },
    ],
  };
}

test('a blockId scope leaves out a Modal inside it, which draws in its own portal', async () => {
  const { result } = await runTestJourney({
    pages: [panelPage()],
    steps: [
      { click: 'open' },
      { expect: { visible: { blockId: 'dialog', containing: 'Acme' } } },
      { expect: { hidden: { blockId: 'panel', containing: 'Acme' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toBeUndefined();
});

test('a text click that a block around the ClickableHtml may also answer goes to the browser', async () => {
  function boxPage({ html, events = { onClick: [record('box')] } }) {
    return {
      id: 'home',
      blocks: [
        {
          id: 'card',
          type: 'Box',
          events,
          blocks: [
            {
              id: 'rows',
              type: 'ClickableHtml',
              properties: { dataEvents: ['onEdit', 'onIdle'], html },
              events: { onEdit: [record('onEdit')], onIdle: [] },
            },
          ],
        },
      ],
    };
  }
  const html =
    '<div>Jane Doe</div><button data-event="onEdit">Edit</button><button data-event="onIdle">Idle</button>';
  const plain = await runTestJourney({
    pages: [boxPage({ html })],
    steps: [{ click: { containing: 'Jane Doe' } }],
  });
  expect(plain.result.browserOnly.reason).toBe(
    'A click on a <div> showing "Jane Doe" in ClickableHtml "rows" reaches Box "card" too, whose onClick a headless run does not fire for it: the step runs in a browser.'
  );
  const idle = await runTestJourney({
    pages: [boxPage({ html })],
    steps: [{ click: { text: 'Idle' } }],
  });
  expect(idle.result.browserOnly.reason).toContain('reaches Box "card"');
  const handled = await runTestJourney({
    pages: [boxPage({ html })],
    steps: [{ click: { text: 'Edit' } }],
  });
  expect(handled.result.browserOnly).toBeUndefined();
  expect(readLog(handled.log)).toEqual([['onEdit', {}]]);
});

test('a text click in a DropdownMenu content, whose trigger hears it, goes to the browser', async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          {
            id: 'menu',
            type: 'DropdownMenu',
            slots: {
              content: {
                blocks: [
                  {
                    id: 'rows',
                    type: 'ClickableHtml',
                    properties: {
                      dataEvents: ['onEdit'],
                      html: '<button data-event="onEdit">Edit</button>',
                    },
                    events: { onEdit: [record('onEdit')] },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    steps: [{ click: { blockId: 'rows', text: 'Edit' } }],
  });
  expect(result.browserOnly.reason).toContain('DropdownMenu "menu"');
});

test('a click with nth waits for that match to show, as a browser waits', async () => {
  const one = '<button data-event="onOpen" data-row="1">Open</button>';
  // The second row shows after the page's settle has given up (at stepTimeout) and before the
  // step's own wait ends.
  const { log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        events: {
          onInit: [{ id: 'init', type: 'SetState', params: { html: one } }],
          onMountAsync: [
            { id: 'load', type: 'Wait', params: 750 },
            {
              id: 'more',
              type: 'SetState',
              params: { html: `${one}<button data-event="onOpen" data-row="2">Open</button>` },
            },
          ],
        },
        blocks: [
          {
            id: 'rows',
            type: 'ClickableHtml',
            properties: { dataEvents: ['onOpen'], html: { _state: 'html' } },
            events: { onOpen: [record('onOpen')] },
          },
        ],
      },
    ],
    steps: [{ click: { blockId: 'rows', text: 'Open', nth: 1 } }],
    stepTimeout: 500,
  });
  expect(result.failure).toBeUndefined();
  expect(readLog(log)).toEqual([['onOpen', { row: '2' }]]);
});

test("the confirm's OK and Cancel go to the browser under a ConfigProvider with a locale", async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          {
            id: 'provider',
            type: 'ConfigProvider',
            properties: { locale: 'de_DE' },
            blocks: [rowsPage().blocks[0]],
          },
        ],
      },
    ],
    steps: [{ click: { blockId: 'rows', text: 'Remove' } }, { click: { text: 'Cancel' } }],
  });
  expect(result.browserOnly).toMatchObject({
    index: 1,
    reason:
      'In a ClickableHtml, the open confirm labels its buttons in the app locale: the step runs in a browser.',
  });
});
