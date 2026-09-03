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
import { ConfigError, RequestError, ServiceError, UserError } from '@lowdefy/errors';

import callRequestResolver from './callRequestResolver.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import testContext from '../../test/testContext.js';

const operators = { ...operatorsServer };

function createMockReadConfigFile(endpointConfigs = {}) {
  return jest.fn((path) => {
    const match = path.match(/^api\/(.+)\.json$/);
    if (match) {
      const key = match[1];
      if (endpointConfigs[key]) {
        const config = endpointConfigs[key];
        if (!config.auth) config.auth = { public: true };
        return config;
      }
    }
    return null;
  });
}

function createTestContext({ endpointConfigs = {} } = {}) {
  const context = testContext({
    operators,
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    readConfigFile: createMockReadConfigFile(endpointConfigs),
    user: { id: 'user_1' },
  });
  context.blockId = 'blockId';
  context.pageId = 'pageId';
  context.endpointId = 'caller_endpoint';
  context.payload = { caller: true };
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

const requestConfig = {
  '~k': 'request_key',
  requestId: 'req1',
  connectionId: 'conn1',
  type: 'TestRequest',
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('resolver argument bag includes callApi function', async () => {
  const context = createTestContext();
  let received;
  const requestResolver = jest.fn((args) => {
    received = args;
    return 'ok';
  });
  const result = await callRequestResolver(context, {
    connectionProperties: { c: 1 },
    endpointDepth: 0,
    requestConfig,
    requestProperties: { r: 1 },
    requestResolver,
  });
  expect(result).toBe('ok');
  expect(received.callApi).toBeInstanceOf(Function);
  expect(received.blockId).toBe('blockId');
  expect(received.endpointId).toBe('caller_endpoint');
  expect(received.pageId).toBe('pageId');
  expect(received.payload).toEqual({ caller: true });
  expect(received.connection).toEqual({ c: 1 });
  expect(received.connectionId).toBe('conn1');
  expect(received.request).toEqual({ r: 1 });
  expect(received.requestId).toBe('req1');
});

test('callApi runs the target endpoint routine and returns the response', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': { value: 'from_target' } },
      },
    },
  });
  let result;
  const requestResolver = async ({ callApi }) => {
    result = await callApi({ endpointId: 'target', payload: {} });
    return result;
  };
  const ret = await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  expect(ret).toEqual({ value: 'from_target' });
  expect(result).toEqual({ value: 'from_target' });
});

test('callApi works with module endpoint id (slash in id)', async () => {
  const context = createTestContext({
    endpointConfigs: {
      'moduleA/inner': {
        endpointId: 'moduleA/inner',
        type: 'Api',
        routine: { ':return': 'module_inner' },
      },
    },
  });
  const requestResolver = async ({ callApi }) =>
    callApi({ endpointId: 'moduleA/inner', payload: {} });
  const ret = await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  expect(ret).toBe('module_inner');
});

test('callApi throws ConfigError when endpoint is missing', async () => {
  const context = createTestContext();
  const requestResolver = async ({ callApi }) => callApi({ endpointId: 'missing', payload: {} });
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toBeInstanceOf(ConfigError);
});

test('callApi throws UserError on :throw in target routine', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':throw': 'boom' },
      },
    },
  });
  const requestResolver = async ({ callApi }) => callApi({ endpointId: 'target', payload: {} });
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toBeInstanceOf(UserError);
});

test('callApi throws UserError on :reject in target routine', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':reject': 'no' },
      },
    },
  });
  const requestResolver = async ({ callApi }) => callApi({ endpointId: 'target', payload: {} });
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toBeInstanceOf(UserError);
});

test('depth cap throws ConfigError at depth >= 10', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': true },
      },
    },
  });
  const requestResolver = async ({ callApi }) => callApi({ endpointId: 'target', payload: {} });
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 10,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toThrow('Endpoint call depth exceeded maximum of 10');
});

test('callApi target routine without :return resolves to null', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: [],
      },
    },
  });
  const requestResolver = async ({ callApi }) => {
    const v = await callApi({ endpointId: 'target', payload: {} });
    return { wrapped: v };
  };
  const ret = await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  expect(ret).toEqual({ wrapped: null });
});

test('request_completed is emitted once on success with config_key and duration', async () => {
  const context = createTestContext();
  const requestResolver = async () => 'ok';
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  const events = context.logger.debug.mock.calls.map((call) => call[0]);
  expect(events).toEqual([
    {
      event: 'request_completed',
      rid: undefined,
      page_id: 'pageId',
      block_id: 'blockId',
      request_id: 'req1',
      connection_id: 'conn1',
      request_type: 'TestRequest',
      endpoint_id: 'caller_endpoint',
      config_key: 'request_key',
      duration_ms: expect.any(Number),
      success: true,
    },
  ]);
});

