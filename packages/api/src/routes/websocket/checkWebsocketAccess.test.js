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

import { vi, beforeEach, expect, test } from 'vitest';
import { operatorsServer } from '@lowdefy/operators-js';
import { AuthorizationError } from '@lowdefy/errors';

import checkWebsocketAccess from './checkWebsocketAccess.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import testContext from '../../test/testContext.js';

// An operator that fails stands in for any fault in the check or its endpoint.
const operators = {
  ...operatorsServer,
  _fail: () => {
    throw new Error('Check failed to evaluate.');
  },
};

const logger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

function createTestContext({ endpoint, secrets, user = { id: 'user-1', roles: [] } } = {}) {
  const readConfigFile = vi.fn((path) => {
    if (path === 'api/can-view-ticket.json') {
      return endpoint;
    }
    return null;
  });
  const context = testContext({
    logger,
    operators,
    readConfigFile,
    secrets,
    user,
  });
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function returning(value) {
  return {
    endpointId: 'can-view-ticket',
    type: 'InternalApi',
    auth: { public: true },
    routine: { ':return': value },
  };
}

function websocketConfig(check) {
  return {
    id: 'websocket:ticket_events',
    websocketId: 'ticket_events',
    type: 'TestSource',
    '~k': 'websockets.0',
    check,
  };
}

const refusal = 'Websocket "ticket_events" does not exist.';

beforeEach(() => {
  vi.clearAllMocks();
});

test('checkWebsocketAccess does nothing for a websocket without a check', async () => {
  const context = createTestContext();
  await expect(
    checkWebsocketAccess(context, { payload: {}, websocketConfig: websocketConfig() })
  ).resolves.toBeUndefined();
  expect(context.readConfigFile).not.toHaveBeenCalled();
});

test('checkWebsocketAccess allows the subscription when the endpoint returns true', async () => {
  const context = createTestContext({ endpoint: returning(true) });
  await expect(
    checkWebsocketAccess(context, {
      payload: {},
      websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
    })
  ).resolves.toBeUndefined();
});

test.each([
  ['false', false],
  ['null', null],
  ['an object', { allowed: true }],
  ['the string "true"', 'true'],
  ['1', 1],
])(
  'checkWebsocketAccess refuses as a missing websocket when the endpoint returns %s',
  async (_, value) => {
    const context = createTestContext({ endpoint: returning(value) });
    const promise = checkWebsocketAccess(context, {
      payload: {},
      websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
    });
    await expect(promise).rejects.toThrow(AuthorizationError);
    await expect(promise).rejects.toThrow(refusal);
    expect(logger.error).not.toHaveBeenCalled();
  }
);

test('checkWebsocketAccess refuses when the endpoint routine ends without a return', async () => {
  const context = createTestContext({
    endpoint: {
      endpointId: 'can-view-ticket',
      type: 'InternalApi',
      auth: { public: true },
      routine: [],
    },
  });
  await expect(
    checkWebsocketAccess(context, {
      payload: {},
      websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
    })
  ).rejects.toThrow(refusal);
});

test('checkWebsocketAccess refuses when the endpoint rejects', async () => {
  const context = createTestContext({
    endpoint: {
      endpointId: 'can-view-ticket',
      type: 'InternalApi',
      auth: { public: true },
      routine: { ':reject': 'Not yours.' },
    },
  });
  await expect(
    checkWebsocketAccess(context, {
      payload: {},
      websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
    })
  ).rejects.toThrow(refusal);
});

test('checkWebsocketAccess refuses and logs at error level when the endpoint routine throws', async () => {
  const context = createTestContext({
    endpoint: {
      endpointId: 'can-view-ticket',
      type: 'InternalApi',
      auth: { public: true },
      routine: { ':return': { _fail: true } },
    },
  });
  const promise = checkWebsocketAccess(context, {
    payload: {},
    websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
  });
  await expect(promise).rejects.toThrow(AuthorizationError);
  await expect(promise).rejects.toThrow(refusal);
  expect(logger.error).toHaveBeenCalledTimes(1);
});

test('checkWebsocketAccess refuses and logs at error level when the check payload fails to evaluate', async () => {
  const context = createTestContext({ endpoint: returning(true) });
  const promise = checkWebsocketAccess(context, {
    payload: {},
    websocketConfig: websocketConfig({
      endpointId: 'can-view-ticket',
      payload: { ticket_id: { _fail: true } },
      '~k': 'websockets.0.check',
    }),
  });
  await expect(promise).rejects.toThrow(refusal);
  expect(logger.error).toHaveBeenCalledTimes(1);
  expect(logger.error.mock.calls[0][0].configKey).toBe('websockets.0.check');
});

test('checkWebsocketAccess refuses as a missing websocket when the caller lacks the endpoint role', async () => {
  const context = createTestContext({
    endpoint: {
      ...returning(true),
      auth: { public: false, roles: ['support'] },
    },
    user: { id: 'user-1', roles: ['client'] },
  });
  const promise = checkWebsocketAccess(context, {
    payload: {},
    websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
  });
  await expect(promise).rejects.toThrow(AuthorizationError);
  await expect(promise).rejects.toThrow(refusal);
  expect(logger.error).not.toHaveBeenCalled();
});

test('checkWebsocketAccess refuses an anonymous caller of a protected endpoint as a missing websocket', async () => {
  const context = createTestContext({
    endpoint: {
      ...returning(true),
      auth: { public: false },
    },
    user: null,
  });
  const promise = checkWebsocketAccess(context, {
    payload: {},
    websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
  });
  await expect(promise).rejects.toThrow(AuthorizationError);
  await expect(promise).rejects.toThrow(refusal);
});

test('checkWebsocketAccess sends the subscription payload when the check names no payload', async () => {
  const context = createTestContext({
    endpoint: returning({ _eq: [{ _payload: 'ticket_id' }, 't-1'] }),
  });
  const config = websocketConfig({ endpointId: 'can-view-ticket' });
  await expect(
    checkWebsocketAccess(context, { payload: { ticket_id: 't-1' }, websocketConfig: config })
  ).resolves.toBeUndefined();
  await expect(
    checkWebsocketAccess(context, { payload: { ticket_id: 't-2' }, websocketConfig: config })
  ).rejects.toThrow(refusal);
});

test('checkWebsocketAccess evaluates the check payload with the subscription payload, user and secrets', async () => {
  const context = createTestContext({
    endpoint: returning({
      _and: [
        { _eq: [{ _payload: 'ticket' }, 't-1'] },
        { _eq: [{ _payload: 'viewer' }, 'user-1'] },
        { _eq: [{ _payload: 'key' }, 'secret-value'] },
        { _eq: [{ _payload: 'room' }, null] },
      ],
    }),
    secrets: { CHECK_KEY: 'secret-value' },
  });
  await expect(
    checkWebsocketAccess(context, {
      payload: { ticket_id: 't-1', room: 4 },
      websocketConfig: websocketConfig({
        endpointId: 'can-view-ticket',
        payload: {
          ticket: { _payload: 'ticket_id' },
          viewer: { _user: 'id' },
          key: { _secret: 'CHECK_KEY' },
        },
      }),
    })
  ).resolves.toBeUndefined();
});

test('checkWebsocketAccess runs the endpoint as the subscriber', async () => {
  const context = createTestContext({
    endpoint: returning({ _eq: [{ _user: 'id' }, 'user-1'] }),
  });
  const config = websocketConfig({ endpointId: 'can-view-ticket' });
  await expect(
    checkWebsocketAccess(context, { payload: {}, websocketConfig: config })
  ).resolves.toBeUndefined();

  const otherContext = createTestContext({
    endpoint: returning({ _eq: [{ _user: 'id' }, 'user-1'] }),
    user: { id: 'user-2', roles: [] },
  });
  await expect(
    checkWebsocketAccess(otherContext, { payload: {}, websocketConfig: config })
  ).rejects.toThrow(refusal);
});

test('checkWebsocketAccess sends the subscription payload when the check payload is null', async () => {
  const context = createTestContext({
    endpoint: returning({ _eq: [{ _payload: 'ticket_id' }, 't-1'] }),
  });
  await expect(
    checkWebsocketAccess(context, {
      payload: { ticket_id: 't-1' },
      websocketConfig: websocketConfig({ endpointId: 'can-view-ticket', payload: null }),
    })
  ).resolves.toBeUndefined();
});

test('checkWebsocketAccess refuses a payload the endpoint schema rejects without an error log', async () => {
  const context = createTestContext({
    endpoint: {
      ...returning(true),
      payloadSchema: {
        type: 'object',
        properties: { ticket_id: { type: 'string' } },
        required: ['ticket_id'],
      },
    },
  });
  await expect(
    checkWebsocketAccess(context, {
      payload: { ticket_id: 42 },
      websocketConfig: websocketConfig({ endpointId: 'can-view-ticket' }),
    })
  ).rejects.toThrow(refusal);
  expect(logger.error).not.toHaveBeenCalled();
});
