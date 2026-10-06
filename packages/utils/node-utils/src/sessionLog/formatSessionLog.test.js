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

import formatSessionLog from './formatSessionLog.js';
import traceRecord from '../journeyCompiler/traceRecord.js';

function event({ name = 'onClick', block, success = true, ...rest }) {
  return {
    name,
    block_id: block,
    success,
    actions: [],
    requests: [],
    endpoints: [],
    state_writes: [],
    url_after: null,
    ...rest,
  };
}

function pageview({ at, page, url, ...rest }) {
  return traceRecord({ at, page, kind: 'pageview', url: url ?? `/${page}`, ...rest });
}

test('formatSessionLog keeps a failed Validate and its retry as two attempts', () => {
  const records = [
    pageview({ at: 0, page: 'ticket-new' }),
    traceRecord({ at: 1, page: 'ticket-new', kind: 'change', block: 'title', value: 'Quarterly' }),
    traceRecord({
      at: 2,
      page: 'ticket-new',
      block: 'save',
      event: event({
        block: 'save',
        success: false,
        actions: ['Validate'],
        error: { name: 'UserError', action_type: 'Validate', config_key: null, action_id: 'v' },
        invalid_blocks: ['priority'],
      }),
    }),
    traceRecord({ at: 4, page: 'ticket-new', kind: 'change', block: 'priority', value: 'high' }),
    traceRecord({
      at: 5,
      page: 'ticket-new',
      block: 'save',
      event: event({
        block: 'save',
        actions: ['Validate', 'Request', 'Link'],
        requests: [{ id: 'createTicket', ok: true, ms: 40 }],
        url_after: '/tickets',
      }),
    }),
    pageview({ at: 6, page: 'tickets' }),
  ];
  expect(formatSessionLog({ records })).toEqual({
    id: 's-1',
    start: '2026-09-28T14:00:00.000Z',
    end: '2026-09-28T14:00:06.000Z',
    lines: [
      'page ticket-new',
      'fill title "Quarterly"',
      'click save → Validate failed [priority]',
      'fill priority "high"',
      'click save → ran Validate, Link, request createTicket ok',
      'page tickets',
    ],
  });
});

test('formatSessionLog shows a click on a modal button and the event the modal ran', () => {
  const records = [
    pageview({ at: 0, page: 'tickets' }),
    traceRecord({ at: 1, page: 'tickets', block: 'deleteTicket', text: 'Delete' }),
    traceRecord({ at: 3, page: 'tickets', text: 'OK' }),
    traceRecord({
      at: 3.2,
      page: 'tickets',
      kind: 'engine',
      event: event({
        name: 'onOk',
        block: 'confirmDelete',
        actions: ['Request', 'SetState'],
        requests: [{ id: 'deleteTicket', ok: true, ms: 12 }],
      }),
    }),
  ];
  expect(formatSessionLog({ records }).lines).toEqual([
    'page tickets',
    'click deleteTicket "Delete"',
    'click "OK"',
    'onOk on confirmDelete → ran SetState, request deleteTicket ok',
  ]);
});

test('formatSessionLog names the endpoint a CallAPI called and whether it failed', () => {
  const records = [
    traceRecord({
      at: 0,
      page: 'invoices',
      block: 'sync',
      event: event({
        block: 'sync',
        actions: ['CallAPI'],
        endpoints: [{ id: 'syncInvoices', ok: true, ms: 90 }],
      }),
    }),
    traceRecord({
      at: 4,
      page: 'invoices',
      block: 'sync',
      event: event({
        block: 'sync',
        success: false,
        actions: ['CallAPI'],
        endpoints: [{ id: 'syncInvoices', ok: false, ms: 90 }],
        error: { name: 'ServiceError', action_type: 'CallAPI', config_key: null, action_id: 'c' },
      }),
    }),
  ];
  expect(formatSessionLog({ records }).lines).toEqual([
    'click sync → endpoint syncInvoices ok',
    'click sync → endpoint syncInvoices failed, CallAPI failed',
  ]);
});

