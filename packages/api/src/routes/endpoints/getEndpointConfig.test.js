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

import getEndpointConfig from './getEndpointConfig.js';
import testContext from '../../test/testContext.js';

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const endpointConfig = { endpointId: 'ep', type: 'Api', auth: { public: false } };

function createReadConfigFile({ authConfigured, endpoint = endpointConfig } = {}) {
  return jest.fn((path) => {
    if (path === 'api/ep.json') return endpoint;
    if (path === 'auth.json') return { configured: authConfigured };
    return null;
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('getEndpointConfig returns the endpoint config when it exists', async () => {
  const context = testContext({ logger, readConfigFile: createReadConfigFile() });
  expect(await getEndpointConfig(context, { endpointId: 'ep' })).toEqual(endpointConfig);
});

test('getEndpointConfig throws does-not-exist for a miss when auth is not configured', async () => {
  const context = testContext({
    logger,
    readConfigFile: createReadConfigFile({ authConfigured: false }),
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    new ConfigError('API Endpoint "missing" does not exist.')
  );
});

test('getEndpointConfig answers a miss with the authentication-required error for an anonymous caller on an auth-configured app', async () => {
  const context = testContext({
    logger,
    readConfigFile: createReadConfigFile({ authConfigured: true }),
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    new AuthenticationError('Authentication required for API endpoint "missing".')
  );
});

test('getEndpointConfig throws does-not-exist for a miss when the caller is authenticated', async () => {
  const context = testContext({
    logger,
    readConfigFile: createReadConfigFile({ authConfigured: true }),
    session: { user: { id: 'user_1' } },
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    new ConfigError('API Endpoint "missing" does not exist.')
  );
});

test('getEndpointConfig throws does-not-exist for a miss in a system context', async () => {
  const context = testContext({
    logger,
    readConfigFile: createReadConfigFile({ authConfigured: true }),
    system: true,
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    new ConfigError('API Endpoint "missing" does not exist.')
  );
});
