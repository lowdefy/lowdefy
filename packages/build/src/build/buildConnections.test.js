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

import buildConnections from './buildConnections.js';
import testContext from '../test-utils/testContext.js';

const context = testContext();

test('buildConnections no connections', () => {
  const components = {};
  const res = buildConnections({ components, context });
  expect(res.connections).toBe(undefined);
});

test('buildConnections', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'ConnectionType',
      },
      {
        id: 'connection2',
        type: 'ConnectionType',
      },
    ],
  };
  const res = buildConnections({ components, context });
  expect(res.connections).toEqual([
    {
      id: 'connection:connection1',
      connectionId: 'connection1',
      type: 'ConnectionType',
    },
    {
      id: 'connection:connection2',
      connectionId: 'connection2',
      type: 'ConnectionType',
    },
  ]);
});

test('buildConnections throws when connection is not an object', () => {
  const components = {
    connections: [null],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Connection should be an object.'
  );
});

test('buildConnections throws when connection id is missing', () => {
  const components = {
    connections: [
      {
        type: 'ConnectionType',
      },
    ],
  };
  expect(() => buildConnections({ components, context })).toThrow('Connection id missing.');
});

test('buildConnections throws when connection id is not a string', () => {
  const components = {
    connections: [
      {
        id: true,
        type: 'ConnectionType',
      },
    ],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Connection id is not a string.'
  );
});

test('buildConnections throws when connection type is not defined', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
      },
    ],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Connection type is not defined at connection "connection1".'
  );
});

test('buildConnections throws when connection type is not a string', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 123,
      },
    ],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Connection type is not a string at connection "connection1".'
  );
});

test('throw on Duplicate ids', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'ConnectionType',
      },
      {
        id: 'connection1',
        type: 'ConnectionType',
      },
    ],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Duplicate connectionId "connection1".'
  );
});

function tenantContext({ connectionMetas } = {}) {
  const tenantTestContext = testContext();
  tenantTestContext.typesMap = { connectionMetas };
  return tenantTestContext;
}

test('buildConnections tenant true on an implementing connection type passes', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: true,
      },
    ],
  };
  const res = buildConnections({
    components,
    context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
  });
  expect(res.connections).toEqual([
    {
      id: 'connection:connection1',
      connectionId: 'connection1',
      type: 'TestType',
      tenant: true,
    },
  ]);
});

test('buildConnections tenant with a field object on an implementing connection type passes', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: { field: 'organization_id' },
      },
    ],
  };
  const res = buildConnections({
    components,
    context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
  });
  expect(res.connections[0].tenant).toEqual({ field: 'organization_id' });
});

test('buildConnections throws when tenant is false', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: false,
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant" should be true or an object with a "field" string at connection "connection1".'
  );
});

test('buildConnections throws when tenant is a string', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: 'organizationId',
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant" should be true or an object with a "field" string at connection "connection1".'
  );
});

test('buildConnections throws when tenant object has no field', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: {},
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant" should be true or an object with a "field" string at connection "connection1".'
  );
});

test('buildConnections throws when tenant field is not a string', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: { field: 42 },
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant" should be true or an object with a "field" string at connection "connection1".'
  );
});

test('buildConnections throws when the connection type does not implement the tenant contract', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: true,
      },
    ],
  };
  expect(() =>
    buildConnections({ components, context: tenantContext({ connectionMetas: {} }) })
  ).toThrow(
    'Connection type "TestType" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "connection1". Use a connection type that enforces the tenant wall.'
  );
});

test('buildConnections throws when no connectionMetas store exists in the typesMap', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: true,
      },
    ],
  };
  expect(() => buildConnections({ components, context: tenantContext() })).toThrow(
    'Connection type "TestType" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "connection1". Use a connection type that enforces the tenant wall.'
  );
});

test('buildConnections throws when the connection type meta tenant is not exactly true', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: true,
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: 'yes' } } }),
    })
  ).toThrow(
    'Connection type "TestType" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "connection1". Use a connection type that enforces the tenant wall.'
  );
});

test('buildConnections without tenant does not require the typesMap', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
      },
    ],
  };
  const res = buildConnections({ components, context: testContext() });
  expect(res.connections[0].connectionId).toBe('connection1');
});

test('count operators', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'MongoDBCollection',
        properties: {
          collection: { _payload: 'collection' },
          databaseUri: {
            '_string.concat': ['db', 'uri'],
          },
        },
      },
      {
        id: 'connection2',
        type: 'MongoDBCollection',
        properties: {
          changeLog: {
            _payload: 'changelog',
          },
          collection: { '_number.toString': 10 },
          write: {
            _eq: [true, false],
          },
        },
      },
    ],
  };
  buildConnections({ components, context });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({
    _eq: 1,
    _number: 1,
    _payload: 2,
    _string: 1,
  });
});
