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

import resolveTenantGuard from './resolveTenantGuard.js';

const tenantConnection = { meta: { tenant: true } };
const nonScopableConnection = { meta: { tenant: false } };

const connectionConfig = {
  id: 'connection:testConnection',
  type: 'TestConnection',
  connectionId: 'testConnection',
};

const noneRequestConfig = {
  id: 'request:pageId:requestId',
  type: 'TestRequest',
  requestId: 'requestId',
  connectionId: 'testConnection',
  tenant: 'none',
};

const tenantPolicy = { organization: { policy: 'tenant' } };

test('guards a tenant none request on a walled connection under the tenant policy', () => {
  expect(
    resolveTenantGuard(tenantPolicy, {
      connection: tenantConnection,
      connectionConfig,
      requestConfig: noneRequestConfig,
    })
  ).toEqual({ field: 'organization_id' });
});

test('uses the declared tenant field', () => {
  expect(
    resolveTenantGuard(tenantPolicy, {
      connection: tenantConnection,
      connectionConfig: { ...connectionConfig, tenant: { field: 'org' } },
      requestConfig: noneRequestConfig,
    })
  ).toEqual({ field: 'org' });
});

test('no guard for a scoped request - the wall stamps it', () => {
  expect(
    resolveTenantGuard(tenantPolicy, {
      connection: tenantConnection,
      connectionConfig,
      requestConfig: { ...noneRequestConfig, tenant: undefined },
    })
  ).toBe(null);
});

test('no guard under the pinned policy', () => {
  expect(
    resolveTenantGuard(
      { organization: { policy: 'pinned' } },
      { connection: tenantConnection, connectionConfig, requestConfig: noneRequestConfig }
    )
  ).toBe(null);
  expect(
    resolveTenantGuard(
      {},
      { connection: tenantConnection, connectionConfig, requestConfig: noneRequestConfig }
    )
  ).toBe(null);
});

test('no guard on a tenant shared connection', () => {
  expect(
    resolveTenantGuard(tenantPolicy, {
      connection: tenantConnection,
      connectionConfig: { ...connectionConfig, tenant: 'shared' },
      requestConfig: noneRequestConfig,
    })
  ).toBe(null);
});

test('no guard on a non-scopable connection type', () => {
  expect(
    resolveTenantGuard(tenantPolicy, {
      connection: nonScopableConnection,
      connectionConfig,
      requestConfig: noneRequestConfig,
    })
  ).toBe(null);
});
