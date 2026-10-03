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

// One recorded corpus shared by the compiler tests: three dev sessions on the
// orders page as v1 records. Session A is the happy path; sessions B and C
// drive the same short flow, and B fails on submit.

const blockMetas = {
  Button: { category: 'button' },
  NumberInput: { category: 'input', valueType: 'number' },
  TextInput: { category: 'input', valueType: 'string' },
};

function base({ session, t }) {
  return {
    v: 1,
    source: 'dev',
    session,
    person: null,
    org: null,
    roles: ['sales'],
    t,
    build: '2026-09-01T09:00:00.000Z',
    run: null,
    page_id: 'orders',
    scope: 'page',
  };
}

function target({ block, blockType }) {
  return {
    block_id: block,
    block_type: blockType,
    row: null,
    column: null,
    text: null,
    nth: null,
    option: false,
  };
}

function pageview({ session, t, url = '/orders', ...rest }) {
  return { ...base({ session, t }), kind: 'pageview', url, target: null, event: null, ...rest };
}

function engine({ session, t, name, block, ...rest }) {
  return {
    ...base({ session, t }),
    kind: 'engine',
    target: null,
    event: { name, block_id: block, success: true, requests: [], state_writes: [] },
    ...rest,
  };
}

function change({ session, t, block, blockType, value, writes = true }) {
  return {
    ...base({ session, t }),
    kind: 'change',
    target: target({ block, blockType }),
    value,
    event: {
      name: 'onChange',
      block_id: block,
      success: true,
      requests: [],
      state_writes: writes
        ? [{ path: block, type: typeof value === 'number' ? 'number' : 'string', value }]
        : [],
    },
  };
}

function key({ session, t, block, chord, requests = [] }) {
  return {
    ...base({ session, t }),
    kind: 'key',
    key: chord,
    target: target({ block, blockType: 'TextInput' }),
    event: { name: 'onEnter', block_id: block, success: true, requests, state_writes: [] },
  };
}

function click({ session, t, block, event }) {
  return {
    ...base({ session, t }),
    kind: 'click',
    target: target({ block, blockType: 'Button' }),
    event,
  };
}

const sessionA = [
  pageview({ session: 's-a', t: '2026-09-01T10:00:00.000Z' }),
  {
    ...engine({ session: 's-a', t: '2026-09-01T10:00:00.100Z', name: 'onMount', block: 'orders' }),
  },
  change({
    session: 's-a',
    t: '2026-09-01T10:00:01.000Z',
    block: 'search',
    blockType: 'TextInput',
    value: 'a',
    writes: false,
  }),
  change({
    session: 's-a',
    t: '2026-09-01T10:00:01.200Z',
    block: 'qty',
    blockType: 'NumberInput',
    value: 2,
    writes: false,
  }),
  change({
    session: 's-a',
    t: '2026-09-01T10:00:01.400Z',
    block: 'search',
    blockType: 'TextInput',
    value: 'ab',
    writes: false,
  }),
  change({
    session: 's-a',
    t: '2026-09-01T10:00:01.600Z',
    block: 'qty',
    blockType: 'NumberInput',
    value: 25,
  }),
  change({
    session: 's-a',
    t: '2026-09-01T10:00:01.800Z',
    block: 'search',
    blockType: 'TextInput',
    value: 'abc',
  }),
  key({
    session: 's-a',
    t: '2026-09-01T10:00:05.000Z',
    block: 'search',
    chord: 'Enter',
    requests: [{ id: 'search_orders', ok: true, ms: 31 }],
  }),
  key({ session: 's-a', t: '2026-09-01T10:00:05.500Z', block: 'search', chord: 'Escape' }),
  engine({ session: 's-a', t: '2026-09-01T10:00:07.000Z', name: 'onWidgetReady', block: 'widget' }),
  click({
    session: 's-a',
    t: '2026-09-01T10:00:08.000Z',
    block: 'submit',
    event: {
      name: 'onClick',
      block_id: 'submit',
      success: true,
      requests: [{ id: 'save_order', ok: true, ms: 120 }],
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
      url_after: '/orders/o-1?tab=items',
    },
  }),
  pageview({ session: 's-a', t: '2026-09-01T10:00:08.300Z', url: '/orders/o-1?tab=items' }),
];

function shortSession({ failing, session, startedAt }) {
  return [
    pageview({ session, t: `${startedAt}:00.000Z` }),
    engine({ session, t: `${startedAt}:00.100Z`, name: 'onInit', block: 'orders' }),
    change({
      session,
      t: `${startedAt}:01.000Z`,
      block: 'search',
      blockType: 'TextInput',
      value: 'x',
    }),
    click({
      session,
      t: `${startedAt}:02.000Z`,
      block: 'submit',
      event: failing
        ? {
            name: 'onClick',
            block_id: 'submit',
            success: false,
            error: {
              name: 'RequestError',
              config_key: 'pages.orders.blocks.2.events.onClick.0',
              action_type: 'Request',
              action_id: 'save',
            },
            requests: [{ id: 'save_order', ok: false, ms: 90 }],
            state_writes: [],
          }
        : {
            name: 'onClick',
            block_id: 'submit',
            success: true,
            requests: [{ id: 'save_order', ok: true, ms: 90 }],
            state_writes: [{ path: 'result.id', type: 'string', value: 'o-2' }],
          },
    }),
  ];
}

const traceRecords = [
  ...sessionA,
  ...shortSession({ failing: true, session: 's-b', startedAt: '2026-09-01T11:00' }),
  ...shortSession({ failing: false, session: 's-c', startedAt: '2026-09-02T09:00' }),
];

export { blockMetas, traceRecords };
