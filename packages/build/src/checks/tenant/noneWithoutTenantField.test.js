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
import noneWithoutTenantField from './noneWithoutTenantField.js';
import { createTenantContext, pageRequest, endpointStep } from './testSites.js';

test('noneWithoutTenantField runs under check only', () => {
  expect(noneWithoutTenantField.slug).toBe('tenant-unscoped');
  expect(noneWithoutTenantField.checkOnly).toBe(true);
});

test('noneWithoutTenantField errors when a tenant: none step never mentions the field', () => {
  const context = createTenantContext();
  const components = endpointStep({
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { status: 'active' } },
  });
  noneWithoutTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Step "read_all_controls" at endpoint "nightly_sync" declares "tenant: none" on tenant connection "controls_db" but never mentions "organization_id". It reads every organization\'s rows. Scope the endpoint with runAs: { organizationId: … }, or author an "organization_id" clause in its properties.'
  );
  expect(context.errors[0]).toMatchObject({
    configKey: 'k_read_all_controls',
    checkSlug: 'tenant-unscoped',
  });
});

test('noneWithoutTenantField errors for a tenant: none page request with no properties at all', () => {
  const context = createTenantContext();
  const components = pageRequest({ type: 'MongoDBFind', tenant: 'none' });
  noneWithoutTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(
    /^Request "get_controls" at page "controls" declares "tenant: none"/
  );
});

test('noneWithoutTenantField does not fire when the field is present anywhere in properties', () => {
  const context = createTenantContext();
  const components = endpointStep({
    connectionId: 'tenants_db',
    type: 'MongoDBAggregation',
    tenant: 'none',
    properties: {
      pipeline: [
        { $match: { status: 'active' } },
        { $group: { _id: '$tenant_id' } },
        { $match: { tenant_id: { _step: 'org.id' } } },
      ],
    },
  });
  noneWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneWithoutTenantField does not fire for a walled site without the tenant: none sentinel', () => {
  const context = createTenantContext();
  const components = endpointStep({
    type: 'MongoDBFind',
    properties: { query: { status: 'active' } },
  });
  noneWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneWithoutTenantField does not fire on a connection that is not walled', () => {
  const context = createTenantContext();
  const components = endpointStep({
    connectionId: 'catalogue_db',
    type: 'MongoDBFind',
    tenant: 'none',
    properties: {},
  });
  noneWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneWithoutTenantField skips a site whose filter is composed by an operator', () => {
  const context = createTenantContext();
  const components = endpointStep({
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { _step: 'build_query' } },
  });
  noneWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});
