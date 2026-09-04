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
import { AuthenticationError, ConfigError, UserError } from '@lowdefy/errors';

import callEndpoint from './callEndpoint.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('InternalApi endpoint throws ConfigError with "does not exist" message', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/internal_ep.json') {
      return {
        endpointId: 'internal_ep',
        type: 'InternalApi',
        auth: { public: true },
        routine: { ':return': 'secret' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1' },
  });
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'internal_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow(ConfigError);
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'internal_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow('API Endpoint "internal_ep" does not exist.');
});

test('Api endpoint proceeds normally', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/public_ep.json') {
      return {
        endpointId: 'public_ep',
        type: 'Api',
        auth: { public: true },
        routine: { ':return': 'public_data' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1' },
  });
  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'public_ep',
    pageId: 'pageId',
    payload: {},
  });
  expect(result.success).toBe(true);
  expect(result.status).toBe('success');
});

test('unauthenticated call to a protected endpoint throws an authentication-required error', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/protected_ep.json') {
      return {
        endpointId: 'protected_ep',
        type: 'Api',
        auth: { public: false },
        routine: { ':return': 'secret' },
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile });
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'protected_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow('Authentication required for API endpoint "protected_ep".');
});

test('authenticated call with the wrong role throws a masked does-not-exist error', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/protected_ep.json') {
      return {
        endpointId: 'protected_ep',
        type: 'Api',
        auth: { public: false, roles: ['admin'] },
        routine: { ':return': 'secret' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1', roles: ['viewer'] },
  });
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'protected_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow('API Endpoint "protected_ep" does not exist.');
});

test('callEndpoint strips stack and the internal control config cause from the error it returns', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/failing_ep.json') {
      return {
        endpointId: 'failing_ep',
        type: 'Api',
        auth: { public: true },
        // An unrecognised control makes handleControl throw with the control
        // config as a non-Error cause - server-only config the client must not
        // receive. This endpoint result body reaches a browser at HTTP 200.
        routine: { ':unknown': { internalDetail: 'server-only-config' } },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1' },
  });

  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'failing_ep',
    pageId: 'pageId',
    payload: {},
  });

  expect(result.status).toBe('error');
  expect(result.success).toBe(false);
  expect(result.error['~e'].message).toBe('Unexpected control.');
  expect(result.error['~e'].stack).toBeUndefined();
  expect(result.error['~e'].received).toBeUndefined();
  expect(result.error['~e'].cause).toBeUndefined();
  expect(JSON.stringify(result)).not.toContain('server-only-config');
});

test('callEndpoint keeps an author-written UserError cause and metaData from a :throw control', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/throwing_ep.json') {
      return {
        endpointId: 'throwing_ep',
        type: 'Api',
        auth: { public: true },
        routine: { ':throw': 'Order rejected.', ':cause': { reason: 'out of stock' } },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1' },
  });

  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'throwing_ep',
    pageId: 'pageId',
    payload: {},
  });

  expect(result.status).toBe('error');
  expect(result.error['~e'].name).toBe('UserError');
  expect(result.error['~e'].message).toBe('Order rejected.');
  // UserError is the one class whose non-Error cause the author wrote for the
  // client, so it survives while its stack still does not.
  expect(result.error['~e'].cause).toEqual({ reason: 'out of stock' });
  expect(result.error['~e'].stack).toBeUndefined();
});

test('InternalApi error matches missing endpoint error message', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/internal_ep.json') {
      return {
        endpointId: 'internal_ep',
        type: 'InternalApi',
        auth: { public: true },
        routine: [],
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1' },
  });

  // InternalApi should throw the exact same message as a missing endpoint
  const expectedMessage = 'API Endpoint "internal_ep" does not exist.';
  expect.assertions(2);
  try {
    await callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'internal_ep',
      pageId: 'pageId',
      payload: {},
    });
  } catch (err) {
    expect(err.message).toBe(expectedMessage);
    expect(err).toBeInstanceOf(ConfigError);
  }
});

test("InternalApi endpoint throws AuthenticationError for an anonymous human on an auth'd app", async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/internal_ep.json') {
      return {
        endpointId: 'internal_ep',
        type: 'InternalApi',
        auth: { public: true },
        routine: { ':return': 'secret' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    authEnforcement: { public: false },
    user: null,
  });
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'internal_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow(AuthenticationError);
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'internal_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow('Authentication required for API endpoint "internal_ep".');
});

