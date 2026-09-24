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

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const endpointConfig = {
  endpointId: 'ep_1',
  type: 'Api',
  routine: { ':return': 'ok' },
};

const readConfigFile = jest.fn((path) => (path === 'api/ep_1.json' ? endpointConfig : null));

beforeEach(() => {
  jest.clearAllMocks();
});

test("getEndpointConfig returns the config for an existing endpoint when unauthenticated on an auth'd app", async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: null,
  });
  const config = await getEndpointConfig(context, { endpointId: 'ep_1' });
  expect(config).toBe(endpointConfig);
});

test('getEndpointConfig returns the config for an existing endpoint when authenticated', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: { id: 'user_1' },
  });
  const config = await getEndpointConfig(context, { endpointId: 'ep_1' });
  expect(config).toBe(endpointConfig);
});

test("getEndpointConfig throws AuthenticationError on a miss for an anonymous human on an auth'd app", async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: null,
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    AuthenticationError
  );
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    'Authentication required for API endpoint "missing".'
  );
});

test('getEndpointConfig throws ConfigError on a miss when a user is resolved', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    user: { id: 'user_1' },
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(ConfigError);
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    'API Endpoint "missing" does not exist.'
  );
});

test('getEndpointConfig throws ConfigError on a miss for a no-auth app', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: null,
    user: null,
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(ConfigError);
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    'API Endpoint "missing" does not exist.'
  );
});

test('getEndpointConfig throws ConfigError on a miss for a system context', async () => {
  const context = testContext({
    logger,
    readConfigFile,
    authEnforcement: { public: false },
    system: true,
    user: null,
  });
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(ConfigError);
  await expect(getEndpointConfig(context, { endpointId: 'missing' })).rejects.toThrow(
    'API Endpoint "missing" does not exist.'
  );
});
