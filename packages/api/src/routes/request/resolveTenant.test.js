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

import { AuthenticationError, ConfigError } from '@lowdefy/errors';

import resolveTenant from './resolveTenant.js';

// Connection type capability: true implements the scoping contract, false is
// non-scopable, absent means the type declares neither (a build error under
// the tenant policy, repeated here at runtime).
const tenantConnection = {
  meta: { tenant: true },
};

const nonScopableConnection = {
  meta: { tenant: false },
};

const plainConnection = {};

// Under the inverted default a scoped connection declares nothing.
const defaultConnectionConfig = {
  id: 'connection:testConnection',
  type: 'TestConnection',
  connectionId: 'testConnection',
  '~k': 'connection.0',
};

const defaultRequestConfig = {
  id: 'request:pageId:requestId',
  type: 'TestRequest',
  requestId: 'requestId',
  connectionId: 'testConnection',
};

// The wall is policy-conditional - the verdict and fail-closed paths only
// resolve under the tenant policy, so verdict-side tests carry it.
const tenantPolicy = { organization: { policy: 'tenant' } };

const contextWithOrg = {
  ...tenantPolicy,
  user: { id: 'id', organization_id: 'org-1' },
};

test('a scoping-capable connection with no tenant key is scoped by default', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: defaultConnectionConfig,
    requestConfig: defaultRequestConfig,
  });
  expect(res).toEqual({ field: 'organization_id', value: 'org-1' });
});

test('tenant shared returns null under the tenant policy', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: { ...defaultConnectionConfig, tenant: 'shared' },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toBe(null);
});

test('tenant shared does not require a caller organization', () => {
  const res = resolveTenant(
    { ...tenantPolicy, user: null },
    {
      connection: tenantConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: 'shared' },
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
});

test('tenant shared is inert under the pinned policy', () => {
  const res = resolveTenant(
    { organization: { policy: 'pinned' }, user: { id: 'id', organization_id: 'org-1' } },
    {
      connection: tenantConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: 'shared' },
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
});

test('a non-scopable connection type is never scoped', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: nonScopableConnection,
    connectionConfig: defaultConnectionConfig,
    requestConfig: defaultRequestConfig,
  });
  expect(res).toBe(null);
});

test('a non-scopable connection type does not require a caller organization', () => {
  const res = resolveTenant(
    { ...tenantPolicy, user: null },
    {
      connection: nonScopableConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
});

test('throws ConfigError under the tenant policy when the type declares no capability', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: plainConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    })
  ).toThrow(ConfigError);
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: plainConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    })
  ).toThrow(
    'Connection type "TestConnection" declares no tenant capability, so connection "testConnection" can not be served under auth.organizations.policy: tenant.'
  );
});

test('throws ConfigError under the tenant policy when meta tenant is not exactly true or false', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: { meta: { tenant: 'yes' } },
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    })
  ).toThrow(ConfigError);
});

// The build stamps the types.js capability onto the connection artifact
// (buildConnections tenantCapability), so a runtime export carrying no meta
// serves from the build-validated declaration - the SMTP/SendGrid/Axios/AI
// case that used to throw on every request under the tenant policy.
test('a build-stamped non-scopable capability serves a runtime export with no meta', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: plainConnection,
    connectionConfig: { ...defaultConnectionConfig, tenantCapability: false },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toBe(null);
});

test('a build-stamped non-scopable capability does not require a caller organization', () => {
  const res = resolveTenant(
    { ...tenantPolicy, user: null },
    {
      connection: plainConnection,
      connectionConfig: { ...defaultConnectionConfig, tenantCapability: false },
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
});

test('a build-stamped scoping capability without runtime enforcement refuses as drift', () => {
  const call = () =>
    resolveTenant(contextWithOrg, {
      connection: plainConnection,
      connectionConfig: { ...defaultConnectionConfig, tenantCapability: true },
      requestConfig: defaultRequestConfig,
    });
  expect(call).toThrow(ConfigError);
  expect(call).toThrow(
    'Connection type "TestConnection" does not implement the tenant scoping contract in the installed version, but the build artifact for connection "testConnection" declares it.'
  );
});

test('the runtime meta wins over a stale build stamp', () => {
  // Runtime says non-scopable, stamp claims the contract: never scope on paper.
  const res = resolveTenant(contextWithOrg, {
    connection: nonScopableConnection,
    connectionConfig: { ...defaultConnectionConfig, tenantCapability: true },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toBe(null);
  // Runtime enforces the contract, stamp predates it: the runtime scopes.
  const scoped = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: { ...defaultConnectionConfig, tenantCapability: false },
    requestConfig: defaultRequestConfig,
  });
  expect(scoped).toEqual({ field: 'organization_id', value: 'org-1' });
});

test('a build-stamped scoping capability with runtime enforcement resolves the verdict', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: { ...defaultConnectionConfig, tenantCapability: true },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toEqual({ field: 'organization_id', value: 'org-1' });
});

test('a type declaring no capability returns null under the pinned policy', () => {
  const res = resolveTenant(
    { organization: { policy: 'pinned' }, user: { id: 'id', organization_id: 'org-1' } },
    {
      connection: plainConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
});

test('throws ConfigError when tenant is declared on a type without the contract', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: plainConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'organization_id' } },
      requestConfig: defaultRequestConfig,
    })
  ).toThrow(
    'Connection type "TestConnection" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "testConnection".'
  );
});

