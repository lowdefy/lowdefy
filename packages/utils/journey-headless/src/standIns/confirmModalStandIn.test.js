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

const CONFIRM_EVENTS = Object.fromEntries(
  ['onOpen', 'onClose', 'onOk', 'onCancel'].map((name) => [name, [record(name)]])
);

function confirmPage({ events = {}, properties = {}, args = [] } = {}) {
  return {
    id: 'home',
    blocks: [
      methodButton({ id: 'open', blockId: 'confirm', method: 'open', args }),
      {
        id: 'confirm',
        type: 'ConfirmModal',
        properties,
        events: { ...CONFIRM_EVENTS, ...events },
        blocks: [{ id: 'inside', type: 'Paragraph', events: { onMount: [record('onMount')] } }],
      },
    ],
  };
}

test('ConfirmModal open fires onOpen and shows its content; ok fires onOk, then onClose', async () => {
  const { log, result } = await runTestJourney({
    pages: [confirmPage()],
    steps: [
      { expect: { hidden: 'inside' } },
      { click: 'open' },
      { expect: { visible: 'inside' } },
      { click: { blockId: 'confirm', control: 'ok' } },
      { expect: { hidden: 'inside' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpen'], ['onMount'], ['onOk'], ['onClose']]);
});

test('ConfirmModal cancel fires onCancel, then onClose', async () => {
  const { log, result } = await runTestJourney({
    pages: [confirmPage()],
    steps: [{ click: 'open' }, { click: { blockId: 'confirm', control: 'cancel' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([['onCancel'], ['onClose']]);
});

test('ConfirmModal stays open when onOk fails and did not bounce', async () => {
  const { log, result } = await runTestJourney({
    pages: [confirmPage({ events: { onOk: [record('onOk'), refuse] } })],
    steps: [
      { click: 'open' },
      { click: { blockId: 'confirm', control: 'ok' } },
      { expect: { visible: 'inside' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([['onOk']]);
});

test('ConfirmModal closes when onOk bounces', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      confirmPage({
        events: {
          onOk: { try: [record('onOk'), refuse], debounce: { immediate: true, ms: 60000 } },
        },
      }),
    ],
    steps: [
      { click: 'open' },
      { click: { blockId: 'confirm', control: 'ok' } },
      { click: { blockId: 'confirm', control: 'ok' } },
      { expect: { hidden: 'inside' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([['onOk'], ['onClose']]);
});

test('ConfirmModal mounts its content again on each open', async () => {
  const { log, result } = await runTestJourney({
    pages: [confirmPage()],
    steps: [{ click: 'open' }, { click: { blockId: 'confirm', control: 'ok' } }, { click: 'open' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpen'],
    ['onMount'],
    ['onOk'],
    ['onClose'],
    ['onOpen'],
    ['onMount'],
  ]);
});

test('ConfirmModal of a status other than confirm has no cancel', async () => {
  const fromArgs = await runTestJourney({
    pages: [confirmPage({ args: [{ status: 'info' }] })],
    steps: [{ click: 'open' }, { click: { blockId: 'confirm', control: 'cancel' } }],
  });
  expect(fromArgs.result.failure.message).toBe(
    'ConfirmModal "confirm" has no info dialog button keyed "cancel". Its info dialog button keys: ok.'
  );
  const fromProperties = await runTestJourney({
    pages: [confirmPage({ properties: { status: 'warning' } })],
    steps: [{ click: 'open' }, { click: { blockId: 'confirm', control: 'cancel' } }],
  });
  expect(fromProperties.result.failure.message).toBe(
    'ConfirmModal "confirm" has no warning dialog button keyed "cancel". Its warning dialog button keys: ok.'
  );
  const ok = await runTestJourney({
    pages: [confirmPage({ properties: { status: 'error' } })],
    steps: [{ click: 'open' }, { click: { blockId: 'confirm', control: 'ok' } }],
  });
  expect(ok.result.passed).toBe(true);
});

test('ConfirmModal ok with no dialog open refuses', async () => {
  const { log, result } = await runTestJourney({
    pages: [confirmPage()],
    steps: [{ click: { blockId: 'confirm', control: 'ok' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toMatch('Block "confirm" is not visible.');
  expect(log).toEqual([]);
});

test('ConfirmModal opened twice has two ok buttons, which a control target refuses', async () => {
  const { result } = await runTestJourney({
    pages: [confirmPage()],
    steps: [{ click: 'open' }, { click: 'open' }, { click: { blockId: 'confirm', control: 'ok' } }],
  });
  expect(result.failure.message).toBe(
    'ConfirmModal "confirm" has 2 dialogs open, each with its own ok button; a control target names one.'
  );
});

test('ConfirmModal with a disabled ok or cancel button refuses the click', async () => {
  const ok = await runTestJourney({
    pages: [confirmPage({ properties: { okButton: { disabled: true } } })],
    steps: [{ click: 'open' }, { click: { blockId: 'confirm', control: 'ok' } }],
  });
  expect(ok.result.passed).toBe(false);
  expect(ok.result.failure.message).toBe('The ok button of ConfirmModal "confirm" is disabled.');
  expect(readLog(ok.log)).not.toContainEqual(['onOk']);
  const cancel = await runTestJourney({
    pages: [confirmPage({ properties: { cancelButton: { disabled: true } } })],
    steps: [{ click: 'open' }, { click: { blockId: 'confirm', control: 'cancel' } }],
  });
  expect(cancel.result.failure.message).toBe(
    'The cancel button of ConfirmModal "confirm" is disabled.'
  );
  expect(readLog(cancel.log)).not.toContainEqual(['onCancel']);
});

test('ConfirmModal content starts again on each open: a dropdown in it drops its selection', async () => {
  const page = confirmPage();
  page.blocks[1].blocks.push({
    id: 'menu',
    type: 'DropdownMenu',
    properties: { selectable: true, links: [{ id: 'item' }] },
    events: { onSelect: [record('onSelect')] },
  });
  const { log, result } = await runTestJourney({
    pages: [page],
    steps: [
      { click: 'open' },
      { click: { blockId: 'menu', control: 'item' } },
      { click: { blockId: 'confirm', control: 'ok' } },
      { click: 'open' },
      { click: { blockId: 'menu', control: 'item' } },
    ],
  });
  expect(result.passed).toBe(true);
  // The menu kept its selection until the dialog closed and unmounted it, so the item selects again.
  expect(readLog(log).filter(([name]) => name === 'onSelect')).toEqual([
    ['onSelect', { key: 'item', selectedKeys: ['item'] }],
    ['onSelect', { key: 'item', selectedKeys: ['item'] }],
  ]);
});