test("InternalApi endpoint throws ConfigError for a resolved user on an auth'd app", async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/internal_ep.json') {
      return {
        endpointId: 'internal_ep',
        type: 'InternalApi',
        auth: { public: true },
        routine: { ':return': 'secret' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    authEnforcement: { public: false },
    user: { id: 'user_1' },
  });
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'internal_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow(ConfigError);
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'internal_ep',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow('API Endpoint "internal_ep" does not exist.');
});

// An InternalApi endpoint must be indistinguishable from a nonexistent one on
// both the unauthenticated and authenticated paths - otherwise the fork itself
// becomes the oracle.
test('InternalApi endpoint error is identical to a missing endpoint error for an anonymous human', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/internal_ep.json') {
      return {
        endpointId: 'internal_ep',
        type: 'InternalApi',
        auth: { public: true },
        routine: { ':return': 'secret' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    authEnforcement: { public: false },
    user: null,
  });

  const internalErr = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'internal_ep',
    pageId: 'pageId',
    payload: {},
  }).catch((err) => err);
  const missingErr = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'internal_ep_missing',
    pageId: 'pageId',
    payload: {},
  }).catch((err) => err);

  expect(internalErr).toBeInstanceOf(AuthenticationError);
  expect(missingErr).toBeInstanceOf(AuthenticationError);
  expect(internalErr.message).toBe('Authentication required for API endpoint "internal_ep".');
  expect(missingErr.message).toBe(
    'Authentication required for API endpoint "internal_ep_missing".'
  );
});

test('callEndpoint rejects a payload that violates the payloadSchema with a UserError before the routine runs', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/create_order.json') {
      return {
        endpointId: 'create_order',
        type: 'Api',
        auth: { public: true },
        payloadSchema: {
          type: 'object',
          properties: { quantity: { type: 'number' } },
          required: ['quantity'],
        },
        routine: { ':return': 'ran' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1' },
  });
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'create_order',
      pageId: 'pageId',
      payload: { quantity: 'two' },
    })
  ).rejects.toThrow(
    'Payload for endpoint "create_order" does not match its payloadSchema at /quantity: must be number.'
  );
  await expect(
    callEndpoint(context, {
      blockId: 'blockId',
      endpointId: 'create_order',
      pageId: 'pageId',
      payload: {},
    })
  ).rejects.toThrow(UserError);

  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'create_order',
    pageId: 'pageId',
    payload: { quantity: 2 },
  });
  expect(result.success).toBe(true);
  expect(result.response).toBe('ran');
});

test('callEndpoint validates an omitted payload as an empty object', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/ping.json') {
      return {
        endpointId: 'ping',
        type: 'Api',
        auth: { public: true },
        payloadSchema: { type: 'object' },
        routine: { ':return': 'ran' },
      };
    }
    return null;
  });
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1' },
  });
  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'ping',
    pageId: 'pageId',
  });
  expect(result.success).toBe(true);
  expect(result.response).toBe('ran');
});

// runAs: the endpoint's declaration is resolved against the fresh routine
// context and scopes every walled step of the run.
const tenantRequest = jest.fn(({ tenant }) => tenant);
tenantRequest.schema = {};
tenantRequest.meta = { checkRead: false, checkWrite: false };

const walledConnections = {
  TestTenantConnection: {
    schema: {},
    meta: { tenant: true },
    requests: { TenantRequest: tenantRequest },
  },
};

function createRunAsReadConfigFile({ runAs }) {
  return jest.fn((path) => {
    if (path === 'connections/app_data.json') {
      return {
        id: 'connection:app_data',
        type: 'TestTenantConnection',
        connectionId: 'app_data',
      };
    }
    if (path === 'api/jobs.json') {
      return {
        endpointId: 'jobs',
        type: 'Api',
        auth: { public: true },
        runAs,
        routine: [
          {
            id: 'request:jobs:rows',
            stepId: 'rows',
            type: 'TenantRequest',
            connectionId: 'app_data',
          },
          { ':return': { _step: 'rows' } },
        ],
      };
    }
    return null;
  });
}

