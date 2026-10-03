/**
 * @jest-environment jsdom
 */
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

import { jest } from '@jest/globals';
import { validateTraceRecord } from '@lowdefy/node-utils';

import createPairingBuffer, { HOLD_MS } from './createPairingBuffer.js';
import createPasswordRedactor from './createPasswordRedactor.js';

const START = Date.parse('2026-10-03T14:00:00.000Z');
const SESSION = '20261003T140000Z-k3x9qa';
let records;
let buffer;

// A stand-in for the engine's describeElement: block ids from the bl-
// wrappers, innermost first, and the element's text.
function describe(element) {
  const blockIds = [];
  for (let node = element; node !== null; node = node.parentElement) {
    if (node.id?.startsWith('bl-')) blockIds.push(node.id.slice(3));
  }
  const text = element.textContent.trim();
  return {
    page_id: 'tickets',
    block_id: blockIds[0] ?? null,
    block_type: null,
    row: null,
    column: null,
    text: text === '' ? null : text,
    nth: null,
    option: element.getAttribute('role') === 'option',
    block_ids: blockIds,
  };
}

function payload({
  blockId,
  eventName = 'onClick',
  at,
  debounceMs = 0,
  scope = 'page',
  success = true,
  failure = null,
  state = {},
  stateBefore = {},
  requests = {},
  responses = {},
}) {
  return {
    scope,
    pageId: 'tickets',
    blockId,
    blockType: 'Button',
    eventName,
    success,
    failure,
    debounceMs,
    actions: [],
    record: { startTimestamp: new Date(START + at), responses },
    context: { state, requests },
    stateBefore,
  };
}

function interact({ element, kind = 'click', at, value }) {
  buffer.addInteraction({
    t: START + at,
    kind,
    element,
    target: describe(element),
    pageId: 'tickets',
    value,
  });
}

function event(options) {
  jest.setSystemTime(START + options.arrive);
  buffer.addEvent(payload(options), { urlAfter: '/tickets' });
}

function closeAll() {
  jest.advanceTimersByTime(HOLD_MS + 60000);
}

function el(id) {
  return document.getElementById(id);
}

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'], now: START });
  records = [];
  buffer = createPairingBuffer({
    onRecord: (record) => records.push(record),
    getSession: () => SESSION,
    getRoles: () => ['support'],
    redactor: createPasswordRedactor(),
  });
  document.body.innerHTML = `
    <div id="bl-card"><div id="bl-save"><button id="save-button">Save</button></div></div>
    <div id="bl-table"><div id="row">Row 1</div></div>
    <div id="bl-search"><input id="search_input" /></div>
    <div id="bl-status"><div class="popup"><div id="option-open" role="option">Open</div></div></div>
    <div id="bl-password"><input id="password_input" type="password" /></div>
    <div id="bl-outer"><div id="bl-inner"><button id="inner-button">Go</button></div></div>
    <div id="blank"></div>
  `;
});

afterEach(() => {
  jest.useRealTimers();
});

test('typing then a debounced trailing onChange pairs the event with the last keystroke only', () => {
  [0, 100, 200].forEach((at, index) => {
    interact({ element: el('search_input'), kind: 'change', at, value: 'abc'.slice(0, index + 1) });
  });
  event({ blockId: 'search', eventName: 'onChange', at: 700, arrive: 710, debounceMs: 500 });
  closeAll();
  expect(records.map((record) => record.kind)).toEqual(['change', 'change', 'change']);
  expect(records.map((record) => record.value)).toEqual(['a', 'ab', 'abc']);
  expect(records[0].event).toBe(null);
  expect(records[1].event).toBe(null);
  expect(records[2].event).toMatchObject({ name: 'onChange', block_id: 'search' });
});

test('a mount-time request becomes a kind engine record and pairs with nothing', () => {
  interact({ element: el('save-button'), at: 0 });
  event({
    blockId: 'tickets',
    eventName: 'onMount',
    at: 10,
    arrive: 200,
    context: undefined,
    requests: { get_tickets: [{ actionId: 'fetch', responseTime: 40 }] },
    responses: { fetch: { type: 'Request' } },
  });
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    kind: 'engine',
    scope: 'page',
    page_id: 'tickets',
    target: null,
    event: { name: 'onMount', requests: [{ id: 'get_tickets', ok: true, ms: 40 }] },
  });
  closeAll();
  expect(records[1]).toMatchObject({ kind: 'click', event: null });
});

test('an app event becomes a kind engine record with scope app', () => {
  event({ blockId: 'root', eventName: 'onInit', scope: 'app', at: 0, arrive: 5 });
  expect(records[0]).toMatchObject({ kind: 'engine', scope: 'app' });
});

test("a click on a Button with no actions pairs with the enclosing Card's onClick", () => {
  interact({ element: el('save-button'), at: 0 });
  event({ blockId: 'card', at: 20, arrive: 30 });
  closeAll();
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    kind: 'click',
    target: { block_id: 'save', text: 'Save' },
    event: { name: 'onClick', block_id: 'card' },
  });
});

test('a Table onSelectionChange during a click on a Button outside it becomes a kind engine record', () => {
  interact({ element: el('save-button'), at: 0 });
  event({ blockId: 'table', eventName: 'onSelectionChange', at: 50, arrive: 60 });
  closeAll();
  expect(records.map((record) => record.kind)).toEqual(['engine', 'click']);
  expect(records[1].event).toBe(null);
});

