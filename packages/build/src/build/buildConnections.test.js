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
  expect(() => buildConnections({ components, context })).toThrow('Connection id is not a string.');
});

test('buildConnections throws when connection id is a reserved name', () => {
  const components = {
    connections: [
      {
        id: 'constructor',
        type: 'ConnectionType',
      },
    ],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Connection id "constructor" is a reserved name and cannot be used as an id.'
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

test('buildConnections tenant shared on an implementing connection type passes', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: 'shared',
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
      tenant: 'shared',
      tenantCapability: true,
    },
  ]);
});

// The artifact stamp is what resolveTenant serves non-scoping types from at
// runtime - types.js is build-side only, and only MongoDBCollection mirrors
// its capability onto the runtime export.
test('buildConnections stamps the build-validated tenant capability onto the artifact', () => {
  const components = {
    connections: [
      { id: 'scoping', type: 'TestType' },
      { id: 'nonScoping', type: 'PlainType' },
      { id: 'undeclared', type: 'UnknownType' },
    ],
  };
  const res = buildConnections({
    components,
    context: tenantContext({
      connectionMetas: { TestType: { tenant: true }, PlainType: { tenant: false } },
    }),
  });
  expect(res.connections[0].tenantCapability).toBe(true);
  expect(res.connections[1].tenantCapability).toBe(false);
  // An absent declaration stays absent so the runtime keeps its fail-closed
  // error for undeclared types.
  expect(res.connections[2]).not.toHaveProperty('tenantCapability');
});

test('buildConnections throws when tenant is true', () => {
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
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant: true" was removed at connection "connection1" — under auth.organizations.policy: tenant a scoping-capable connection is scoped by default, so the declaration restates the default. Remove the key, or declare tenant: shared for data deliberately shared across organizations.'
  );
});

test('buildConnections throws when a request-level sentinel is declared on a connection', () => {
  ['none', 'authored'].forEach((sentinel) => {
    const components = {
      connections: [
        {
          id: 'connection1',
          type: 'TestType',
          tenant: sentinel,
        },
      ],
    };
    expect(() =>
      buildConnections({
        components,
        context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
      })
    ).toThrow(
      `Connection "tenant" does not accept "${sentinel}" at connection "connection1" — "none" and "authored" are declared on the request, step or websocket that needs the exception, not on the connection.`
    );
  });
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

test('buildConnections throws when tenant field is a dotted path', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: { field: 'meta.organizationId' },
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant" should name a non-empty top-level field (no dots) at connection "connection1" — the tenant wall stamps and matches it as a single document key.'
  );
});

test('buildConnections throws when tenant field is an empty string', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: { field: '' },
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant" should name a non-empty top-level field (no dots) at connection "connection1" — the tenant wall stamps and matches it as a single document key.'
  );
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
    'Connection "tenant" should be "shared" or a tenant field name at connection "connection1".'
  );
});

test('buildConnections normalises a bare-string tenant field to the { field } model', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: 'organizationId',
      },
    ],
  };
  const buildContext = tenantContext({ connectionMetas: { TestType: { tenant: true } } });
  buildContext.warnings = [];
  const res = buildConnections({ components, context: buildContext });
  expect(res.connections[0].tenant).toEqual({ field: 'organizationId' });
  expect(buildContext.warnings).toEqual([]);
});

test('buildConnections throws when a bare-string tenant field is a dotted path', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: 'meta.organizationId',
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: true } } }),
    })
  ).toThrow(
    'Connection "tenant" should name a non-empty top-level field (no dots) at connection "connection1" — the tenant wall stamps and matches it as a single document key.'
  );
});

test('buildConnections warns that the { field } tenant object form is deprecated', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: { field: 'organization_id' },
      },
    ],
  };
  const buildContext = tenantContext({ connectionMetas: { TestType: { tenant: true } } });
  buildContext.warnings = [];
  const res = buildConnections({ components, context: buildContext });
  expect(res.connections[0].tenant).toEqual({ field: 'organization_id' });
  expect(buildContext.warnings.length).toBe(1);
  expect(buildContext.warnings[0].checkSlug).toBe('tenant-grammar');
  expect(buildContext.warnings[0].message).toEqual(
    'Connection "tenant: { field: organization_id }" is deprecated at connection "connection1". Write the tenant field name as a bare string — tenant: organization_id — the grammar collections: already uses.'
  );
});

test('buildConnections populates tenantConnections from a bare-string tenant field', () => {
  const components = {
    auth: { organizations: { policy: 'tenant' } },
    connections: [
      {
        id: 'walled',
        type: 'TestType',
        tenant: 'tenant_id',
      },
    ],
  };
  const buildContext = tenantContext({ connectionMetas: { TestType: { tenant: true } } });
  buildConnections({ components, context: buildContext });
  expect([...buildContext.tenantConnections]).toEqual([
    ['walled', { type: 'TestType', field: 'tenant_id' }],
  ]);
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
    'Connection "tenant" should be "shared" or a tenant field name at connection "connection1".'
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
    'Connection "tenant" should be "shared" or a tenant field name at connection "connection1".'
  );
});

test('buildConnections throws when the connection type does not implement the tenant contract', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: 'shared',
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
        tenant: 'shared',
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
        tenant: { field: 'organization_id' },
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

test('buildConnections throws when tenant is declared on a non-scopable connection type', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: 'shared',
      },
    ],
  };
  expect(() =>
    buildConnections({
      components,
      context: tenantContext({ connectionMetas: { TestType: { tenant: false } } }),
    })
  ).toThrow(
    'Connection type "TestType" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "connection1". Use a connection type that enforces the tenant wall.'
  );
});