test('endpoint-level runAs scopes a walled step for a caller with no organization', async () => {
  const { operatorsServer } = await import('@lowdefy/operators-js');
  const context = testContext({
    connections: walledConnections,
    logger,
    operators: operatorsServer,
    organization: { policy: 'tenant' },
    readConfigFile: createRunAsReadConfigFile({
      runAs: { organizationId: { _secret: 'SYSTEM_ORG' } },
    }),
    secrets: { SYSTEM_ORG: 'org-system' },
    user: { id: 'user_1', roles: [] },
  });
  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'jobs',
    pageId: 'pageId',
    payload: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ field: 'organization_id', value: 'org-system' });
  expect(context.user).toEqual({ id: 'user_1', roles: [] });
});

test('a walled step fails closed for a caller with no organization when the endpoint declares no runAs', async () => {
  const { operatorsServer } = await import('@lowdefy/operators-js');
  const context = testContext({
    connections: walledConnections,
    logger,
    operators: operatorsServer,
    organization: { policy: 'tenant' },
    readConfigFile: createRunAsReadConfigFile({ runAs: undefined }),
    user: { id: 'user_1', roles: [] },
  });
  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'jobs',
    pageId: 'pageId',
    payload: {},
  });
  expect(result.success).toBe(false);
  expect(result.status).toBe('error');
  expect(logger.error).toHaveBeenCalled();
});

test('callEndpoint reports a :return that misses the responseSchema as a dev notice and still returns it', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/typed_ep.json') {
      return {
        endpointId: 'typed_ep',
        type: 'Api',
        auth: { public: true },
        responseSchema: { type: 'object', properties: { total: { type: 'integer' } } },
        routine: { ':return': { total: 'three' } },
        '~k': 'k_typed',
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile, user: { id: 'u' } });
  context.handleDevNotice = jest.fn();
  const result = await callEndpoint(context, {
    blockId: 'b',
    endpointId: 'typed_ep',
    pageId: 'p',
    payload: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ total: 'three' });
  expect(context.handleDevNotice).toHaveBeenCalledTimes(1);
  expect(context.handleDevNotice.mock.calls[0][0]).toMatchObject({
    name: 'ResponseSchemaWarning',
    configKey: 'k_typed',
    details: { endpointId: 'typed_ep', instancePath: '/total' },
  });
});

test('callEndpoint records no notice for a conforming :return or without the dev hook', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/typed_ep.json') {
      return {
        endpointId: 'typed_ep',
        type: 'Api',
        auth: { public: true },
        responseSchema: { type: 'object', properties: { total: { type: 'integer' } } },
        routine: { ':return': { total: 3 } },
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile, user: { id: 'u' } });
  context.handleDevNotice = jest.fn();
  await callEndpoint(context, { blockId: 'b', endpointId: 'typed_ep', pageId: 'p', payload: {} });
  expect(context.handleDevNotice).not.toHaveBeenCalled();

  const prodContext = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'u' },
  });
  const result = await callEndpoint(prodContext, {
    blockId: 'b',
    endpointId: 'typed_ep',
    pageId: 'p',
    payload: {},
  });
  expect(result.success).toBe(true);
});

test('endpoint_completed is emitted once with the api entry, config_key and duration', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/ep.json') {
      return {
        '~k': 'endpoint_key',
        endpointId: 'ep',
        type: 'Api',
        auth: { public: true },
        routine: { ':return': 'done' },
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile });
  await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'ep',
    pageId: 'pageId',
    payload: {},
  });
  const events = logger.debug.mock.calls
    .map((call) => call[0])
    .filter((line) => line?.event === 'endpoint_completed');
  expect(events).toEqual([
    {
      event: 'endpoint_completed',
      rid: undefined,
      page_id: 'pageId',
      block_id: 'blockId',
      endpoint_id: 'ep',
      entry: 'api',
      config_key: 'endpoint_key',
      duration_ms: expect.any(Number),
      status: 'return',
      success: true,
    },
  ]);
});

test('endpoint_failed is emitted at info when the routine errors', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/ep.json') {
      return {
        '~k': 'endpoint_key',
        endpointId: 'ep',
        type: 'Api',
        auth: { public: true },
        routine: { ':throw': 'nope' },
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile });
  await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'ep',
    pageId: 'pageId',
    payload: {},
  });
  const events = logger.info.mock.calls
    .map((call) => call[0])
    .filter((line) => line?.event === 'endpoint_failed');
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    endpoint_id: 'ep',
    entry: 'api',
    config_key: 'endpoint_key',
    success: false,
    error: { name: 'UserError', message: 'nope' },
  });
});
