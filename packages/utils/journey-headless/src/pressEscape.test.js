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

import runTestJourney, { methodButton, readLog, record, refuse } from './tests/runTestJourney.js';

const OPEN = [{ open: true }];

function logged(prefix, names) {
  return Object.fromEntries(names.map((name) => [name, [record(`${prefix}.${name}`)]]));
}

// A page with a Modal (holding a note input, a picker, a dropdown and a button that opens the
// Drawer over it), a Drawer, a DropdownButton, a Selector and a ClickableHtml confirm. Every
// event records itself as <block>.<event>.
function escapePage({ modal = {}, drawer = {}, extra = [] } = {}) {
  return {
    id: 'home',
    blocks: [
      methodButton({ id: 'open_modal', blockId: 'modal', method: 'setOpen', args: OPEN }),
      {
        id: 'modal',
        type: 'Modal',
        properties: modal.properties ?? {},
        events: {
          ...logged('modal', ['onOpen', 'onCancel', 'onClose', 'afterClose', 'afterOpenChange']),
          ...modal.events,
        },
        blocks: [
          { id: 'note', type: 'TextInput', events: modal.noteEvents ?? {} },
          {
            id: 'colour',
            type: 'Selector',
            properties: { options: ['Green', 'Red'] },
            events: logged('colour', ['onSearch']),
          },
          {
            id: 'actions',
            type: 'DropdownButton',
            properties: { items: [{ title: 'Archive', eventName: 'onArchive' }] },
            events: logged('actions', ['onOpenChange', 'onArchive']),
          },
          methodButton({ id: 'open_inner', blockId: 'drawer', method: 'setOpen', args: OPEN }),
        ],
      },
      methodButton({ id: 'open_drawer', blockId: 'drawer', method: 'setOpen', args: OPEN }),
      {
        id: 'drawer',
        type: 'Drawer',
        properties: drawer.properties ?? {},
        events: {
          ...logged('drawer', ['onOpen', 'onClose', 'afterClose', 'afterOpenChange']),
          ...drawer.events,
        },
        blocks: [{ id: 'details', type: 'Paragraph' }],
      },
      {
        id: 'export',
        type: 'DropdownButton',
        properties: { items: [{ title: 'CSV', eventName: 'onCsv' }] },
        events: logged('export', ['onOpenChange', 'onCsv']),
      },
      {
        id: 'tags',
        type: 'MultipleSelector',
        properties: { options: ['Green', 'Grey', 'Red'] },
        events: logged('tags', ['onSearch', 'onChange']),
      },
      {
        id: 'cards',
        type: 'ClickableHtml',
        properties: {
          dataEvents: [{ name: 'onDelete', confirm: 'Delete it?' }],
          html: '<button data-event="onDelete" data-id="task-1">Delete</button>',
        },
        events: logged('cards', ['onDelete']),
      },
      ...extra,
    ],
  };
}

const MODAL_OPENED = [['modal.onOpen'], ['modal.afterOpenChange', { open: true }]];
const MODAL_CANCELLED = [
  ['modal.onCancel'],
  ['modal.onClose'],
  ['modal.afterClose'],
  ['modal.afterOpenChange', { open: false }],
];

