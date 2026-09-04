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

import logJourneyBatch from './logJourneyBatch.js';

const traceEvent = {
  t: '2026-09-04T10:00:00.000Z',
  session_id: 'sess-1',
  page_instance: 'sess-1:1',
  page_id: 'orders',
  block_id: 'save_button',
  block_type: null,
  event_name: 'onClick',
  success: true,
  error: null,
  actions: [{ id: 'save', type: 'Request', config_key: 'k1', outcome: 'ok' }],
  requests: [{ request_id: 'saveOrder', success: true, duration_ms: 42 }],
  state_writes: [{ path: 'total', type: 'number' }],
  url_after: 'https://app.test/orders',
};

function testContext({ collections = {}, events, user } = {}) {
  const logger = { debug: jest.fn(), info: jest.fn() };
  logger.eventsConfig = events;
  return {
    logger,
    rid: 'rid-1',
    readConfigFile: jest.fn(async () => collections),
    user,
  };
}

test('logJourneyBatch emits one info journey_event per trace event, whatever the logger.events level', async () => {
  const context = testContext();
  const result = await logJourneyBatch(context, { batch: { events: [traceEvent, traceEvent] } });

  expect(result).toEqual({ logged: 2, status: 'ok' });
  expect(context.logger.info).toHaveBeenCalledTimes(2);
  expect(context.logger.debug).not.toHaveBeenCalled();
  expect(context.logger.info.mock.calls[0][0]).toEqual({
    event: 'journey_event',
    rid: 'rid-1',
    t: '2026-09-04T10:00:00.000Z',
    session_id: 'sess-1',
    page_instance: 'sess-1:1',
    page_id: 'orders',
    block_id: 'save_button',
    block_type: null,
    event_name: 'onClick',
    success: true,
    config_key: null,
    error_name: null,
    actions: traceEvent.actions,
    requests: traceEvent.requests,
    state_writes: traceEvent.state_writes,
    url_after: 'https://app.test/orders',
    payload: null,
  });
});

test('logJourneyBatch stamps user and org only when logger.events.identity is on', async () => {
  const user = { id: 'user-1', organization_id: 'org-1' };

  const anonymous = testContext({ user });
  await logJourneyBatch(anonymous, { batch: { events: [traceEvent] } });
  expect(anonymous.logger.info.mock.calls[0][0].user).toBeUndefined();
  expect(anonymous.logger.info.mock.calls[0][0].org).toBeUndefined();

  const identified = testContext({ events: { identity: true }, user });
  await logJourneyBatch(identified, { batch: { events: [traceEvent] } });
  expect(identified.logger.info.mock.calls[0][0].user).toEqual({ id: 'user-1' });
  expect(identified.logger.info.mock.calls[0][0].org).toBe('org-1');
});

test('logJourneyBatch drops a state write whose last path segment is a declared pii field', async () => {
  const context = testContext({
    collections: { users: { pii: ['email'] }, orders: { pii: ['phone'] } },
  });
  await logJourneyBatch(context, {
    batch: {
      events: [
        {
          ...traceEvent,
          state_writes: [
            { path: 'total', type: 'number' },
            { path: 'customer.email', type: 'string', value: 'a@b.c' },
            { path: 'phone', type: 'string' },
          ],
        },
      ],
    },
  });

  expect(context.logger.info.mock.calls[0][0].state_writes).toEqual([
    { path: 'total', type: 'number' },
  ]);
});

test('logJourneyBatch logs nothing when logger.journeys.enabled is false', async () => {
  const context = testContext();
  const result = await logJourneyBatch(context, {
    batch: { events: [traceEvent] },
    journeys: { enabled: false },
  });

  expect(result).toEqual({ logged: 0, status: 'disabled' });
  expect(context.logger.info).not.toHaveBeenCalled();
  expect(context.readConfigFile).not.toHaveBeenCalled();
});

test.each([
  ['a non-object batch', 'nope'],
  ['a batch with no events array', { events: {} }],
  ['an event missing block_id', { events: [{ ...traceEvent, block_id: undefined }] }],
  ['an event whose success is not a boolean', { events: [{ ...traceEvent, success: 'yes' }] }],
  ['an event whose actions are not an array', { events: [{ ...traceEvent, actions: 'all' }] }],
])('logJourneyBatch reports %s as invalid and logs nothing', async (_, batch) => {
  const context = testContext();
  const result = await logJourneyBatch(context, { batch });

  expect(result.status).toBe('invalid');
  expect(context.logger.info).not.toHaveBeenCalled();
});

test('logJourneyBatch carries the dev-only payload and the error of a failed event', async () => {
  const context = testContext();
  await logJourneyBatch(context, {
    batch: {
      events: [
        {
          ...traceEvent,
          error: { name: 'RequestError', config_key: 'k1' },
          payload: { value: 'typed' },
          success: false,
        },
      ],
    },
  });

  const line = context.logger.info.mock.calls[0][0];
  expect(line.success).toBe(false);
  expect(line.error_name).toBe('RequestError');
  expect(line.config_key).toBe('k1');
  expect(line.payload).toEqual({ value: 'typed' });
});
