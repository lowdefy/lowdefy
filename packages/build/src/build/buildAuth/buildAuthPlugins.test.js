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

import buildAuthPlugins from './buildAuthPlugins.js';
import testContext from '../../test-utils/testContext.js';

test('buildAuthPlugins counts the database adapter type', () => {
  const context = testContext();
  const components = {
    auth: {
      database: {
        id: 'auth_db',
        type: 'MongoDBAuthAdapter',
        properties: {},
      },
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.adapters.getCounts()).toEqual({ MongoDBAuthAdapter: 1 });
});

test('buildAuthPlugins does not count adapters when database is absent', () => {
  const context = testContext();
  const components = {
    auth: {},
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.adapters.getCounts()).toEqual({});
});

test('buildAuthPlugins counts each provider type', () => {
  const context = testContext();
  const components = {
    auth: {
      providers: [
        { id: 'google', type: 'Google', properties: {} },
        { id: 'okta', type: 'GenericOAuth', properties: {} },
      ],
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.providers.getCounts()).toEqual({
    Google: 1,
    GenericOAuth: 1,
  });
});

test('buildAuthPlugins counts repeated provider types once per occurrence', () => {
  const context = testContext();
  const components = {
    auth: {
      providers: [
        { id: 'okta', type: 'GenericOAuth', properties: {} },
        { id: 'auth0', type: 'GenericOAuth', properties: {} },
      ],
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.providers.getCounts()).toEqual({ GenericOAuth: 2 });
});

test('buildAuthPlugins does not count providers when the list is absent', () => {
  const context = testContext();
  const components = {
    auth: {},
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.providers.getCounts()).toEqual({});
});

test('buildAuthPlugins counts each strategy type with its config location', () => {
  const context = testContext();
  const components = {
    auth: {
      strategies: [
        { id: 'partner-access', type: 'apiKey', properties: {}, '~k': 'k-api-key' },
        { id: 'service-jwt', type: 'jwt', properties: {}, '~k': 'k-jwt' },
      ],
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.strategies.getCounts()).toEqual({
    apiKey: 1,
    jwt: 1,
  });
  expect(context.typeCounters.auth.strategies.getLocation('apiKey')).toBe('k-api-key');
  expect(context.typeCounters.auth.strategies.getLocation('jwt')).toBe('k-jwt');
});

test('buildAuthPlugins does not count strategies when the list is absent', () => {
  const context = testContext();
  const components = {
    auth: {},
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.strategies.getCounts()).toEqual({});
});

test('buildAuthPlugins counts both database and provider types together', () => {
  const context = testContext();
  const components = {
    auth: {
      database: {
        id: 'auth_db',
        type: 'MongoDBAuthAdapter',
        properties: {},
      },
      providers: [{ id: 'google', type: 'Google', properties: {} }],
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.adapters.getCounts()).toEqual({ MongoDBAuthAdapter: 1 });
  expect(context.typeCounters.auth.providers.getCounts()).toEqual({ Google: 1 });
});