test("a Selector popup option click pairs with the Selector's onChange", () => {
  interact({ element: el('option-open'), at: 0 });
  event({ blockId: 'status', eventName: 'onChange', at: 15, arrive: 20 });
  closeAll();
  expect(records[0]).toMatchObject({
    kind: 'click',
    target: { block_id: 'status', option: true, text: 'Open' },
    event: { name: 'onChange', block_id: 'status' },
  });
});

test('bubble: true with two handlers records the inner event and the outer in also', () => {
  interact({ element: el('inner-button'), at: 0 });
  event({ blockId: 'outer', at: 5, arrive: 900 });
  event({ blockId: 'inner', at: 5, arrive: 40 });
  closeAll();
  expect(records[0].event).toMatchObject({ block_id: 'inner' });
  expect(records[0].also).toEqual([expect.objectContaining({ block_id: 'outer' })]);
});

test('a slow event that finishes after a second still pairs with its click', () => {
  interact({ element: el('save-button'), at: 0 });
  event({ blockId: 'save', at: 10, arrive: 4000 });
  closeAll();
  expect(records).toHaveLength(1);
  expect(records[0].event).toMatchObject({ block_id: 'save' });
});

test('a click with no Lowdefy event is recorded with event null, and a click on nothing is dropped', () => {
  interact({ element: el('save-button'), at: 0 });
  interact({ element: el('blank'), at: 10 });
  closeAll();
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({ kind: 'click', event: null });
});

test('a record keeps page_id on the record, not the target, and a failed event carries its error', () => {
  interact({ element: el('save-button'), at: 0 });
  event({
    blockId: 'save',
    at: 10,
    arrive: 50,
    success: false,
    failure: {
      actionId: 'validate',
      actionType: 'Validate',
      configKey: 'k1',
      errorName: 'UserError',
      invalidBlocks: ['assignee'],
    },
  });
  closeAll();
  const [record] = records;
  expect(record.page_id).toBe('tickets');
  expect(record.target).not.toHaveProperty('page_id');
  expect(record.target).not.toHaveProperty('block_ids');
  expect(record.roles).toEqual(['support']);
  expect(record.event).toMatchObject({
    success: false,
    error: { name: 'UserError', config_key: 'k1', action_type: 'Validate', action_id: 'validate' },
    invalid_blocks: ['assignee'],
  });
});

test('a password value and its state writes are redacted, including a later SetState echo', () => {
  interact({ element: el('password_input'), kind: 'change', at: 0, value: 'hunter2' });
  event({
    blockId: 'password',
    eventName: 'onChange',
    at: 5,
    arrive: 10,
    stateBefore: {},
    state: { password: 'hunter2', other: 'x' },
  });
  event({
    blockId: 'save',
    at: 20000,
    arrive: 20010,
    stateBefore: { password: 'hunter2' },
    state: { password: 'hunter3' },
  });
  closeAll();
  const change = records.find((record) => record.kind === 'change');
  expect(change).toMatchObject({ value: null, redacted: true });
  expect(change.event.state_writes).toEqual([
    { path: 'password', type: 'string', value: null, redacted: true },
    { path: 'other', type: 'string', value: 'x' },
  ]);
  const echo = records.find((record) => record.kind === 'engine');
  expect(echo.event.state_writes).toEqual([
    { path: 'password', type: 'string', value: null, redacted: true },
  ]);
  expect(JSON.stringify(records)).not.toContain('hunter');
});

test('pageview and back are recorded at once and flushAll ends every hold', () => {
  buffer.addInteraction({ t: START, kind: 'pageview', pageId: 'tickets', url: '/tickets?id=1' });
  buffer.addInteraction({ t: START + 5, kind: 'back', pageId: 'tickets' });
  interact({ element: el('save-button'), at: 10 });
  expect(records.map((record) => record.kind)).toEqual(['pageview', 'back']);
  buffer.flushAll();
  expect(records.map((record) => record.kind)).toEqual(['pageview', 'back', 'click']);
  expect(records[0]).toMatchObject({ url: '/tickets?id=1', target: null, event: null });
});

test('every record the buffer builds passes validateTraceRecord once the route stamps its source', () => {
  buffer.addInteraction({ t: START, kind: 'pageview', pageId: 'tickets', url: '/tickets' });
  interact({ element: el('search_input'), kind: 'change', at: 10, value: 'a' });
  interact({ element: el('password_input'), kind: 'change', at: 20, value: 'secret' });
  buffer.addInteraction({
    t: START + 30,
    kind: 'key',
    key: 'Enter',
    target: describe(el('search_input')),
    pageId: 'tickets',
  });
  event({ blockId: 'search', eventName: 'onChange', at: 15, arrive: 20 });
  event({ blockId: 'table', eventName: 'onSelectionChange', at: 40, arrive: 50 });
  event({ blockId: 'root', eventName: 'onInit', scope: 'app', at: 60, arrive: 70 });
  interact({ element: el('save-button'), at: 80 });
  event({
    blockId: 'save',
    at: 90,
    arrive: 95,
    success: false,
    failure: { errorName: 'Error', invalidBlocks: [] },
  });
  closeAll();
  expect(records.map((record) => record.kind).sort()).toEqual([
    'change',
    'change',
    'click',
    'engine',
    'engine',
    'key',
    'pageview',
  ]);
  records.forEach((record) => {
    expect(validateTraceRecord({ record: { ...record, source: 'dev', build: null } })).toEqual({});
  });
});
