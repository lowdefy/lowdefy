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

import { expect, test, vi } from 'vitest';

import runHeadlessStep from './runHeadlessStep.js';
import runTestJourney, { readLog, record } from './tests/runTestJourney.js';

const PAGE = {
  id: 'home',
  blocks: [
    {
      id: 'actions',
      type: 'DropdownButton',
      properties: { items: [{ title: 'Edit', eventName: 'onEdit' }] },
      events: { onEdit: [record('onEdit')], onOpenChange: [record('onOpenChange')] },
    },
    {
      id: 'more',
      type: 'DropdownMenu',
      properties: { links: [{ id: 'export' }] },
      events: { onClick: [record('more')], onOpenChange: [record('moreOpenChange')] },
    },
    { id: 'save', type: 'Button', events: { onClick: [record('save')] } },
    { id: 'name', type: 'TextInput' },
    { id: 'pick', type: 'Selector', properties: { options: ['a', 'b'] } },
  ],
};

test('A click on another block closes an open dropdown first', async () => {
  const { log, result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ open: 'actions' }, { click: 'save' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
    ['save'],
  ]);
});

test('A step on another dropdown closes the open one first', async () => {
  const { log, result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ open: 'actions' }, { click: { blockId: 'more', control: 'export' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name, event]) => [name, event?.open])).toEqual([
    ['onOpenChange', true],
    ['onOpenChange', false],
    ['moreOpenChange', true],
    ['more', undefined],
    ['moreOpenChange', false],
  ]);
});

test('A select closes an open dropdown first; a fill moves no pointer and leaves it open', async () => {
  const { log, result } = await runTestJourney({
    pages: [PAGE],
    steps: [
      { open: 'actions' },
      { fill: { blockId: 'name', value: 'Ada' } },
      { select: { blockId: 'pick', value: 'a' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
  ]);
});

test('A control target on a block with no stand-in marks the journey browser-only, naming its type', async () => {
  const { log, result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ click: { blockId: 'save', control: 'ok' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Block "save" is of type Button, which has no headless stand-in for a click on a control target: the step runs in a browser.'
  );
  expect(log).toEqual([]);
});

test('A rowKey click on a block with no grid stand-in marks the journey browser-only', async () => {
  const { result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ click: { blockId: 'save', rowKey: 'a' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Block "save" is of type Button, which has no headless stand-in for a click on a rowKey target: the step runs in a browser.'
  );
});

test('An open on a block with no stand-in marks the journey browser-only', async () => {
  const { result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ open: 'pick' }],
  });
  expect(result.browserOnly.reason).toBe(
    'Block "pick" is of type Selector, which has no headless stand-in for open: the step runs in a browser.'
  );
});

test('An expectation on a rowKey of a block with no grid stand-in marks the journey browser-only', async () => {
  const { result } = await runTestJourney({
    pages: [PAGE],
    steps: [{ expect: { hidden: { blockId: 'save', rowKey: 'a' } } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Block "save" is of type Button, which has no headless stand-in for expect.hidden on a rowKey: the step runs in a browser.'
  );
});

test('A block type installed under a prefix has no stand-in', async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        blocks: [
          { id: 'menu', type: 'antd_DropdownMenu', properties: { links: [{ id: 'export' }] } },
        ],
      },
    ],
    steps: [{ click: { blockId: 'menu', control: 'export' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Block "menu" is of type antd_DropdownMenu, which has no headless stand-in for a click on a control target: the step runs in a browser.'
  );
});

// A headless press presses Enter in the input the step runner filled last, which a journey's fill
// step has already checked; the press is checked against that input as well, before it acts.
// A page context holding one input, `note`, at its root.
function createNoteContext() {
  const note = {
    id: 'block:home:note:0',
    blockId: 'note',
    type: 'TextInput',
    Events: { events: {} },
  };
  return {
    _internal: {
      RootSlots: { map: { note }, slots: { content: { blocks: [note] } }, subSlots: {} },
    },
  };
}

test('a press is checked against the input it presses Enter in, before it acts', async () => {
  const run = vi.fn();
  const actor = {
    page: { pageId: 'home', context: createNoteContext() },
    stepRunner: { lastInputBlockId: () => 'note', run },
  };
  const refusal = vi.fn(() => ({ message: 'Refused.', actual: 'a press that reaches it' }));
  const error = await runHeadlessStep({
    actors: { current: () => actor },
    rails: { refusal },
    since: new Map(),
    step: { press: 'Enter' },
    stepTimeout: 300,
  }).catch((caught) => caught);
  expect(refusal).toHaveBeenCalledWith({ pageId: 'home', blockId: 'note', step: 'press' });
  expect(error.message).toBe('Refused.');
  expect(error.expected).toBe('a press a data-set journey can make');
  expect(error.actual).toBe('a press that reaches it');
  expect(run).not.toHaveBeenCalled();
});

test('a press with no input filled before it is left to the step runner, which refuses it', async () => {
  const run = vi.fn(async () => {
    throw new Error('Press "Enter" needs an input filled before it.');
  });
  const actor = {
    page: { pageId: 'home', context: createNoteContext() },
    stepRunner: { lastInputBlockId: () => null, run },
  };
  const refusal = vi.fn(() => null);
  await expect(
    runHeadlessStep({
      actors: { current: () => actor },
      rails: { refusal },
      since: new Map(),
      step: { press: 'Enter' },
      stepTimeout: 300,
    })
  ).rejects.toThrow('Press "Enter" needs an input filled before it.');
  expect(refusal).not.toHaveBeenCalled();
});
