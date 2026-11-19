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

const MODAL_EVENTS = Object.fromEntries(
  ['onOpen', 'onClose', 'afterClose', 'afterOpenChange', 'onOk', 'onCancel'].map((name) => [
    name,
    [record(name)],
  ])
);

function modalPage({ events = {}, properties = {}, slots } = {}) {
  return {
    id: 'home',
    blocks: [
      methodButton({ id: 'open', blockId: 'modal', method: 'setOpen', args: [{ open: true }] }),
      {
        id: 'modal',
        type: 'Modal',
        properties,
        events: { ...MODAL_EVENTS, ...events },
        slots,
        blocks: [{ id: 'inside', type: 'Paragraph' }],
      },
    ],
  };
}

test('Modal ok fires onOk, then the close: onClose, afterClose, afterOpenChange false', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage()],
    steps: [
      { click: 'open' },
      { click: { blockId: 'modal', control: 'ok' } },
      { expect: { hidden: 'inside' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onOpen'],
    ['afterOpenChange', { open: true }],
    ['onOk'],
    ['onClose'],
    ['afterClose'],
    ['afterOpenChange', { open: false }],
  ]);
});

test('Modal cancel fires onCancel, then the close', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage()],
    steps: [{ click: 'open' }, { click: { blockId: 'modal', control: 'cancel' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([
    ['onCancel'],
    ['onClose'],
    ['afterClose'],
    ['afterOpenChange', { open: false }],
  ]);
});

test('Modal ok on a closed modal refuses', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage()],
    steps: [{ click: { blockId: 'modal', control: 'ok' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toMatch('Block "modal" is not visible.');
  expect(log).toEqual([]);
});

test('Modal with footer false has no ok button', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage({ properties: { footer: false } })],
    steps: [{ click: 'open' }, { click: { blockId: 'modal', control: 'ok' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Modal "modal" has no footer button keyed "ok". It has no footer buttons.'
  );
  expect(readLog(log)).not.toContainEqual(['onOk']);
});

test('Modal that is loading has no ok button', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage({ properties: { loading: true } })],
    steps: [{ click: 'open' }, { click: { blockId: 'modal', control: 'ok' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Modal "modal" has no footer button keyed "ok". It has no footer buttons.'
  );
  expect(readLog(log)).not.toContainEqual(['onOk']);
});

test('Modal that fills its footer area has no cancel button', async () => {
  const { result } = await runTestJourney({
    pages: [modalPage({ slots: { footer: { blocks: [{ id: 'footerButton', type: 'Button' }] } } })],
    steps: [{ click: 'open' }, { click: { blockId: 'modal', control: 'cancel' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Modal "modal" has no footer button keyed "cancel". It has no footer buttons.'
  );
});

test('Modal with a disabled ok button refuses the click', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage({ properties: { okButtonProps: { disabled: true } } })],
    steps: [{ click: 'open' }, { click: { blockId: 'modal', control: 'ok' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe('The ok button of Modal "modal" is disabled.');
  expect(readLog(log)).not.toContainEqual(['onOk']);
});

test('Modal has no control but ok and cancel, and no rows', async () => {
  const unknown = await runTestJourney({
    pages: [modalPage()],
    steps: [{ click: 'open' }, { click: { blockId: 'modal', control: 'save' } }],
  });
  expect(unknown.result.failure.message).toBe(
    'Modal "modal" has no footer button keyed "save". Its footer button keys: ok, cancel.'
  );
  const row = await runTestJourney({
    pages: [modalPage()],
    steps: [{ click: 'open' }, { click: { blockId: 'modal', rowKey: 'a', control: 'ok' } }],
  });
  expect(row.result.failure.message).toBe(
    'Modal "modal" draws no grid rows: "rowKey" names a row or cell of a grid.'
  );
});

test('Modal stays open when onOk fails', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage({ events: { onOk: [record('onOk'), refuse] } })],
    steps: [
      { click: 'open' },
      { click: { blockId: 'modal', control: 'ok' } },
      { expect: { visible: 'inside' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([['onOk']]);
});

test('Modal stays open when onOk bounces', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      modalPage({
        events: {
          onOk: { try: [record('onOk'), refuse], debounce: { immediate: true, ms: 60000 } },
        },
      }),
    ],
    steps: [
      { click: 'open' },
      { click: { blockId: 'modal', control: 'ok' } },
      { click: { blockId: 'modal', control: 'ok' } },
      { expect: { visible: 'inside' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([['onOk']]);
});

test('Modal setOpen on an open modal fires onOpen again, and no afterOpenChange', async () => {
  const { log, result } = await runTestJourney({
    pages: [modalPage()],
    steps: [{ click: 'open' }, { click: 'open' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onOpen'], ['afterOpenChange', { open: true }], ['onOpen']]);
});

test('Modal toggleOpen closes an open modal with the full close', async () => {
  const { log, result } = await runTestJourney({
    pages: [
      {
        ...modalPage(),
        blocks: [
          ...modalPage().blocks,
          methodButton({ id: 'toggle', blockId: 'modal', method: 'toggleOpen' }),
        ],
      },
    ],
    steps: [{ click: 'open' }, { click: 'toggle' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).slice(2)).toEqual([
    ['onClose'],
    ['afterClose'],
    ['afterOpenChange', { open: false }],
  ]);
});

// A popup whose content counts its mounts, with a hover DropdownMenu that holds the close button,
// so the dropdown is still open when the popup closes.
function remountPage({ type = 'Modal', properties = {} } = {}) {
  return {
    id: 'home',
    blocks: [
      methodButton({ id: 'open', blockId: 'popup', method: 'setOpen', args: [{ open: true }] }),
      {
        id: 'popup',
        type,
        properties,
        blocks: [
          { id: 'inside', type: 'Paragraph', events: { onMount: [record('onMount')] } },
          {
            id: 'menu',
            type: 'DropdownMenu',
            properties: { links: [{ id: 'item' }] },
            events: { onOpenChange: [record('onOpenChange')] },
            blocks: [
              methodButton({
                id: 'close',
                blockId: 'popup',
                method: 'setOpen',
                args: [{ open: false }],
              }),
            ],
          },
        ],
      },
    ],
  };
}

const REMOUNT_STEPS = [
  { click: 'open' },
  { open: 'menu' },
  { click: 'close' },
  { expect: { hidden: 'inside' } },
  { click: 'open' },
  { open: 'menu' },
];

test('Modal with destroyOnHidden mounts its content again on each open, its dropdown closed', async () => {
  const { log, result } = await runTestJourney({
    pages: [remountPage({ properties: { destroyOnHidden: true } })],
    steps: REMOUNT_STEPS,
  });
  expect(result.passed).toBe(true);
  // The dropdown unmounted while open, which fires nothing, and opens again from closed.
  expect(readLog(log)).toEqual([
    ['onMount'],
    ['onOpenChange', { open: true }],
    ['onMount'],
    ['onOpenChange', { open: true }],
  ]);
});

test('Modal without destroyOnHidden keeps its content mounted, its dropdown open', async () => {
  const { log, result } = await runTestJourney({
    pages: [remountPage()],
    steps: REMOUNT_STEPS,
  });
  expect(result.passed).toBe(true);
  // The click on open lands outside the dropdown, which is still mounted and open.
  expect(readLog(log)).toEqual([
    ['onMount'],
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
    ['onOpenChange', { open: true }],
  ]);
});

test('Modal with destroyOnHidden and forceRender keeps its content mounted', async () => {
  const { log, result } = await runTestJourney({
    pages: [remountPage({ properties: { destroyOnHidden: true, forceRender: true } })],
    steps: REMOUNT_STEPS.slice(0, 5),
  });
  expect(result.passed).toBe(true);
  // forceRender mounts the content with the page, before the first open.
  expect(readLog(log)).toEqual([
    ['onMount'],
    ['onOpenChange', { open: true }],
    ['onOpenChange', { open: false }],
  ]);
});

test('Drawer with destroyOnHidden mounts its content again on each open', async () => {
  const { log, result } = await runTestJourney({
    pages: [remountPage({ type: 'Drawer', properties: { destroyOnHidden: true } })],
    steps: REMOUNT_STEPS,
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['onMount'],
    ['onOpenChange', { open: true }],
    ['onMount'],
    ['onOpenChange', { open: true }],
  ]);
});

test('Modal with destroyOnHidden closed from inside a closed hover dropdown: the dropdown is gone', async () => {
  // The click reaches the dropdown's trigger, but the close unmounts it before it can open.
  const { log, result } = await runTestJourney({
    pages: [remountPage({ properties: { destroyOnHidden: true } })],
    steps: [{ click: 'open' }, { click: 'close' }, { expect: { hidden: 'inside' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onMount']]);
});
