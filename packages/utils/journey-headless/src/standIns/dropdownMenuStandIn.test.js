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

const LINKS = [
  { id: 'reports', pageId: 'reports' },
  { id: 'export' },
  { id: 'locked', properties: { disabled: true } },
  { id: 'more', type: 'MenuGroup', links: [{ id: 'nested' }] },
];

const LABEL = { id: 'label', type: 'Button', events: { onClick: [record('label')] } };

function menuPage({ properties = {}, content = [LABEL], outside = [] } = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'menu',
        type: 'DropdownMenu',
        properties: { links: LINKS, ...properties },
        events: {
          onClick: [record('onClick')],
          onOpenChange: [record('onOpenChange')],
          onSelect: [record('onSelect')],
        },
        blocks: content,
      },
      { id: 'other', type: 'Button', events: { onClick: [record('other')] } },
      ...outside,
    ],
  };
}

const REPORTS_PAGE = { id: 'reports', blocks: [{ id: 'title', type: 'Paragraph' }] };

const exportClick = ['onClick', { key: 'export', keyPath: ['export'] }];

test('DropdownMenu item fires onClick, then onOpenChange false; not selectable, no onSelect', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: { blockId: 'menu', control: 'export' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    exportClick,
    ['onOpenChange', { open: false }],
  ]);
});

test('DropdownMenu selectable item fires onSelect after onOpenChange false, and a second click on it none', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ properties: { selectable: true } })],
    steps: [
      { click: { blockId: 'menu', control: 'export' } },
      { click: { blockId: 'menu', control: 'export' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    exportClick,
    ['onOpenChange', { open: false }],
    ['onSelect', { key: 'export', selectedKeys: ['export'] }],
    ['onOpenChange', { open: true }],
    exportClick,
    ['onOpenChange', { open: false }],
  ]);
});

test('DropdownMenu with destroyOnClose drops the selection when it closes', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ properties: { selectable: true, destroyOnClose: true } })],
    steps: [
      { click: { blockId: 'menu', control: 'export' } },
      { click: { blockId: 'menu', control: 'export' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).filter(([name]) => name === 'onSelect')).toHaveLength(2);
});

test('DropdownMenu reads set selectedKeys from its properties', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ properties: { selectable: true, selectedKeys: ['export'] } })],
    steps: [{ click: { blockId: 'menu', control: 'export' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual(['onOpenChange', 'onClick', 'onOpenChange']);
});

test('DropdownMenu item follows its link after its events', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage(), REPORTS_PAGE],
    steps: [
      { click: { blockId: 'menu', control: 'reports' } },
      { expect: { url: { contains: '/reports' } } },
      { expect: { visible: 'title' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)[1]).toEqual([
    'onClick',
    { key: 'reports', keyPath: ['reports'], pageId: 'reports' },
  ]);
});

test('DropdownMenu refuses a disabled item and a disabled dropdown', async () => {
  const item = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: { blockId: 'menu', control: 'locked' } }],
  });
  expect(item.result.failure.message).toBe('Item "locked" of DropdownMenu "menu" is disabled.');
  const dropdown = await runTestJourney({
    pages: [menuPage({ properties: { disabled: true } })],
    steps: [{ click: { blockId: 'menu', control: 'export' } }],
  });
  expect(dropdown.result.failure.message).toBe(
    'DropdownMenu "menu" is disabled: its dropdown does not open.'
  );
  expect([...item.log, ...dropdown.log]).toEqual([]);
});

test('DropdownMenu item in a submenu marks the journey browser-only', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: { blockId: 'menu', control: 'nested' } }],
  });
  expect(result.browserOnly.reason).toBe(
    'Item "nested" of DropdownMenu "menu" sits in a submenu, which opens in a browser.'
  );
  expect(log).toEqual([]);
});

test('DropdownMenu opens on hover by default and stays open for a step inside its content', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ open: 'menu' }, { click: 'label' }, { click: 'other' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['label'],
    ['onOpenChange', { open: false }],
    ['other'],
  ]);
});

test('DropdownMenu with a click trigger toggles on a click of the block', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      menuPage({ properties: { trigger: 'click' }, content: [{ id: 'text', type: 'Paragraph' }] }),
    ],
    steps: [{ click: 'menu' }, { click: 'menu' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
  ]);
});

test('DropdownMenu click on the block lands on its content button: its onClick, then the trigger', async () => {
  // A hover dropdown opens on its mouse-enter delay, after the click, and fires onOpenChange.
  const hover = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: 'menu' }, { click: 'menu' }],
  });
  expect(hover.result.passed).toBe(true);
  expect(readLog(hover.log)).toEqual([['label'], ['onOpenChange', { open: true }], ['label']]);
  // The button's onClick handles the click, so the engine skips a click dropdown's onOpenChange
  // for it, though the dropdown opens: the click on other closes it and fires.
  const click = await runTestJourney({
    pages: [menuPage({ properties: { trigger: 'click' } })],
    steps: [{ click: 'menu' }, { click: 'other' }],
  });
  expect(click.result.passed).toBe(true);
  expect(readLog(click.log)).toEqual([['label'], ['onOpenChange', { open: false }], ['other']]);
});