test('Escape on an open Modal fires onCancel, then closes it', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [{ click: 'open_modal' }, { press: 'Escape' }, { expect: { hidden: 'note' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([...MODAL_OPENED, ...MODAL_CANCELLED]);
});

test('Escape leaves a Modal with keyboard false open and fires nothing', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage({ modal: { properties: { keyboard: false } } })],
    steps: [{ click: 'open_modal' }, { press: 'Escape' }, { expect: { visible: 'note' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual(MODAL_OPENED);
});

test('Escape leaves a Modal open when its onCancel fails', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage({ modal: { events: { onCancel: [record('modal.onCancel'), refuse] } } })],
    steps: [{ click: 'open_modal' }, { press: 'Escape' }, { expect: { visible: 'note' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([...MODAL_OPENED, ['modal.onCancel']]);
});

test('Escape on an open Drawer fires onClose, then closes it', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [{ click: 'open_drawer' }, { press: 'Escape' }, { expect: { hidden: 'details' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['drawer.onOpen'],
    ['drawer.afterOpenChange', { drawerOpen: true, open: true }],
    ['drawer.onClose'],
    ['drawer.afterOpenChange', { drawerOpen: false, open: false }],
    ['drawer.afterClose'],
  ]);
});

test('Escape leaves a Drawer with keyboard false open', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage({ drawer: { properties: { keyboard: false } } })],
    steps: [{ click: 'open_drawer' }, { press: 'Escape' }, { expect: { visible: 'details' } }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).not.toContainEqual(['drawer.onClose']);
});

test('Escape closes the Drawer opened over a Modal, then the Modal', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [
      { click: 'open_modal' },
      { click: 'open_inner' },
      { press: 'Escape' },
      { expect: { hidden: 'details' } },
      { expect: { visible: 'note' } },
      { press: 'Escape' },
      { expect: { hidden: 'note' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual([
    'modal.onOpen',
    'modal.afterOpenChange',
    'drawer.onOpen',
    'drawer.afterOpenChange',
    'drawer.onClose',
    'drawer.afterOpenChange',
    'drawer.afterClose',
    'modal.onCancel',
    'modal.onClose',
    'modal.afterClose',
    'modal.afterOpenChange',
  ]);
});

test('Escape after a fill of a TextInput with no onEscape closes the Modal around it', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [
      { click: 'open_modal' },
      { fill: { blockId: 'note', value: 'Call back' } },
      { press: 'Escape' },
      { expect: { hidden: 'note' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([...MODAL_OPENED, ...MODAL_CANCELLED]);
});

test('Escape closes a dropdown in a Modal and leaves the Modal open', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [
      { click: 'open_modal' },
      { click: 'actions' },
      { press: 'Escape' },
      { expect: { visible: 'note' } },
      { press: 'Escape' },
      { expect: { hidden: 'note' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ...MODAL_OPENED,
    ['actions.onOpenChange', { open: true }],
    ['actions.onOpenChange', { open: false }],
    ...MODAL_CANCELLED,
  ]);
});

test('Escape closes an open DropdownButton, so the next click opens it again', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [{ click: 'export' }, { press: 'Escape' }, { click: 'export' }],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ['export.onOpenChange', { open: true }],
    ['export.onOpenChange', { open: false }],
    ['export.onOpenChange', { open: true }],
  ]);
});

test("Escape closes a Selector's search with onSearch '', and a second closes the Modal", async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [
      { click: 'open_modal' },
      { fill: { blockId: 'colour', value: 're' } },
      { press: 'Escape' },
      { expect: { visible: 'note' } },
      { press: 'Escape' },
      { expect: { hidden: 'note' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([
    ...MODAL_OPENED,
    ['colour.onSearch', { value: 're' }],
    ['colour.onSearch', { value: '' }],
    ...MODAL_CANCELLED,
  ]);
});

test("Escape closes a MultipleSelector's dropdown and keeps its search", async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [
      { fill: { blockId: 'tags', value: 'gr' } },
      { press: 'Escape' },
      { select: { blockId: 'tags', value: 'Red' } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(2);
  expect(result.failure.message).toBe(
    'No option with text "Red" appeared in the dropdown of block "tags": the search "gr" hides it.'
  );
  expect(readLog(log)).toEqual([['tags.onSearch', { value: 'gr' }]]);
});

test('Escape closes a ClickableHtml confirm and drops its event', async () => {
  const { log, result } = await runTestJourney({
    pages: [escapePage()],
    steps: [
      { click: { blockId: 'cards', control: 'onDelete', rowKey: 'task-1' } },
      { press: 'Escape' },
      { expect: { hidden: { blockId: 'cards', control: 'ok' } } },
      { click: { blockId: 'cards', control: 'onDelete', rowKey: 'task-1' } },
      { click: { blockId: 'cards', control: 'ok' } },
    ],
  });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['cards.onDelete', { id: 'task-1' }]]);
});

// A hover DropdownMenu whose trigger, a button in its content, opens the Drawer: a click on it
// keeps the mouse on the trigger, so the dropdown stays open beside the Drawer.
const VIEW_MENU = {
  id: 'view_menu',
  type: 'DropdownMenu',
  properties: { links: [{ id: 'compact' }] },
  events: logged('view_menu', ['onOpenChange']),
  blocks: [methodButton({ id: 'view_button', blockId: 'drawer', method: 'setOpen', args: OPEN })],
};

test.each([
  [
    'nothing is open',
    [],
    'Nothing is open for Escape to close, so in a browser it reaches the page: the step runs in a browser.',
  ],
  [
    'two dropdowns are open',
    [{ click: 'export' }, { fill: { blockId: 'tags', value: 'gr' } }],
    'Blocks "export", "tags" are all open, and which one a browser\'s Escape closes depends on the order they opened: the step runs in a browser.',
  ],
  [
    'a dropdown is open beside a popup',
    [{ click: 'view_button' }],
    'DropdownMenu "view_menu" is open beside Drawer "drawer", and which one a browser\'s Escape closes depends on the order they opened: the step runs in a browser.',
  ],
  [
    'a ConfirmModal is the newest overlay',
    [{ click: 'open_confirm' }],
    'Block "confirm" is of type ConfirmModal, which has no headless stand-in for press "Escape": the step runs in a browser.',
  ],
  [
    'the focus is in a TextInput with an onEscape',
    [{ click: 'open_modal' }, { fill: { blockId: 'note', value: 'x' } }],
    'The focus is in TextInput "note", which fires its own onEscape: the step runs in a browser.',
  ],
  [
    'the focus is in an input that handles Escape itself',
    [{ click: 'open_modal' }, { select: { blockId: 'size', value: 'Large' } }],
    'The focus is in RadioSelector "size", whose own Escape handling a headless run does not model: the step runs in a browser.',
  ],
])('Escape when %s runs in a browser', async (_, before, reason) => {
  const page = escapePage({
    modal: { noteEvents: { onEscape: [record('note.onEscape')] } },
    extra: [
      VIEW_MENU,
      methodButton({ id: 'open_confirm', blockId: 'confirm', method: 'open' }),
      { id: 'confirm', type: 'ConfirmModal', events: logged('confirm', ['onCancel']) },
      { id: 'size', type: 'RadioSelector', properties: { options: ['Small', 'Large'] } },
    ],
  });
  const { log, result } = await runTestJourney({
    pages: [page],
    steps: [...before, { press: 'Escape' }],
  });
  expect(result.browserOnly).toEqual({
    index: before.length,
    reason,
    step: { press: 'Escape' },
  });
  expect(readLog(log).map(([name]) => name)).not.toContain('note.onEscape');
});

test('Escape when a shortcut binds it runs in a browser', async () => {
  const shortcut = {
    id: 'dismiss',
    type: 'Button',
    events: { onClick: { try: [record('dismiss.onClick')], shortcut: 'Escape' } },
  };
  const { result } = await runTestJourney({
    pages: [escapePage({ extra: [shortcut] })],
    steps: [{ click: 'open_modal' }, { press: 'Escape' }],
  });
  expect(result.browserOnly.reason).toBe(
    'Block "dismiss" binds Escape as an event shortcut, which a headless press does not fire: the step runs in a browser.'
  );
});

test('Escape on a page with a forceRender Modal runs in a browser', async () => {
  const { result } = await runTestJourney({
    pages: [escapePage({ modal: { properties: { forceRender: true } } })],
    steps: [{ click: 'open_drawer' }, { press: 'Escape' }],
  });
  expect(result.browserOnly.reason).toBe(
    'Modal "modal" renders while closed (forceRender), which puts it on a browser\'s Escape stack from the start: the step runs in a browser.'
  );
});
