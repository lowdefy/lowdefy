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

const tenantConnection = {
  meta: { tenant: true },
};

const plainConnection = {};

const defaultConnectionConfig = {
  id: 'connection:testConnection',
  type: 'TestConnection',
  connectionId: 'testConnection',
  tenant: true,
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
  user: { id: 'id', organizationId: 'org-1' },
};

test('returns null when connection has no tenant declared', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: plainConnection,
    connectionConfig: {
      ...defaultConnectionConfig,
      tenant: undefined,
    },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toBe(null);
});

test('returns null when connection tenant is null', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: plainConnection,
    connectionConfig: {
      ...defaultConnectionConfig,
      tenant: null,
    },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toBe(null);
});

test('throws ConfigError when connection type does not implement the tenant contract', () => {
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
    'Connection type "TestConnection" does not implement the tenant scoping contract, so "tenant" can not be enforced at connection "testConnection".'
  );
});

test('throws ConfigError when connection meta.tenant is not exactly true', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: { meta: { tenant: 'yes' } },
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    })
  ).toThrow(ConfigError);
});

test('contract check applies even when the request opts out with tenant none', () => {
  expect(() =>
    resolveTenant(contextWithOrg, {
      connection: plainConnection,
      connectionConfig: defaultConnectionConfig,
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

test('throws AuthenticationError when user has no organizationId', () => {
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

test('throws AuthenticationError when user organizationId is an empty string', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: { id: 'id', organizationId: '' } },
      {
        connection: tenantConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(AuthenticationError);
});

test('throws AuthenticationError when user organizationId is not a string', () => {
  expect(() =>
    resolveTenant(
      { ...tenantPolicy, user: { id: 'id', organizationId: 42 } },
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

test('tenant true resolves the default organizationId field with the caller organization', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: defaultConnectionConfig,
    requestConfig: defaultRequestConfig,
  });
  expect(res).toEqual({ field: 'organizationId', value: 'org-1' });
});

test('tenant with a field object resolves the custom field', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'organization_id' } },
    requestConfig: defaultRequestConfig,
  });
  expect(res).toEqual({ field: 'organization_id', value: 'org-1' });
});

test('tenant value comes from context.user.organizationId', () => {
  const res = resolveTenant(
    { ...tenantPolicy, user: { id: 'other', organizationId: 'org-2' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toEqual({ field: 'organizationId', value: 'org-2' });
});

test('tenant authored resolves the verdict with the authored marker', () => {
  const res = resolveTenant(contextWithOrg, {
    connection: tenantConnection,
    connectionConfig: defaultConnectionConfig,
    requestConfig: { ...defaultRequestConfig, tenant: 'authored' },
  });
  expect(res).toEqual({ field: 'organizationId', value: 'org-1', authored: true });
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
    connectionConfig: { ...defaultConnectionConfig, tenant: { field: 'organization_id' } },
    requestConfig: { ...defaultRequestConfig, tenant: 'authored' },
  });
  expect(res).toEqual({ field: 'organization_id', value: 'org-1', authored: true });
});

test('returns null under the pinned policy', () => {
  const res = resolveTenant(
    { organization: { policy: 'pinned' }, user: { id: 'id', organizationId: 'org-1' } },
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
    { user: { id: 'id', organizationId: 'org-1' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: defaultRequestConfig,
    }
  );
  expect(res).toBe(null);
  const resNullBinding = resolveTenant(
    { organization: null, user: { id: 'id', organizationId: 'org-1' } },
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
    { organization: { policy: 'pinned' }, user: { id: 'id', organizationId: 'org-1' } },
    {
      connection: tenantConnection,
      connectionConfig: defaultConnectionConfig,
      requestConfig: { ...defaultRequestConfig, tenant: 'authored' },
    }
  );
  expect(res).toBe(null);
});

test('contract check applies under the pinned policy', () => {
  expect(() =>
    resolveTenant(
      { organization: { policy: 'pinned' }, user: { id: 'id', organizationId: 'org-1' } },
      {
        connection: plainConnection,
        connectionConfig: defaultConnectionConfig,
        requestConfig: defaultRequestConfig,
      }
    )
  ).toThrow(ConfigError);
});
