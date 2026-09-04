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
import noneSupersededByRunAs from './noneSupersededByRunAs.js';
import { createTenantContext, pageRequest, endpointStep, mergeComponents } from './testSites.js';

test('noneSupersededByRunAs runs on every build, not under check only', () => {
  expect(noneSupersededByRunAs.slug).toBe('tenant-none-deprecated');
  expect(noneSupersededByRunAs.checkOnly).toBe(false);
});

test('noneSupersededByRunAs warns on a tenant: none request step and names runAs', () => {
  const context = createTenantContext();
  const components = endpointStep({
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { organization_id: 'org-1' } },
  });
  noneSupersededByRunAs.run({ components, context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toBe(
    'Step "read_all_controls" at endpoint "nightly_sync" declares "tenant: none", which is deprecated and is removed in v9. Declare runAs: { organizationId: … } on the endpoint instead - it keeps the tenant wall on and names the organization the routine runs as, where "tenant: none" switches the wall off.'
  );
  expect(context.warnings[0]).toMatchObject({
    configKey: 'k_read_all_controls',
    checkSlug: 'tenant-none-deprecated',
    name: 'ConfigWarning',
  });
  expect(context.errors).toEqual([]);
});

test('noneSupersededByRunAs warns on a tenant: none page request', () => {
  const context = createTenantContext();
  const components = pageRequest({ type: 'MongoDBFind', tenant: 'none' });
  noneSupersededByRunAs.run({ components, context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toMatch(
    /^Request "get_controls" at page "controls" declares "tenant: none"/
  );
});

test('noneSupersededByRunAs warns once per site when several declare tenant: none', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({ id: 'a', type: 'MongoDBFind', tenant: 'none' }),
    endpointStep({ id: 'b', type: 'MongoDBFind', tenant: 'none' })
  );
  noneSupersededByRunAs.run({ components, context });
  expect(context.warnings).toHaveLength(2);
});

test('noneSupersededByRunAs does not warn for tenant: authored or an undeclared site', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({ id: 'authored', type: 'MongoDBAggregation', tenant: 'authored' }),
    endpointStep({ id: 'walled', type: 'MongoDBFind' })
  );
  noneSupersededByRunAs.run({ components, context });
  expect(context.warnings).toEqual([]);
});