test('throws ConfigError when tenant shared is declared on a type without the contract', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: nonScopableConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: 'shared' },
      requestConfig: defaultRequestConfig,
    })
  ).toThrow(ConfigError);
});

test('declared-tenant contract check applies under the pinned policy', () => {
  expect(() =>
    resolveTenant(
      { organization: { policy: 'pinned' }, user: { id: 'id', organization_id: 'org-1' } },
      {
        connection: plainConnection,
        connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'organization_id' } },
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(ConfigError);
});

test('declared-tenant contract check applies even when the request opts out with tenant none', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: plainConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'organization_id' } },
      requestConfig: { ...defaultRequestConfig, tenant: 'none' },
    })
  ).toThrow(ConfigError);
});

test('returns null when request opts out with tenant none', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: defaultConnectionConfig,
    requestConfig: { ...defaultRequestConfig, tenant: 'none' },
  });
  expect(res).toBe(null);
});

test('tenant none opt-out does not require a caller organization', () => {
  const res = resolveTenant(
    { ...tenantPolicy, user: null },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: { ...defaultRequestConfig, tenant: 'none' },
    }
  );
  expect(res).toBe(null);
});

test('throws AuthenticationError when context has no user', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: null },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(AuthenticationError);
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: null },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(
    'Request "requestId" reads tenant connection "testConnection" but no caller organization resolved.'
  );
});

test('throws AuthenticationError when user has no organization_id', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: { id: 'id' } },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(AuthenticationError);
});

test('throws AuthenticationError when user organization_id is an empty string', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: { id: 'id', organization_id: '' } },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(AuthenticationError);
});

test('throws AuthenticationError when user organization_id is not a string', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: { id: 'id', organization_id: 42 } },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(AuthenticationError);
});

test('AuthenticationError message prefers stepId over requestId', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: null },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: { ...defaultRequestConfig, stepId: 'stepId' },
      }
    )
  ).toThrow(
    'Request "stepId" reads tenant connection "testConnection" but no caller organization resolved.'
  );
});

test('AuthenticationError message falls back to websocketId for websocket configs', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: null },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: { id: 'websocket:ws1', type: 'TestSource', websocketId: 'ws1' },
      }
    )
  ).toThrow(
    'Request "ws1" reads tenant connection "testConnection" but no caller organization resolved.'
  );
});

test('tenant with a field object resolves the custom field', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'tenant_id' } },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toEqual({ field: 'tenant_id', value: 'org-1' });
});

test('tenant with a dotted field throws instead of enforcing on an unmatchable key', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: tenantConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'meta.organizationId' } },
      requestConfig: defaultRequestConfig,
    })
  ).toThrow(
    'Connection "tenant.field" should be a non-empty top-level field name (no dots) at connection "testConnection" — the tenant wall stamps and matches it as a single document key.'
  );
});

test('tenant with a missing or empty field on a drifted artifact throws', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: tenantConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: {} },
      requestConfig: defaultRequestConfig,
    })
  ).toThrow('Connection "tenant.field" should be a non-empty top-level field name');
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: tenantConnection,
      connectionConfig: { ...defaultConnectionConfig, tenant: { field: '' } },
      requestConfig: defaultRequestConfig,
    })
  ).toThrow('Connection "tenant.field" should be a non-empty top-level field name');
});

test('tenant value comes from context.user.organization_id', () => {
  const res = resolveTenant(
    { ...tenantPolicy, user: { id: 'other', organization_id: 'org-2' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toEqual({ field: 'organization_id', value: 'org-2' });
});

test('tenant authored resolves the verdict with the authored marker', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: defaultConnectionConfig,
    requestConfig: { ...defaultRequestConfig, tenant: 'authored' },
  });
  expect(res).toEqual({ field: 'organization_id', value: 'org-1', authored: true });
});

test('tenant authored still requires a caller organization', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: { id: 'id' } },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: { ...defaultRequestConfig, tenant: 'authored' },
      }
    )
  ).toThrow('no caller organization resolved');
});

test('tenant authored resolves the custom field with the authored marker', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'tenant_id' } },
    requestConfig: { ...defaultRequestConfig, tenant: 'authored' },
  });
  expect(res).toEqual({ field: 'tenant_id', value: 'org-1', authored: true });
});

test('returns null under the pinned policy', () => {
  const res = resolveTenant(
    { organization: { policy: 'pinned' }, user: { id: 'id', organization_id: 'org-1' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
});

test('returns null when no organization binding resolved', () => {
  const res = resolveTenant(
    { user: { id: 'id', organization_id: 'org-1' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
  const resNullBinding = resolveTenant(
    { organization: null, user: { id: 'id', organization_id: 'org-1' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(resNullBinding).toBe(null);
});

test('pinned policy does not require a caller organization', () => {
  const res = resolveTenant(
    { organization: { policy: 'pinned' }, user: null },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
});

test('tenant authored returns null under the pinned policy', () => {
  const res = resolveTenant(
    { organization: { policy: 'pinned' }, user: { id: 'id', organization_id: 'org-1' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: { ...defaultRequestConfig, tenant: 'authored' },
    }
  );
  expect(res).toBe(null);
});
