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

import runTestJourney, { readLog, record } from './tests/runTestJourney.js';

// The data-set rails headless: a step that acts on a block whose events reach a connection a data
// set cannot run against is refused before it acts, with the browser runner's message.

const UNDECLARED = {
  request: { id: 'mail', type: 'Request', params: 'send_mail' },
  reason:
    'reaches connection "mailer" (Mailer, no dataSet declaration), which a data set cannot redirect',
  actual: 'that reaches connection "mailer" (Mailer, no dataSet declaration)',
};

const DATA_SET = {
  name: 'rails',
  connections: { Mailer: {}, MongoDBCollection: { meta: { dataSet: 'redirect' } } },
  artifacts: {
    'pages/home/requests/send_mail.json': { requestId: 'send_mail', connectionId: 'mailer' },
    'pages/home/requests/save.json': { requestId: 'save', connectionId: 'db' },
    'connections/mailer.json': { connectionId: 'mailer', type: 'Mailer' },
    'connections/db.json': { connectionId: 'db', type: 'MongoDBCollection' },
  },
};

const PAGE = {
  id: 'home',
  blocks: [
    {
      id: 'notify',
      type: 'Button',
      events: { onClick: [record('notify'), UNDECLARED.request] },
    },
    {
      id: 'save',
      type: 'Button',
      events: { onClick: [record('save'), { id: 'save', type: 'Request', params: 'save' }] },
    },
    {
      id: 'more',
      type: 'DropdownMenu',
      properties: { links: [{ id: 'mail' }] },
      events: {
        onClick: [record('more'), UNDECLARED.request],
        onOpenChange: [record('moreOpenChange')],
      },
    },
    {
      id: 'tools',
      type: 'DropdownMenu',
      properties: { trigger: 'click', links: [{ id: 'export' }] },
      blocks: [
        {
          id: 'tools_button',
          type: 'Button',
          events: { onClick: [record('toolsButton'), UNDECLARED.request] },
        },
      ],
    },
    {
      id: 'share',
      type: 'DropdownMenu',
      properties: { links: [{ id: 'copy' }] },
      events: { onOpenChange: [record('shareOpenChange'), UNDECLARED.request] },
      blocks: [{ id: 'share_label', type: 'Button', events: { onClick: [record('shareLabel')] } }],
    },
    {
      id: 'note',
      type: 'TextInput',
      events: { onChange: [record('note'), UNDECLARED.request] },
    },
    {
      id: 'pick',
      type: 'Selector',
      properties: { options: ['a', 'b'] },
      events: { onChange: [record('pick'), UNDECLARED.request] },
    },
  ],
};

function refusedFailure({ blockId, index, step, act, noun }) {
  return {
    index,
    step,
    expected: `${noun} a data-set journey can make`,
    actual: `${noun} ${UNDECLARED.actual}`,
    message: `Block "${blockId}" ${UNDECLARED.reason}, so a data-set journey cannot ${act}.`,
  };
}

test('a data-set journey clicking a block whose onClick reaches an undeclared connection is refused before it acts', async () => {
  const step = { click: 'notify' };
  const { log, result } = await runTestJourney({ dataSet: DATA_SET, pages: [PAGE], steps: [step] });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    refusedFailure({ blockId: 'notify', index: 0, step, act: 'click it', noun: 'a click' })
  );
  expect(log).toEqual([]);
});

test('a data-set journey clicking a block whose request uses a redirect connection acts', async () => {
  const { log, result } = await runTestJourney({
    dataSet: DATA_SET,
    pages: [PAGE],
    steps: [{ click: 'save' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['save'], ['request:save']]);
});

test('a data-set journey clicking an item control of a closed dropdown is refused before the dropdown opens', async () => {
  const step = { click: { blockId: 'more', control: 'mail' } };
  const { log, result } = await runTestJourney({ dataSet: DATA_SET, pages: [PAGE], steps: [step] });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    refusedFailure({ blockId: 'more', index: 0, step, act: 'click it', noun: 'a click' })
  );
  expect(log).toEqual([]);
});

// A plain click on a DropdownMenu lands on the first control in its content, and a click in its
// content reaches its trigger, which opens it: the browser checks the block the click lands on,
// then the dropdown around it, so headless checks the same two.
test.each([
  ['on the dropdown is checked on the content control it lands on', 'tools', 'tools_button'],
  ['on a content block is checked on the dropdown it opens', 'share_label', 'share'],
  ['on the dropdown is checked on the dropdown its content control opens', 'share', 'share'],
])('a data-set journey click %s', async (_, clicked, blockId) => {
  const step = { click: clicked };
  const { log, result } = await runTestJourney({ dataSet: DATA_SET, pages: [PAGE], steps: [step] });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    refusedFailure({ blockId, index: 0, step, act: 'click it', noun: 'a click' })
  );
  expect(log).toEqual([]);
});

test.each([
  ['an open', { open: 'more' }, 'more', 'open it'],
  ['a fill', { fill: { blockId: 'note', value: 'Hi' } }, 'note', 'fill it'],
  ['a select', { select: { blockId: 'pick', value: 'a' } }, 'pick', 'select in it'],
])(
  'a data-set journey making %s on a block whose events reach an undeclared connection is refused before it acts',
  async (noun, step, blockId, act) => {
    const { log, result } = await runTestJourney({
      dataSet: DATA_SET,
      pages: [PAGE],
      steps: [step],
    });
    expect(result.passed).toBe(false);
    expect(result.failure).toEqual(refusedFailure({ blockId, index: 0, step, act, noun }));
    expect(log).toEqual([]);
    expect(result.state.note ?? null).toBe(null);
    expect(result.state.pick ?? null).toBe(null);
  }
);

