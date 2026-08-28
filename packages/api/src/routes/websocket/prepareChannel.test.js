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
import { AuthenticationError, ConfigError } from '@lowdefy/errors';

import prepareChannel from './prepareChannel.js';
import testContext from '../../test/testContext.js';

const { _payload, _user } = operatorsServer;

const mockReadConfigFile = jest.fn();
const mockResolver = jest.fn();

const connections = {
  TestConnection: {
    meta: { tenant: true },
  },
  NonScopableConnection: {
    meta: { tenant: false },
  },
  PlainConnection: {},
};

const operators = {
  _payload,
  _user,
};

// The wall only engages under the tenant policy, so the default test context
// carries it - pinned-policy tests pass their own binding.
function createTestContext({ organization = { policy: 'tenant' }, user } = {}) {
  const context = testContext({
    connections,
    readConfigFile: mockReadConfigFile,
    operators,
    organization,
    user,
  });
  context.websockets = {
    TestSource: mockResolver,
  };
  return context;
}

const defaultReadConfigImp =
  ({
    connectionConfig = {
      id: 'connection:testConnection',
      type: 'TestConnection',
      connectionId: 'testConnection',
      tenant: true,
      properties: {
        connectionProperty: 'connectionProperty',
      },
    },
    websocketConfig = {
      id: 'websocket:ws1',
      type: 'TestSource',
      websocketId: 'ws1',
      connectionId: 'testConnection',
      auth: { public: true },
      properties: {
        websocketProperty: 'websocketProperty',
      },
    },
  } = {}) =>
  (path) => {
    if (path === 'connections/testConnection.json') {
      return connectionConfig;
    }
    if (path === 'websockets/ws1.json') {
      return websocketConfig;
    }
    return null;
  };

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('websocket without a connectionId returns a null tenant and null connectionProperties', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      websocketConfig: {
        id: 'websocket:ws1',
        type: 'TestSource',
        websocketId: 'ws1',
        auth: { public: true },
        properties: {},
      },
    })
  );
  const context = createTestContext({ user: { id: 'id' } });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: {} });
  expect(res.tenant).toBe(null);
  expect(res.connectionProperties).toBe(null);
  expect(res.websocketResolver).toBe(mockResolver);
});

test('connection on a non-scopable type returns a null tenant', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'NonScopableConnection',
        connectionId: 'testConnection',
        properties: {},
      },
    })
  );
  const context = createTestContext({ user: { id: 'id' } });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: {} });
  expect(res.tenant).toBe(null);
});

test('connection declaring tenant shared returns a null tenant', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        tenant: 'shared',
        properties: {},
      },
    })
  );
  const context = createTestContext({ user: { id: 'id' } });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: {} });
  expect(res.tenant).toBe(null);
});

test('tenant connection resolves the tenant verdict from the caller organization', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  const context = createTestContext({ user: { id: 'id', organization_id: 'org-1' } });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: {} });
  expect(res.tenant).toEqual({ field: 'organization_id', value: 'org-1' });
  expect(res.connectionProperties).toEqual({ connectionProperty: 'connectionProperty' });
  expect(res.properties).toEqual({ websocketProperty: 'websocketProperty' });
});

test('tenant connection resolves a null tenant under the pinned policy', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  const context = createTestContext({
    organization: { policy: 'pinned' },
    user: { id: 'id', organization_id: 'org-1' },
  });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: {} });
  expect(res.tenant).toBe(null);
});

test('tenant connection with a field object resolves the custom field', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        tenant: { field: 'tenant_id' },
        properties: {},
      },
    })
  );
  const context = createTestContext({ user: { id: 'id', organization_id: 'org-1' } });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: {} });
  expect(res.tenant).toEqual({ field: 'tenant_id', value: 'org-1' });
});

test('websocket tenant none opts out and returns a null tenant', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      websocketConfig: {
        id: 'websocket:ws1',
        type: 'TestSource',
        websocketId: 'ws1',
        connectionId: 'testConnection',
        auth: { public: true },
        tenant: 'none',
        properties: {},
      },
    })
  );
  const context = createTestContext({ user: { id: 'id' } });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: {} });
  expect(res.tenant).toBe(null);
});

test('tenant connection without a caller organization throws AuthenticationError', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  const context = createTestContext({ user: { id: 'id' } });

  await expect(prepareChannel(context, { websocketId: 'ws1', payload: {} })).rejects.toThrow(
    AuthenticationError
  );
  await expect(prepareChannel(context, { websocketId: 'ws1', payload: {} })).rejects.toThrow(
    'Request "ws1" reads tenant connection "testConnection" but no caller organization resolved.'
  );
});

test('tenant declared on a connection type without the contract throws ConfigError', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'PlainConnection',
        connectionId: 'testConnection',
        tenant: { field: 'organization_id' },
        properties: {},
      },
    })
  );
  const context = createTestContext({ user: { id: 'id', organization_id: 'org-1' } });

  await expect(prepareChannel(context, { websocketId: 'ws1', payload: {} })).rejects.toThrow(
    ConfigError
  );
  await expect(prepareChannel(context, { websocketId: 'ws1', payload: {} })).rejects.toThrow(
    'Connection type "PlainConnection" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "testConnection".'
  );
});

test('properties are evaluated with the subscriber payload and user', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      websocketConfig: {
        id: 'websocket:ws1',
        type: 'TestSource',
        websocketId: 'ws1',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          room: { _payload: 'room' },
          user: { _user: 'id' },
        },
      },
    })
  );
  const context = createTestContext({ user: { id: 'id', organization_id: 'org-1' } });

  const res = await prepareChannel(context, { websocketId: 'ws1', payload: { room: 7 } });
  expect(res.properties).toEqual({ room: 7, user: 'id' });
});
