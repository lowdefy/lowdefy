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

function menuPage({ properties = {} } = {}) {
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
        blocks: [{ id: 'label', type: 'Button', events: { onClick: [record('label')] } }],
      },
      { id: 'other', type: 'Button', events: { onClick: [record('other')] } },
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
    pages: [menuPage({ properties: { trigger: 'click' } })],
    steps: [{ click: 'menu' }, { click: 'menu' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
  ]);
});