test('DropdownMenu click on the block lands on the first control in its content, children first', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      menuPage({
        content: [
          { id: 'text', type: 'Paragraph' },
          { id: 'hidden', type: 'Button', visible: false, events: { onClick: [record('hidden')] } },
          {
            id: 'row',
            type: 'Box',
            events: { onClick: [record('row')] },
            blocks: [{ id: 'inner', type: 'Button', events: { onClick: [record('inner')] } }],
          },
          LABEL,
        ],
      }),
    ],
    steps: [{ click: 'menu' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['inner'], ['onOpenChange', { open: true }]]);
});

test('DropdownMenu click on the block refuses when it lands on a disabled content button', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ content: [{ ...LABEL, properties: { disabled: true } }] })],
    steps: [{ click: 'menu' }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'A click on DropdownMenu "menu" lands on block "label", which is disabled.'
  );
  expect(log).toEqual([]);
});

test('DropdownMenu click inside its closed hover content opens it after the onClick', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ click: 'label' }, { click: 'label' }, { click: 'other' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['label'],
    ['onOpenChange', { open: true }],
    ['label'],
    ['onOpenChange', { open: false }],
    ['other'],
  ]);
});

test('DropdownMenu click inside its content toggles a click dropdown without its onOpenChange', async () => {
  const opened = await runTestJourney({
    pages: [menuPage({ properties: { trigger: 'click' } })],
    steps: [{ click: 'label' }, { click: 'other' }],
  });
  expect(opened.result.passed).toBe(true);
  expect(readLog(opened.log)).toEqual([['label'], ['onOpenChange', { open: false }], ['other']]);
  const toggled = await runTestJourney({
    pages: [menuPage({ properties: { trigger: 'click' } })],
    steps: [{ open: 'menu' }, { click: 'label' }, { click: 'other' }],
  });
  expect(toggled.result.passed).toBe(true);
  expect(readLog(toggled.log)).toEqual([['onOpenChange', { open: true }], ['label'], ['other']]);
});

test('DropdownMenu click inside its content fires onOpenChange when the onClick bubbles', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      menuPage({
        properties: { trigger: 'click' },
        content: [{ ...LABEL, events: { onClick: { try: [record('label')], bubble: true } } }],
      }),
    ],
    steps: [{ click: 'label' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['label'], ['onOpenChange', { open: true }]]);
});

test('DropdownMenu click inside its content opens neither a contextMenu nor a disabled dropdown', async () => {
  const contextMenu = await runTestJourney({
    pages: [menuPage({ properties: { trigger: 'contextMenu' } })],
    steps: [{ click: 'label' }],
  });
  expect(contextMenu.result.passed).toBe(true);
  expect(readLog(contextMenu.log)).toEqual([['label']]);
  const disabled = await runTestJourney({
    pages: [menuPage({ properties: { disabled: true } })],
    steps: [{ click: 'label' }],
  });
  expect(disabled.result.passed).toBe(true);
  expect(readLog(disabled.log)).toEqual([['label']]);
});

test('DropdownMenu open on an open dropdown fails, as the browser shows no new popup', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage()],
    steps: [{ open: 'menu' }, { open: 'menu' }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.message).toBe('Opening block "menu" showed no dropdown or popup.');
  expect(readLog(log)).toEqual([['onOpenChange', { open: true }]]);
});

const COLOUR = {
  id: 'colour',
  type: 'ColorSelector',
  events: { onChange: [record('onChange')] },
};

test('DropdownMenu that holds a ColorSelector opens on its fill, which clicks the picker', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ content: [LABEL, COLOUR] })],
    steps: [
      { fill: { blockId: 'colour', value: '#1677ff' } },
      { expect: { state: { path: 'colour', equals: '#1677ff' } } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpenChange', { open: true }], ['onChange']]);
});

test('DropdownMenu stays open through the Escape a ColorSelector fill inside it presses', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ content: [LABEL, COLOUR] })],
    steps: [{ open: 'menu' }, { fill: { blockId: 'colour', value: '#1677ff' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpenChange', { open: true }], ['onChange']]);
});

test('DropdownMenu closes when a ColorSelector fill clicks the picker outside it', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ properties: { trigger: 'click' }, outside: [COLOUR] })],
    steps: [{ open: 'menu' }, { fill: { blockId: 'colour', value: '#1677ff' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
    ['onChange'],
  ]);
});

test('DropdownMenu stays open through a fill that is not a ColorSelector', async () => {
  const { log, result } = await runTestJourney({
    pages: [menuPage({ outside: [{ id: 'name', type: 'TextInput' }] })],
    steps: [{ open: 'menu' }, { fill: { blockId: 'name', value: 'Ada' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpenChange', { open: true }]]);
});
