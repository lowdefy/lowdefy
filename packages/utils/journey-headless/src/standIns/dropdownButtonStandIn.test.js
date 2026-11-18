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

function dropdownPage({ properties = {}, events = {} } = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'actions',
        type: 'DropdownButton',
        properties: {
          items: [
            { title: 'Edit', eventName: 'onEdit' },
            { type: 'divider' },
            { title: 'Archive', eventName: 'onArchive', disabled: true },
            { title: 'Plain' },
          ],
          ...properties,
        },
        events: {
          onClick: [record('onClick')],
          onEdit: [record('onEdit')],
          onOpenChange: [record('onOpenChange')],
          'item-3': [record('item-3')],
          ...events,
        },
      },
    ],
  };
}

test('DropdownButton open then an item fires onOpenChange true once, the item, then onOpenChange false', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage()],
    steps: [{ open: 'actions' }, { click: { blockId: 'actions', control: 'onEdit' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onEdit'],
    ['onOpenChange', { open: false }],
  ]);
});

test('DropdownButton item with no open first opens the dropdown too', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage()],
    steps: [{ click: { blockId: 'actions', control: 'onEdit' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onEdit'],
    ['onOpenChange', { open: false }],
  ]);
});

test('DropdownButton item with no eventName is keyed item-<index>', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage()],
    steps: [{ click: { blockId: 'actions', control: 'item-3' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)[1]).toEqual(['item-3']);
});

test('DropdownButton refuses a disabled item', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage()],
    steps: [{ click: { blockId: 'actions', control: 'onArchive' } }],
  });
  expect(result.failure.message).toBe('Item "onArchive" of DropdownButton "actions" is disabled.');
  expect(log).toEqual([]);
});

test('DropdownButton refuses an item, a click and an open on a disabled dropdown', async () => {
  const page = dropdownPage({ properties: { disabled: true } });
  for (const step of [
    { click: { blockId: 'actions', control: 'onEdit' } },
    { click: 'actions' },
    { open: 'actions' },
  ]) {
    const { log, result } = await runTestJourney({ pages: [page], steps: [step] });
    expect(result.failure.message).toBe(
      'DropdownButton "actions" is disabled: its dropdown does not open.'
    );
    expect(log).toEqual([]);
  }
});

test('DropdownButton refuses a key no item has', async () => {
  const { result } = await runTestJourney({
    pages: [dropdownPage()],
    steps: [{ click: { blockId: 'actions', control: 'onDelete' } }],
  });
  expect(result.failure.message).toBe(
    'DropdownButton "actions" has no item keyed "onDelete". Its item keys: onEdit, onArchive, item-3.'
  );
});

test('DropdownButton that is not split opens and closes on a click, and fires no onClick', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage()],
    steps: [{ click: 'actions' }, { click: 'actions' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
  ]);
});

test('DropdownButton with a hover trigger stays open on a second click', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage({ properties: { trigger: 'hover' } })],
    steps: [{ click: 'actions' }, { click: 'actions' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpenChange', { open: true }]]);
});

test('DropdownButton split main button keeps going through onClick', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage({ properties: { split: true } })],
    steps: [{ click: 'actions' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onClick']]);
});

test('DropdownButton split main button closes its own open dropdown first', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage({ properties: { split: true } })],
    steps: [{ open: 'actions' }, { click: 'actions' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
    ['onClick'],
  ]);
});

test('DropdownButton open on an open dropdown fires nothing', async () => {
  const { log, result } = await runTestJourney({
    pages: [dropdownPage()],
    steps: [{ open: 'actions' }, { open: 'actions' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpenChange', { open: true }]]);
});
