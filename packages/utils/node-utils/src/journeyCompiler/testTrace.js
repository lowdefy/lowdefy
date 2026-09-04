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

// One recorded corpus, shared by the compiler tests: three sessions on the
// orders page, one of which fails, covering every row of the mapping table and
// both kinds of record the compiler drops.

const blockMetas = {
  Button: { category: 'button' },
  NumberInput: { category: 'input', valueType: 'number' },
  TextInput: { category: 'input', valueType: 'string' },
};

const blockTypes = {
  'orders.qty': 'NumberInput',
  'orders.refresh': 'Button',
  'orders.search': 'TextInput',
  'orders.submit': 'Button',
};

const ok = (id, actionType) => ({ config_key: `k_${id}`, id, outcome: 'ok', type: actionType });

// Session A: the happy path, typed into two fields alternately.
const sessionA = [
  {
    t: '2026-09-01T10:00:00.000Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'page',
    event_name: 'onMount',
    success: true,
    actions: [ok('a_mount', 'SetState')],
    requests: [],
    state_writes: [{ path: 'loaded', type: 'boolean', value: true }],
    url_after: 'https://app.example.com/orders',
    rid: 'rid-a',
  },
  {
    t: '2026-09-01T10:00:01.000Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [ok('a_s1', 'Validate')],
    requests: [],
    state_writes: [{ path: 'search', type: 'string', value: 'a' }],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:01.200Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'qty',
    event_name: 'onChange',
    success: true,
    actions: [ok('a_q1', 'Validate')],
    requests: [],
    state_writes: [{ path: 'qty', type: 'number', value: 2 }],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:01.400Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [ok('a_s2', 'Validate')],
    requests: [],
    state_writes: [{ path: 'search', type: 'string', value: 'ab' }],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:01.600Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'qty',
    event_name: 'onChange',
    success: true,
    actions: [ok('a_q2', 'Validate')],
    requests: [],
    state_writes: [{ path: 'qty', type: 'number', value: 25 }],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:01.800Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [ok('a_s3', 'Validate')],
    requests: [],
    state_writes: [{ path: 'search', type: 'string', value: 'abc' }],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:05.000Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'search',
    event_name: 'onEnter',
    success: true,
    actions: [ok('a_e1', 'Request')],
    requests: [{ duration_ms: 31, request_id: 'search_orders', success: true }],
    state_writes: [],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:05.500Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'search',
    event_name: 'onKeyDown',
    success: true,
    actions: [ok('a_k1', 'SetState')],
    payload: { key: 'Escape' },
    requests: [],
    state_writes: [],
    url_after: 'https://app.example.com/orders',
  },
  {
    // Debounced: the actions never ran, so this is not a step a user took.
    t: '2026-09-01T10:00:06.000Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [],
    requests: [],
    state_writes: [],
    url_after: 'https://app.example.com/orders',
  },
  {
    // An async chain whose outcome resolved after the record was built.
    t: '2026-09-01T10:00:06.500Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'refresh',
    event_name: 'onClick',
    success: true,
    actions: [{ config_key: 'k_a_r1', id: 'a_r1', outcome: 'pending', type: 'Request' }],
    requests: [],
    state_writes: [],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:07.000Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'widget',
    event_name: 'onWidgetReady',
    success: true,
    actions: [ok('a_w1', 'SetState')],
    requests: [],
    state_writes: [],
    url_after: 'https://app.example.com/orders',
  },
  {
    t: '2026-09-01T10:00:08.000Z',
    session_id: 's-a',
    page_instance: 'pi-a',
    page_id: 'orders',
    block_id: 'submit',
    event_name: 'onClick',
    success: true,
    actions: [ok('a_c1', 'Request'), ok('a_c2', 'Link')],
    requests: [{ duration_ms: 120, request_id: 'save_order', success: true }],
    state_writes: [
      { path: 'result.rows', type: 'array', value: [1, 2] },
      { path: 'result.id', type: 'string', value: 'o-1' },
      { path: 'result.total', type: 'number', value: 42 },
      { path: 'result.open', type: 'boolean', value: false },
      { path: 'result.note', type: 'string', value: 'ok' },
      { path: 'result.at', type: 'date', value: '2026-09-01T10:00:08.000Z' },
      { path: 'result.owner', type: 'string', value: 'sam' },
      { path: 'draft', type: 'undefined' },
    ],
    url_after: 'https://app.example.com/orders/o-1?tab=items',
  },
];

// Sessions B and C drive the same short sequence; B fails on submit.
const shortSession = ({ failing, pageInstance, rid, sessionId, startedAt }) => [
  {
    t: `${startedAt}:00.000Z`,
    session_id: sessionId,
    page_instance: pageInstance,
    page_id: 'orders',
    block_id: 'page',
    event_name: 'onInit',
    success: true,
    actions: [ok(`${sessionId}_init`, 'SetState')],
    requests: [],
    state_writes: [],
    url_after: 'https://app.example.com/orders',
    rid,
  },
  {
    t: `${startedAt}:01.000Z`,
    session_id: sessionId,
    page_instance: pageInstance,
    page_id: 'orders',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [ok(`${sessionId}_s`, 'Validate')],
    block_type: 'TextInput',
    requests: [],
    state_writes: [{ path: 'search', type: 'string', value: 'x' }],
    url_after: 'https://app.example.com/orders',
    rid,
  },
  {
    t: `${startedAt}:02.000Z`,
    session_id: sessionId,
    page_instance: pageInstance,
    page_id: 'orders',
    block_id: 'submit',
    event_name: 'onClick',
    ...(failing
      ? {
          error_name: 'RequestError',
          config_key: 'pages.orders.blocks.2.events.onClick.0',
          success: false,
          actions: [{ config_key: 'k_c', id: `${sessionId}_c`, outcome: 'error', type: 'Request' }],
        }
      : { success: true, actions: [ok(`${sessionId}_c`, 'Request')] }),
    requests: [{ duration_ms: 90, request_id: 'save_order', success: !failing }],
    state_writes: failing ? [] : [{ path: 'result.id', type: 'string', value: 'o-2' }],
    url_after: 'https://app.example.com/orders',
    rid,
  },
];

const traceRows = [
  ...sessionA,
  ...shortSession({
    failing: true,
    pageInstance: 'pi-b',
    rid: 'rid-b',
    sessionId: 's-b',
    startedAt: '2026-09-01T11:00',
  }),
  ...shortSession({
    failing: false,
    pageInstance: 'pi-c',
    rid: 'rid-c',
    sessionId: 's-c',
    startedAt: '2026-09-02T09:00',
  }),
];

const traceJsonl = traceRows.map((row) => JSON.stringify(row)).join('\n');

export { blockMetas, blockTypes, traceJsonl, traceRows };
