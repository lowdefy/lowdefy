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
import { AuthenticationError, ConfigError } from '@lowdefy/errors';

import getRequestConfig from './getRequestConfig.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const requestConfig = {
  requestId: 'req_1',
  type: 'TestRequest',
  connectionId: 'con_1',
};

const readConfigFile = jest.fn((path) =>
  path === 'pages/page_1/requests/req_1.json' ? requestConfig : null
);

beforeEach(() => {
  jest.clearAllMocks();
});

test('getRequestConfig returns the config for an existing request when unauthenticated on an auth\'d app', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: null,
  });
  const config = await getRequestConfig(context, { pageId: 'page_1', requestId: 'req_1' });
  expect(config).toBe(requestConfig);
});

test('getRequestConfig returns the config for an existing request when authenticated', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: { id: 'user_1' },
  });
  const config = await getRequestConfig(context, { pageId: 'page_1', requestId: 'req_1' });
  expect(config).toBe(requestConfig);
});

test('getRequestConfig throws AuthenticationError on a miss for an anonymous human on an auth\'d app', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: null,
  });
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow(AuthenticationError);
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow('Authentication required for request "missing".');
});

test('getRequestConfig throws ConfigError on a miss when a user is resolved', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: { id: 'user_1' },
  });
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow(ConfigError);
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow('Request "missing" does not exist.');
});

test('getRequestConfig throws ConfigError on a miss for a no-auth app', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: null,
    user: null,
  });
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow(ConfigError);
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow('Request "missing" does not exist.');
});

test('getRequestConfig throws ConfigError on a miss for a system context', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    system: true,
    user: null,
  });
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow(ConfigError);
  await expect(
    getRequestConfig(context, { pageId: 'page_1', requestId: 'missing' })
  ).rejects.toThrow('Request "missing" does not exist.');
});
