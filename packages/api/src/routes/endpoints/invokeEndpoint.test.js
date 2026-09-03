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
import { operatorsServer } from '@lowdefy/operators-js';
import { ConfigError, UserError } from '@lowdefy/errors';

import createAuthorizeOutcome from '../../context/createAuthorizeOutcome.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import invokeEndpoint from './invokeEndpoint.js';
import testContext from '../../test/testContext.js';

const operators = { ...operatorsServer };

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createMockReadConfigFile(endpointConfigs = {}) {
  return jest.fn((path) => {
    const match = path.match(/^api\/(.+)\.json$/);
    if (match && endpointConfigs[match[1]]) {
      const config = endpointConfigs[match[1]];
      if (!config.auth) config.auth = { public: true };
      return config;
    }
    return null;
  });
}

function createTestContext({ endpointConfigs = {}, user } = {}) {
  const context = testContext({
    operators,
    logger,
    readConfigFile: createMockReadConfigFile(endpointConfigs),
    user: user ?? { id: 'user_1' },
  });
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('returns the routine result envelope on return', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': { value: 42 } },
      },
    },
  });
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: {},
    endpointDepth: 0,
  });
  expect(result.status).toBe('return');
  expect(result.response).toEqual({ value: 42 });
});

test('passes payload through to target routine', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': { _payload: 'key' } },
      },
    },
  });
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: { key: 'hi' },
    endpointDepth: 0,
  });
  expect(result.response).toBe('hi');
});

test('defaults missing payload to {}', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': { _payload: true } },
      },
    },
  });
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    endpointDepth: 0,
  });
  expect(result.response).toEqual({});
});

test('throws ConfigError when endpoint is missing', async () => {
  const context = createTestContext({ endpointConfigs: {} });
  await expect(
    invokeEndpoint(context, { endpointId: 'missing', payload: {}, endpointDepth: 0 })
  ).rejects.toBeInstanceOf(ConfigError);
});

test('throws ConfigError when endpointDepth >= 10', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: { endpointId: 'target', type: 'Api', routine: { ':return': true } },
    },
  });
  await expect(
    invokeEndpoint(context, { endpointId: 'target', payload: {}, endpointDepth: 10 })
  ).rejects.toThrow('Endpoint call depth exceeded maximum of 10');
});

test('throws ConfigError on authorization failure', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': true },
        auth: { roles: ['admin'] },
      },
    },
    user: { id: 'user_1' },
  });
  await expect(
    invokeEndpoint(context, { endpointId: 'target', payload: {}, endpointDepth: 0 })
  ).rejects.toBeInstanceOf(ConfigError);
});

test('system context authorizes nested call to a protected endpoint', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': 'ran' },
        auth: { public: false, roles: ['admin'] },
      },
    },
  });
  context.user = undefined;
  context.authorizeOutcome = createAuthorizeOutcome({ user: null, system: true });
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: {},
    endpointDepth: 0,
  });
  expect(result.status).toBe('return');
  expect(result.response).toBe('ran');
});

test('user session with insufficient roles gets masked does-not-exist error on nested call', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': true },
        auth: { public: false, roles: ['admin'] },
      },
    },
    user: { id: 'user_1', roles: ['viewer'] },
  });
  await expect(
    invokeEndpoint(context, { endpointId: 'target', payload: {}, endpointDepth: 0 })
  ).rejects.toThrow('API Endpoint "target" does not exist.');
});

test('propagates :throw status envelope from runRoutine', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':throw': 'boom' },
      },
    },
  });
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: {},
    endpointDepth: 0,
  });
  expect(result.status).toBe('error');
  expect(result.error.message).toBe('boom');
});

test('propagates :reject status envelope from runRoutine', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':reject': 'no' },
      },
    },
  });
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: {},
    endpointDepth: 0,
  });
  expect(result.status).toBe('reject');
  expect(result.error.message).toBe('no');
});

test('child routine sees fresh state — caller state not visible', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: [{ ':set_state': { x: 1 } }, { ':return': { _state: 'x' } }],
      },
    },
  });
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: {},
    endpointDepth: 0,
  });
  expect(result.response).toBe(1);
});

test('invokeEndpoint rejects a payload that violates the target payloadSchema with a UserError', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        payloadSchema: {
          type: 'object',
          properties: { key: { type: 'string' } },
          required: ['key'],
        },
        routine: { ':return': { _payload: 'key' } },
      },
    },
  });
  await expect(
    invokeEndpoint(context, { endpointId: 'target', payload: { key: 1 }, endpointDepth: 0 })
  ).rejects.toThrow(UserError);
  // A missing payload is validated as {} - the same value the routine would receive.
  await expect(invokeEndpoint(context, { endpointId: 'target', endpointDepth: 0 })).rejects.toThrow(
    'Payload for endpoint "target" does not match its payloadSchema at (root): must have required property \'key\'.'
  );
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: { key: 'hi' },
    endpointDepth: 0,
  });
  expect(result.response).toBe('hi');
});

test('invokeEndpoint reports a child :return that misses the responseSchema as a dev notice', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'InternalApi',
        responseSchema: { type: 'object', properties: { value: { type: 'string' } } },
        routine: { ':return': { value: 42 } },
        '~k': 'k_target',
      },
    },
  });
  context.handleDevNotice = jest.fn();
  const result = await invokeEndpoint(context, {
    endpointId: 'target',
    payload: {},
    endpointDepth: 0,
  });
  expect(result).toEqual({ status: 'return', response: { value: 42 } });
  expect(context.handleDevNotice).toHaveBeenCalledTimes(1);
  expect(context.handleDevNotice.mock.calls[0][0]).toMatchObject({
    name: 'ResponseSchemaWarning',
    configKey: 'k_target',
    details: { endpointId: 'target', instancePath: '/value' },
  });
});