test('a journey with no data set is not railed', async () => {
  const { log, result } = await runTestJourney({
    pages: [PAGE],
    steps: [
      { click: 'notify' },
      { click: { blockId: 'more', control: 'mail' } },
      { fill: { blockId: 'note', value: 'Hi' } },
      { select: { blockId: 'pick', value: 'a' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual([
    'notify',
    'request:send_mail',
    'moreOpenChange',
    'more',
    'moreOpenChange',
    'request:send_mail',
    'note',
    'request:send_mail',
    'pick',
    'request:send_mail',
  ]);
});

// A headless press is Enter in the input filled last. The browser checks every block it can fire
// events on, so headless checks the same: the input, the blocks around it up to an enclosing
// Modal, and the blocks with a shortcut Enter fires.
const PRESS_PAGE = {
  id: 'home',
  blocks: [
    {
      id: 'open_dialog',
      type: 'Button',
      events: {
        onClick: [
          {
            id: 'open',
            type: 'CallMethod',
            params: { blockId: 'dialog', method: 'setOpen', args: [{ open: true }] },
          },
        ],
      },
    },
    {
      id: 'dialog',
      type: 'Modal',
      events: { onCancel: [record('dialogCancel'), UNDECLARED.request] },
      blocks: [{ id: 'dialog_note', type: 'TextInput' }],
    },
    { id: 'plain_box', type: 'Box', blocks: [{ id: 'box_note', type: 'TextInput' }] },
  ],
};

test('a data-set journey pressing Enter in an input in a modal whose onCancel reaches an undeclared connection is refused', async () => {
  const step = { press: 'Enter' };
  const { log, result } = await runTestJourney({
    dataSet: DATA_SET,
    pages: [PRESS_PAGE],
    steps: [{ click: 'open_dialog' }, { fill: { blockId: 'dialog_note', value: 'Hi' } }, step],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    refusedFailure({
      blockId: 'dialog',
      index: 2,
      step,
      act: 'press a key that fires its events',
      noun: 'a press',
    })
  );
  expect(log).toEqual([]);
});

test('a data-set journey pressing Enter in an input in a plain box passes', async () => {
  const { result } = await runTestJourney({
    dataSet: DATA_SET,
    pages: [PRESS_PAGE],
    steps: [{ fill: { blockId: 'box_note', value: 'Hi' } }, { press: 'Enter' }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

// Escape is checked on the overlay it closes, whose portal holds the focus in a browser, and on
// the input with the focus and the blocks around it.
test('a data-set journey pressing Escape on a modal whose onCancel reaches an undeclared connection is refused', async () => {
  const step = { press: 'Escape' };
  const { log, result } = await runTestJourney({
    dataSet: DATA_SET,
    pages: [PRESS_PAGE],
    steps: [{ click: 'open_dialog' }, step],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    refusedFailure({
      blockId: 'dialog',
      index: 1,
      step,
      act: 'press a key that fires its events',
      noun: 'a press',
    })
  );
  expect(log).toEqual([]);
});

test('a data-set journey pressing Escape on a dropdown in a modal whose onCancel reaches an undeclared connection is refused', async () => {
  const step = { press: 'Escape' };
  const page = {
    ...PRESS_PAGE,
    blocks: PRESS_PAGE.blocks.map((block) =>
      block.id === 'dialog'
        ? {
            ...block,
            blocks: [
              ...block.blocks,
              {
                id: 'dialog_actions',
                type: 'DropdownButton',
                properties: { items: [{ title: 'Archive', eventName: 'onArchive' }] },
              },
            ],
          }
        : block
    ),
  };
  const { result } = await runTestJourney({
    dataSet: DATA_SET,
    pages: [page],
    steps: [{ click: 'open_dialog' }, { click: 'dialog_actions' }, step],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    refusedFailure({
      blockId: 'dialog',
      index: 2,
      step,
      act: 'press a key that fires its events',
      noun: 'a press',
    })
  );
});

test('a data-set journey pressing Escape on an open dropdown that reaches no undeclared connection closes it', async () => {
  const { log, result } = await runTestJourney({
    dataSet: DATA_SET,
    pages: [
      {
        id: 'home',
        blocks: [
          {
            id: 'export',
            type: 'DropdownButton',
            properties: { items: [{ title: 'CSV', eventName: 'onCsv' }] },
            events: { onOpenChange: [record('exportOpenChange')] },
          },
        ],
      },
    ],
    steps: [{ open: 'export' }, { press: 'Escape' }],
  });
  expect(result.failure).toBeUndefined();
  expect(readLog(log)).toEqual([
    ['exportOpenChange', { open: true }],
    ['exportOpenChange', { open: false }],
  ]);
});

test('a data-set journey pressing Enter is refused when a shown block binds Enter to an event that reaches an undeclared connection', async () => {
  const step = { press: 'Enter' };
  const page = {
    ...PRESS_PAGE,
    blocks: [
      ...PRESS_PAGE.blocks,
      {
        id: 'send',
        type: 'Button',
        events: { onClick: { try: [record('send'), UNDECLARED.request], shortcut: 'Enter' } },
      },
    ],
  };
  const { log, result } = await runTestJourney({
    dataSet: DATA_SET,
    pages: [page],
    steps: [{ fill: { blockId: 'box_note', value: 'Hi' } }, step],
  });
  expect(result.failure).toEqual(
    refusedFailure({
      blockId: 'send',
      index: 1,
      step,
      act: 'press a key that fires its events',
      noun: 'a press',
    })
  );
  expect(log).toEqual([]);
});
