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
    session: { user: { id: 'user_1' } },
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
    session: { user: { id: 'user_1' } },
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
    session: { user: { id: 'user_1' } },
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
