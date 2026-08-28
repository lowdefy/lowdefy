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
import {
  ConfigError,
  RequestError,
  ServiceError,
  UserError,
} from '@lowdefy/errors';

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
    session: { user: { id: 'user_1' } },
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

test('app capability is passed only when the resolver declares meta.appAccess', async () => {
  const context = createTestContext();

  const withoutMeta = jest.fn(() => 'ok');
  let received;
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver: withoutMeta,
  });
  expect(withoutMeta.mock.calls[0][0].app).toBeUndefined();

  const notOptedIn = jest.fn((args) => {
    received = args;
    return 'ok';
  });
  notOptedIn.meta = { checkRead: true };
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver: notOptedIn,
  });
  expect(received.app).toBeUndefined();

  const optedIn = jest.fn((args) => {
    received = args;
    return 'ok';
  });
  optedIn.meta = { appAccess: true };
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver: optedIn,
  });
  expect(received.app).toBeDefined();
  expect(received.app.getPageConfig).toBeInstanceOf(Function);
  expect(received.app.callRequest).toBeInstanceOf(Function);
  expect(received.app.readConfigFile).toBe(context.readConfigFile);
  expect(received.app.user).toEqual({ id: 'user_1' });
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
  const requestResolver = async ({ callApi }) =>
    callApi({ endpointId: 'missing', payload: {} });
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
  const requestResolver = async ({ callApi }) =>
    callApi({ endpointId: 'target', payload: {} });
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
  const requestResolver = async ({ callApi }) =>
    callApi({ endpointId: 'target', payload: {} });
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
  const requestResolver = async ({ callApi }) =>
    callApi({ endpointId: 'target', payload: {} });
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

test('debug events emitted on success: start and end', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':return': true },
      },
    },
  });
  const requestResolver = async ({ callApi }) =>
    callApi({ endpointId: 'target', payload: {} });
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  });
  const starts = context.logger.debug.mock.calls
    .map((c) => c[0])
    .filter((e) => e?.event === 'debug_start_call_api');
  const ends = context.logger.debug.mock.calls
    .map((c) => c[0])
    .filter((e) => e?.event === 'debug_end_call_api');
  expect(starts).toEqual([
    {
      event: 'debug_start_call_api',
      connectionId: 'conn1',
      requestId: 'req1',
      endpointId: 'target',
    },
  ]);
  expect(ends).toEqual([
    {
      event: 'debug_end_call_api',
      connectionId: 'conn1',
      requestId: 'req1',
      endpointId: 'target',
    },
  ]);
});

test('debug end event NOT emitted when callApi throws', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target: {
        endpointId: 'target',
        type: 'Api',
        routine: { ':throw': 'boom' },
      },
    },
  });
  const requestResolver = async ({ callApi }) =>
    callApi({ endpointId: 'target', payload: {} });
  await callRequestResolver(context, {
    connectionProperties: {},
    endpointDepth: 0,
    requestConfig,
    requestProperties: {},
    requestResolver,
  }).catch(() => {});
  const ends = context.logger.debug.mock.calls
    .map((c) => c[0])
    .filter((e) => e?.event === 'debug_end_call_api');
  expect(ends).toEqual([]);
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
