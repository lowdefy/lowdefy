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
import unscopedInventory from './unscopedInventory.js';
import { createTenantContext, pageRequest, endpointStep, mergeComponents } from './testSites.js';

test('unscopedInventory runs under check only', () => {
  expect(unscopedInventory.slug).toBe('tenant-inventory');
  expect(unscopedInventory.checkOnly).toBe(true);
});

test('unscopedInventory warns once per tenant: none site with its own configKey', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({
      type: 'MongoDBFind',
      tenant: 'none',
      properties: { query: { organization_id: { _user: 'organization_id' } } },
    }),
    endpointStep({ type: 'MongoDBFind', tenant: 'none', properties: {} })
  );
  unscopedInventory.run({ components, context });
  expect(context.errors).toEqual([]);
  expect(context.warnings).toHaveLength(2);
  expect(context.warnings[0].message).toBe(
    'Request "get_controls" at page "controls" runs unscoped on tenant connection "controls_db" (tenant: none). Prefer runAs: { organizationId: … }, which keeps the wall on.'
  );
  expect(context.warnings[0]).toMatchObject({
    name: 'ConfigWarning',
    configKey: 'k_get_controls',
    checkSlug: 'tenant-inventory',
  });
  expect(context.warnings[1].message).toBe(
    'Step "read_all_controls" at endpoint "nightly_sync" runs unscoped on tenant connection "controls_db" (tenant: none). Prefer runAs: { organizationId: … }, which keeps the wall on.'
  );
  expect(context.warnings[1]).toMatchObject({
    configKey: 'k_read_all_controls',
    checkSlug: 'tenant-inventory',
  });
});

test('unscopedInventory lists nothing for scoped, authored or non-walled sites', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({ type: 'MongoDBFind', properties: {} }),
    endpointStep({
      id: 'authored',
      type: 'MongoDBAggregation',
      tenant: 'authored',
      properties: {},
    }),
    endpointStep({
      id: 'shared',
      connectionId: 'catalogue_db',
      type: 'MongoDBFind',
      tenant: 'none',
      properties: {},
    })
  );
  unscopedInventory.run({ components, context });
  expect(context.warnings).toEqual([]);
});