test('buildConnections throws under the tenant policy when the type declares no capability', () => {
  const components = {
    auth: { organizations: { policy: 'tenant' } },
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
      },
    ],
  };
  expect(() =>
    buildConnections({ components, context: tenantContext({ connectionMetas: {} }) })
  ).toThrow(
    'Connection type "TestType" declares no tenant capability at connection "connection1". Under auth.organizations.policy: tenant every connection type must declare connectionMetas tenant: true (implements the tenant scoping contract) or tenant: false (non-scopable), so no connection is ever silently unscoped.'
  );
});

test('buildConnections passes under the tenant policy when the type declares non-scopable', () => {
  const components = {
    auth: { organizations: { policy: 'tenant' } },
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
      },
    ],
  };
  const buildContext = tenantContext({ connectionMetas: { TestType: { tenant: false } } });
  buildConnections({ components, context: buildContext });
  expect([...buildContext.tenantConnections]).toEqual([]);
});

test('buildConnections passes under the pinned policy when the type declares no capability', () => {
  const components = {
    auth: { organizations: { policy: 'pinned' } },
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
      },
    ],
  };
  const res = buildConnections({ components, context: tenantContext({ connectionMetas: {} }) });
  expect(res.connections[0].connectionId).toBe('connection1');
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

test('buildConnections populates tenantConnections with each walled connection and its tenant field under the tenant policy', () => {
  const components = {
    auth: { organizations: { policy: 'tenant' } },
    connections: [
      {
        id: 'walled-by-default',
        type: 'TestType',
      },
      {
        id: 'walled-custom-field',
        type: 'TestType',
        tenant: { field: 'tenant_id' },
      },
      {
        id: 'shared',
        type: 'TestType',
        tenant: 'shared',
      },
      {
        id: 'non-scopable',
        type: 'PlainType',
      },
    ],
  };
  const buildContext = tenantContext({
    connectionMetas: { TestType: { tenant: true }, PlainType: { tenant: false } },
  });
  buildConnections({ components, context: buildContext });
  expect([...buildContext.tenantConnections]).toEqual([
    ['walled-by-default', { type: 'TestType', field: 'organization_id' }],
    ['walled-custom-field', { type: 'TestType', field: 'tenant_id' }],
  ]);
});

test('buildConnections indexes collections by tenant scope under the tenant policy', () => {
  const components = {
    auth: { organizations: { policy: 'tenant' } },
    connections: [
      { id: 'org_scope', type: 'TestType', properties: { collection: 'controls' } },
      {
        id: 'frameworks',
        type: 'TestType',
        tenant: 'shared',
        properties: { collection: 'catalogue' },
      },
      {
        id: 'frameworks_2',
        type: 'TestType',
        tenant: 'shared',
        properties: { collection: 'catalogue' },
      },
      { id: 'archive', type: 'TestType', properties: { collection: 'catalogue' } },
      // An operator-valued collection name is unknowable at build - left out.
      { id: 'dynamic', type: 'TestType', properties: { collection: { _secret: 'COLL' } } },
      { id: 'no_collection', type: 'TestType', properties: {} },
      { id: 'mail', type: 'PlainType', properties: { collection: 'ignored' } },
    ],
  };
  const buildContext = tenantContext({
    connectionMetas: { TestType: { tenant: true }, PlainType: { tenant: false } },
  });
  buildConnections({ components, context: buildContext });
  expect(buildContext.tenantCollectionMap).toEqual({
    controls: { shared: [], scoped: ['org_scope'] },
    catalogue: { shared: ['frameworks', 'frameworks_2'], scoped: ['archive'] },
  });
});

test('buildConnections leaves tenantCollectionMap empty under the pinned policy', () => {
  const components = {
    auth: { organizations: { policy: 'pinned' } },
    connections: [
      { id: 'walled', type: 'TestType', properties: { collection: 'records' } },
      { id: 'shared', type: 'TestType', tenant: 'shared', properties: { collection: 'countries' } },
    ],
  };
  const buildContext = tenantContext({ connectionMetas: { TestType: { tenant: true } } });
  buildConnections({ components, context: buildContext });
  expect(buildContext.tenantCollectionMap).toEqual({});
});

test('buildConnections leaves tenantConnections empty under the pinned policy', () => {
  const components = {
    auth: { organizations: { policy: 'pinned' } },
    connections: [
      {
        id: 'walled',
        type: 'TestType',
      },
    ],
  };
  const buildContext = tenantContext({ connectionMetas: { TestType: { tenant: true } } });
  buildConnections({ components, context: buildContext });
  expect([...buildContext.tenantConnections]).toEqual([]);
});

test('buildConnections leaves tenantConnections empty when auth declares no policy', () => {
  const components = {
    connections: [
      {
        id: 'walled',
        type: 'TestType',
      },
    ],
  };
  const buildContext = tenantContext({ connectionMetas: { TestType: { tenant: true } } });
  buildConnections({ components, context: buildContext });
  expect([...buildContext.tenantConnections]).toEqual([]);
});

test('buildConnections still validates the tenant contract under the pinned policy', () => {
  const components = {
    auth: { organizations: { policy: 'pinned' } },
    connections: [
      {
        id: 'connection1',
        type: 'TestType',
        tenant: 'shared',
      },
    ],
  };
  expect(() =>
    buildConnections({ components, context: tenantContext({ connectionMetas: {} }) })
  ).toThrow(
    'Connection type "TestType" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "connection1".'
  );
});