test('formatSessionLog shows generated ids as state values, never as assertions', () => {
  const records = [
    traceRecord({
      at: 0,
      page: 'tickets',
      block: 'create',
      event: event({
        block: 'create',
        actions: ['SetState'],
        state_writes: [
          { path: 'ticket_id', type: 'string', value: 't-8f2a' },
          { path: 'password', type: 'string', value: null, redacted: true },
          { path: 'draft', type: 'undefined' },
        ],
      }),
    }),
  ];
  expect(formatSessionLog({ records }).lines).toEqual([
    'click create → ran SetState, state ticket_id = "t-8f2a", password (redacted), draft removed',
  ]);
});

test('formatSessionLog leaves out quiet mount events and keeps those that called a request', () => {
  const records = [
    pageview({ at: 0, page: 'tickets' }),
    traceRecord({
      at: 0.1,
      page: 'tickets',
      kind: 'engine',
      event: event({ name: 'onMount', block: 'tickets', actions: ['SetState'] }),
    }),
    traceRecord({
      at: 0.2,
      page: 'tickets',
      kind: 'engine',
      event: event({
        name: 'onMountAsync',
        block: 'tickets',
        actions: ['Request'],
        requests: [{ id: 'getTickets', ok: true, ms: 8 }],
      }),
    }),
  ];
  expect(formatSessionLog({ records }).lines).toEqual([
    'page tickets',
    'onMount on tickets → ran SetState',
    'onMountAsync on tickets → request getTickets ok',
  ]);
});

test('formatSessionLog marks a config rebuild and keeps the page with path values', () => {
  const records = [
    pageview({ at: 0, page: 'ticket', url: '/ticket/t-1', build: 'b-1' }),
    traceRecord({ at: 1, page: 'ticket', block: 'close', build: 'b-1' }),
    pageview({ at: 30, page: 'ticket', url: '/ticket/t-1', build: 'b-2' }),
    traceRecord({ at: 31, page: 'ticket', kind: 'key', key: 'Escape', build: 'b-2' }),
    traceRecord({ at: 32, page: 'ticket', kind: 'key', key: 'a', block: 'title', build: 'b-2' }),
    traceRecord({ at: 33, page: 'ticket', kind: 'back', build: 'b-2' }),
  ];
  expect(formatSessionLog({ records }).lines).toEqual([
    'page ticket /ticket/t-1',
    'click close',
    '(config rebuilt)',
    'page ticket /ticket/t-1',
    'press Escape',
    'back',
  ]);
});

test('formatSessionLog says why an input no journey verb drives has no step', () => {
  const records = [
    traceRecord({
      at: 0,
      page: 'tickets',
      kind: 'change',
      block: 'due',
      blockType: 'DateSelector',
      value: '2026-10-01',
    }),
    traceRecord({ at: 1, page: 'tickets', kind: 'change', block: 'status', text: null }),
    traceRecord({
      at: 2,
      page: 'tickets',
      kind: 'change',
      block: 'secret',
      redacted: true,
      value: null,
    }),
  ];
  const blockMetas = { DateSelector: { valueType: 'date' } };
  expect(formatSessionLog({ records, blockMetas }).lines).toEqual([
    'change due "2026-10-01" (no journey verb drives DateSelector)',
    'fill status',
    'fill secret (password, not recorded)',
  ]);
});

test('formatSessionLog shows production clicks without values and with frustration', () => {
  const records = [
    traceRecord({ at: 0, source: 'production', page: 'tickets', kind: 'change', block: 'search' }),
    traceRecord({
      at: 1,
      source: 'production',
      page: 'tickets',
      block: 'export',
      frustration: 'dead',
    }),
    traceRecord({
      at: 2,
      source: 'production',
      page: 'tickets',
      block: 'row',
      token: 't_0123456789abcdef',
    }),
  ];
  expect(formatSessionLog({ records }).lines).toEqual([
    'fill search',
    'click export (dead click)',
    'click row (text not in config)',
  ]);
});

test('formatSessionLog throws when the records hold more than one session', () => {
  expect(() =>
    formatSessionLog({
      records: [
        traceRecord({ at: 0, block: 'a' }),
        traceRecord({ at: 1, block: 'b', session: 's-2' }),
      ],
    })
  ).toThrow(
    'formatSessionLog requires the valid records of exactly one session. Received 2 sessions: ["s-1","s-2"].'
  );
});
