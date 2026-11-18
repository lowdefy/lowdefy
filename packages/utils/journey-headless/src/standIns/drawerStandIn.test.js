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

import runTestJourney, { methodButton, readLog, record, refuse } from '../tests/runTestJourney.js';

const DRAWER_EVENTS = Object.fromEntries(
  ['onOpen', 'onClose', 'onToggle', 'afterClose', 'afterOpenChange'].map((name) => [
    name,
    [record(name)],
  ])
);

function drawerPage(events = {}) {
  return {
    id: 'home',
    blocks: [
      methodButton({ id: 'open', blockId: 'drawer', method: 'setOpen', args: [{ open: true }] }),
      methodButton({ id: 'close', blockId: 'drawer', method: 'setOpen', args: [{ open: false }] }),
      methodButton({ id: 'toggle', blockId: 'drawer', method: 'toggleOpen' }),
      {
        id: 'drawer',
        type: 'Drawer',
        events: { ...DRAWER_EVENTS, ...events },
        blocks: [{ id: 'inside', type: 'Paragraph' }],
      },
    ],
  };
}

test('Drawer open fires onOpen, then afterOpenChange { drawerOpen, open }', async () => {
  const { log, result } = await runTestJourney({
    pages: [drawerPage()],
    steps: [{ click: 'open' }, { expect: { visible: 'inside' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpen'], ['afterOpenChange', { drawerOpen: true, open: true }]]);
});

test('Drawer close fires onClose, then afterOpenChange and afterClose', async () => {
  const { log, result } = await runTestJourney({
    pages: [drawerPage()],
    steps: [{ click: 'open' }, { click: 'close' }, { expect: { hidden: 'inside' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([
    ['onClose'],
    ['afterOpenChange', { drawerOpen: false, open: false }],
    ['afterClose'],
  ]);
});

test('Drawer stays open when onClose fails', async () => {
  const { log, result } = await runTestJourney({
    pages: [drawerPage({ onClose: [record('onClose'), refuse] })],
    steps: [{ click: 'open' }, { click: 'close' }, { expect: { visible: 'inside' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([['onClose']]);
});

test('Drawer stays open when onClose bounces', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      drawerPage({
        onClose: { try: [record('onClose'), refuse], debounce: { immediate: true, ms: 60000 } },
      }),
    ],
    steps: [
      { click: 'open' },
      { click: 'close' },
      { click: 'close' },
      { expect: { visible: 'inside' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([['onClose']]);
});

test('Drawer toggleOpen fires onToggle first, then opens or closes', async () => {
  const { log, result } = await runTestJourney({
    pages: [drawerPage()],
    steps: [{ click: 'toggle' }, { click: 'toggle' }, { expect: { hidden: 'inside' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onToggle'],
    ['onOpen'],
    ['afterOpenChange', { drawerOpen: true, open: true }],
    ['onToggle'],
    ['onClose'],
    ['afterOpenChange', { drawerOpen: false, open: false }],
    ['afterClose'],
  ]);
});
