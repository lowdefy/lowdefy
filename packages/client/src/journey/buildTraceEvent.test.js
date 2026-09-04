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

import buildTraceEvent from './buildTraceEvent.js';

const window = { location: { href: 'https://app.test/orders?page=2' } };

const actions = [
  { id: 'save', type: 'Request', '~k': 'k1' },
  {
    ':if': true,
    ':then': [{ id: 'notify', type: 'Message', '~k': 'k2' }],
    ':else': [{ id: 'cancel', type: 'Reset', '~k': 'k3' }],
  },
  { id: 'refresh', type: 'Request', async: true, '~k': 'k4' },
];

const context = {
  pageId: 'orders',
  requests: {
    saveOrder: [{ actionId: 'save', requestId: 'saveOrder', responseTime: 42, response: {} }],
    unrelated: [{ actionId: 'other', requestId: 'unrelated', responseTime: 9 }],
  },
  state: { total: 3, customer: { email: 'a@b.c' } },
};

const record = {
  blockId: 'save_button',
  endTimestamp: new Date('2026-09-04T10:00:00.000Z'),
  event: { key: 'Enter' },
  eventName: 'onClick',
  responses: {
    save: { type: 'Request', response: {}, index: 0 },
    notify: { type: 'Message', response: null, index: 1 },
    cancel: { type: 'Reset', skipped: true, index: 2 },
  },
  success: true,
};

test('buildTraceEvent composes a trace event of config ids, action outcomes and the requests the event fired', () => {
  const traceEvent = buildTraceEvent({
    actions,
    context,
    pageInstance: 'sess-1:1',
    record,
    sessionId: 'sess-1',
    stateBefore: { total: 2 },
    values: false,
    window,
  });

  expect(traceEvent).toEqual({
    t: '2026-09-04T10:00:00.000Z',
    session_id: 'sess-1',
    page_instance: 'sess-1:1',
    page_id: 'orders',
    block_id: 'save_button',
    block_type: null,
    event_name: 'onClick',
    success: true,
    error: null,
    actions: [
      { id: 'save', type: 'Request', config_key: 'k1', outcome: 'ok' },
      { id: 'notify', type: 'Message', config_key: 'k2', outcome: 'ok' },
      { id: 'cancel', type: 'Reset', config_key: 'k3', outcome: 'skipped' },
      { id: 'refresh', type: 'Request', config_key: 'k4', outcome: 'pending' },
    ],
    requests: [{ request_id: 'saveOrder', success: true, duration_ms: 42 }],
    state_writes: [
      { path: 'total', type: 'number' },
      { path: 'customer.email', type: 'string' },
    ],
    url_after: 'https://app.test/orders?page=2',
  });
});

test('buildTraceEvent carries the payload and the written values only when values is true', () => {
  const prod = buildTraceEvent({
    actions: [],
    context,
    pageInstance: 'sess-1:1',
    record,
    sessionId: 'sess-1',
    stateBefore: { total: 2 },
    values: false,
    window,
  });
  expect(prod.payload).toBeUndefined();
  expect(prod.state_writes.every((write) => !('value' in write))).toBe(true);

  const dev = buildTraceEvent({
    actions: [],
    context,
    pageInstance: 'sess-1:1',
    record,
    sessionId: 'sess-1',
    stateBefore: { total: 2 },
    values: true,
    window,
  });
  expect(dev.payload).toEqual({ key: 'Enter' });
  expect(dev.state_writes).toContainEqual({ path: 'total', type: 'number', value: 3 });
});

test('buildTraceEvent reports a failed event with the error name and its config key', () => {
  const traceEvent = buildTraceEvent({
    actions: [{ id: 'save', type: 'Request', '~k': 'k1' }],
    context,
    pageInstance: 'sess-1:1',
    record: {
      ...record,
      error: { name: 'RequestError', configKey: 'k1' },
      responses: { save: { type: 'Request', error: { name: 'RequestError' }, index: 0 } },
      success: false,
    },
    sessionId: 'sess-1',
    stateBefore: context.state,
    values: false,
    window,
  });

  expect(traceEvent.success).toBe(false);
  expect(traceEvent.error).toEqual({ name: 'RequestError', config_key: 'k1' });
  expect(traceEvent.actions).toEqual([
    { id: 'save', type: 'Request', config_key: 'k1', outcome: 'error' },
  ]);
});