test('request_completed carries no identity fields by default', async () => {
  const context = createTestContext();
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver: async () => 'ok',
    tenant: { field: 'org', value: 'org_1' },
  });
  const [line] = context.logger.debug.mock.calls[0];
  expect(line.user).toBeUndefined();
  expect(line.org).toBeUndefined();
});

test('request_completed carries user.id and org when identity is enabled', async () => {
  const context = createTestContext();
  context.logger.eventsConfig = { level: 'errors', identity: true };
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver: async () => 'ok',
    tenant: { field: 'org', value: 'org_1' },
  });
  const [line] = context.logger.debug.mock.calls[0];
  expect(line.user).toEqual({ id: 'user_1' });
  expect(line.org).toEqual('org_1');
});

test('request_completed is emitted at info when logger.events is all', async () => {
  const context = createTestContext();
  context.logger.eventsConfig = 'all';
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver: async () => 'ok',
  });
  expect(context.logger.debug).not.toHaveBeenCalled();
  expect(context.logger.info.mock.calls[0][0]).toMatchObject({
    event: 'request_completed',
    success: true,
  });
});

test('request_failed is emitted at info with the error name, message and config_key', async () => {
  const context = createTestContext();
  const requestResolver = async () => {
    throw new Error('resolver blew up');
  };
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toThrow('resolver blew up');
  const [line, message] = context.logger.info.mock.calls[0];
  expect(line).toMatchObject({
    event: 'request_failed',
    request_id: 'req1',
    config_key: 'request_key',
    success: false,
    duration_ms: expect.any(Number),
    error: { name: 'RequestError', message: expect.stringContaining('resolver blew up') },
  });
  // The err serializer keeps the stack on the line.
  expect(line.err).toBeInstanceOf(Error);
  expect(message).toEqual(line.error.message);
});

test('callApi emits no debug start and end pair', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': true },
      },
    },
  });
  const requestResolver = async ({ callApi }) => callApi({ endpointId: 'target', payload: {} });
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  const events = context.logger.debug.mock.calls.map((call) => call[0]?.event);
  expect(events).not.toContain('debug_start_call_api');
  expect(events).not.toContain('debug_end_call_api');
  expect(events).toContain('endpoint_completed');
  expect(events).toContain('request_completed');
});

test('Lowdefy error from resolver passes through unchanged', async () => {
  const context = createTestContext();
  const innerError = new RequestError('inner failure', {
    typeName: 'X',
    received: {},
    location: 'a/b',
  });
  const requestResolver = async () => {
    throw innerError;
  };
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toBe(innerError);
});

test('UserError from resolver passes through unchanged', async () => {
  const context = createTestContext();
  const innerError = new UserError('user-failure');
  const requestResolver = async () => {
    throw innerError;
  };
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toBe(innerError);
});

test('ConfigError from resolver passes through unchanged', async () => {
  const context = createTestContext();
  const innerError = new ConfigError('config-failure');
  const requestResolver = async () => {
    throw innerError;
  };
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toBe(innerError);
});

test('Pre-existing ServiceError from resolver is NOT re-wrapped', async () => {
  const context = createTestContext();
  const innerError = new ServiceError('service-failure', {
    service: 'X',
  });
  const requestResolver = async () => {
    throw innerError;
  };
  await expect(
    callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    })
  ).rejects.toBe(innerError);
});

test('raw Error is wrapped into RequestError', async () => {
  const context = createTestContext();
  const requestResolver = async () => {
    throw new Error('raw');
  };
  let caught;
  try {
    await callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    });
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(RequestError);
  expect(caught.cause.message).toBe('raw');
});

test('raw service-shaped error is wrapped into ServiceError', async () => {
  const context = createTestContext();
  const rawServiceErr = Object.assign(new Error('timeout'), {
    code: 'ETIMEDOUT',
  });
  const requestResolver = async () => {
    throw rawServiceErr;
  };
  let caught;
  try {
    await callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    });
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(ServiceError);
  expect(caught.cause).toBe(rawServiceErr);
});

test('configKey attached when missing', async () => {
  const context = createTestContext();
  const requestResolver = async () => {
    throw new Error('raw');
  };
  let caught;
  try {
    await callRequestResolver(context, {
      connectionProperties: {},
      endpointDepth: 0,
      requestConfig,
      requestProperties: {},
      requestResolver,
    });
  } catch (e) {
    caught = e;
  }
  expect(caught.configKey).toBe('request_key');
});

test('resolver argument bag carries collectionSchema and defaults it to null', async () => {
  const context = createTestContext();
  const requestResolver = jest.fn(() => 'ok');
  const collectionSchema = { name: 'answers', fields: { test_id: { type: 'string' } } };
  await callRequestResolver(context, {
    collectionSchema,
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  expect(requestResolver.mock.calls[0][0].collectionSchema).toBe(collectionSchema);
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  expect(requestResolver.mock.calls[1][0].collectionSchema).toBe(null);
});
