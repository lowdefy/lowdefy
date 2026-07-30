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
import { ConfigError } from '@lowdefy/errors';

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
