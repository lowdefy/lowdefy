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

import applyTenantToFilter from './applyTenantToFilter.js';

const tenant = { field: 'organization_id', value: 'org_a' };

test('returns bare equality for an undefined filter', () => {
  expect(applyTenantToFilter({ filter: undefined, tenant })).toEqual({ organization_id: 'org_a' });
});

test('returns bare equality for a null filter', () => {
  expect(applyTenantToFilter({ filter: null, tenant })).toEqual({ organization_id: 'org_a' });
});

test('returns bare equality for an empty filter', () => {
  expect(applyTenantToFilter({ filter: {}, tenant })).toEqual({ organization_id: 'org_a' });
});

test('merges the tenant equality into a filter with $and', () => {
  expect(applyTenantToFilter({ filter: { _id: 1 }, tenant })).toEqual({
    $and: [{ _id: 1 }, { organization_id: 'org_a' }],
  });
});

test('composes with a filter that already uses $and at the top level', () => {
  const filter = { $and: [{ a: 1 }, { b: 2 }] };
  expect(applyTenantToFilter({ filter, tenant })).toEqual({
    $and: [{ $and: [{ a: 1 }, { b: 2 }] }, { organization_id: 'org_a' }],
  });
});

test('composes with a filter that uses $or at the top level', () => {
  const filter = { $or: [{ a: 1 }, { b: 2 }] };
  expect(applyTenantToFilter({ filter, tenant })).toEqual({
    $and: [{ $or: [{ a: 1 }, { b: 2 }] }, { organization_id: 'org_a' }],
  });
});

test('throws when the tenant field is authored at the top level', () => {
  expect(() => applyTenantToFilter({ filter: { organization_id: 'org_b' }, tenant })).toThrow(
    'Tenant field "organization_id" can not be set in a filter on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
});

test('an authored tenant field is refused as a ConfigError so the location resolves to the YAML', () => {
  expect(() => applyTenantToFilter({ filter: { organization_id: 'org_b' }, tenant })).toThrow(
    expect.objectContaining({ name: 'ConfigError', isLowdefyError: true })
  );
});

test('throws when the tenant field is authored nested in $or', () => {
  expect(() =>
    applyTenantToFilter({ filter: { $or: [{ a: 1 }, { organization_id: 'org_b' }] }, tenant })
  ).toThrow('Tenant field "organization_id" can not be set in a filter');
});

test('throws when a dotted tenant field key is authored', () => {
  expect(() => applyTenantToFilter({ filter: { 'organization_id.x': 1 }, tenant })).toThrow(
    'Tenant field "organization_id" can not be set in a filter'
  );
});

test('uses the position in the error message', () => {
  expect(() =>
    applyTenantToFilter({ filter: { organization_id: 'org_b' }, tenant, position: 'a query' })
  ).toThrow('Tenant field "organization_id" can not be set in a query');
});

test('uses the custom tenant field name', () => {
  const customTenant = { field: 'tenantId', value: 't_1' };
  expect(
    applyTenantToFilter({ filter: { organization_id: 'kept' }, tenant: customTenant })
  ).toEqual({
    $and: [{ organization_id: 'kept' }, { tenantId: 't_1' }],
  });
  expect(() => applyTenantToFilter({ filter: { tenantId: 't_2' }, tenant: customTenant })).toThrow(
    'Tenant field "tenantId" can not be set in a filter'
  );
});

test('refuses an authored verdict — tenant: authored is aggregation-only', () => {
  expect(() =>
    applyTenantToFilter({
      filter: { status: 'open' },
      tenant: { field: 'organization_id', value: 'org_a', authored: true },
    })
  ).toThrow('"tenant: authored" applies only to aggregation requests');
});
