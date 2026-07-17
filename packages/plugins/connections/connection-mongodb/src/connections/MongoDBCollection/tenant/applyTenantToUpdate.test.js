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

import applyTenantToUpdate from './applyTenantToUpdate.js';

const tenant = { field: 'organizationId', value: 'org_a' };

test('object form update without upsert passes through unchanged', () => {
  const update = { $set: { v: 'after' }, $inc: { count: 1 } };
  expect(applyTenantToUpdate({ update, tenant })).toEqual({
    $set: { v: 'after' },
    $inc: { count: 1 },
  });
});

test('object form upsert adds the tenant field to $setOnInsert', () => {
  const update = { $set: { v: 'after' } };
  expect(applyTenantToUpdate({ update, tenant, upsert: true })).toEqual({
    $set: { v: 'after' },
    $setOnInsert: { organizationId: 'org_a' },
  });
});

test('object form upsert merges into an existing $setOnInsert', () => {
  const update = { $set: { v: 'after' }, $setOnInsert: { createdAt: 'now' } };
  expect(applyTenantToUpdate({ update, tenant, upsert: true })).toEqual({
    $set: { v: 'after' },
    $setOnInsert: { createdAt: 'now', organizationId: 'org_a' },
  });
});

test('object form throws when $set authors the tenant field', () => {
  expect(() =>
    applyTenantToUpdate({ update: { $set: { organizationId: 'org_b' } }, tenant })
  ).toThrow(
    'Tenant field "organizationId" can not be set in an update on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
});

test('object form throws when $inc authors the tenant field', () => {
  expect(() => applyTenantToUpdate({ update: { $inc: { organizationId: 1 } }, tenant })).toThrow(
    'Tenant field "organizationId" can not be set in an update'
  );
});

test('object form throws when $set authors a dotted tenant field path', () => {
  expect(() =>
    applyTenantToUpdate({ update: { $set: { 'organizationId.x': 1 } }, tenant })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('object form throws when $unset drops the tenant field', () => {
  expect(() => applyTenantToUpdate({ update: { $unset: { organizationId: '' } }, tenant })).toThrow(
    'Tenant field "organizationId" can not be set in an update'
  );
});

test('object form throws when $setOnInsert authors the tenant field', () => {
  expect(() =>
    applyTenantToUpdate({
      update: { $setOnInsert: { organizationId: 'org_b' } },
      tenant,
      upsert: true,
    })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('object form throws when $rename renames the tenant field away', () => {
  expect(() =>
    applyTenantToUpdate({ update: { $rename: { organizationId: 'other' } }, tenant })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('object form throws when $rename targets the tenant field', () => {
  expect(() =>
    applyTenantToUpdate({ update: { $rename: { other: 'organizationId' } }, tenant })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('object form throws when $rename targets a dotted tenant field path', () => {
  expect(() =>
    applyTenantToUpdate({ update: { $rename: { other: 'organizationId.x' } }, tenant })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('object form allows $rename between unrelated fields', () => {
  const update = { $rename: { a: 'b' } };
  expect(applyTenantToUpdate({ update, tenant })).toEqual({ $rename: { a: 'b' } });
});

test('pipeline form appends a final tenant $set stage', () => {
  const update = [{ $set: { v: 'after' } }, { $unset: 'other' }];
  expect(applyTenantToUpdate({ update, tenant })).toEqual([
    { $set: { v: 'after' } },
    { $unset: 'other' },
    { $set: { organizationId: 'org_a' } },
  ]);
});

test('pipeline form appends the tenant $set to an empty pipeline', () => {
  expect(applyTenantToUpdate({ update: [], tenant })).toEqual([
    { $set: { organizationId: 'org_a' } },
  ]);
});

test('pipeline form appends the tenant $set on upsert', () => {
  expect(applyTenantToUpdate({ update: [{ $set: { v: 1 } }], tenant, upsert: true })).toEqual([
    { $set: { v: 1 } },
    { $set: { organizationId: 'org_a' } },
  ]);
});

test('pipeline form throws when a $set stage authors the tenant field', () => {
  expect(() =>
    applyTenantToUpdate({ update: [{ $set: { organizationId: 'org_b' } }], tenant })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('pipeline form throws when a $replaceRoot stage authors the tenant field', () => {
  expect(() =>
    applyTenantToUpdate({
      update: [{ $replaceRoot: { newRoot: { organizationId: 'org_b' } } }],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('pipeline form throws when $unset string form drops the tenant field', () => {
  expect(() => applyTenantToUpdate({ update: [{ $unset: 'organizationId' }], tenant })).toThrow(
    'Tenant field "organizationId" can not be set in an update'
  );
});

test('pipeline form throws when $unset string form drops a dotted tenant field path', () => {
  expect(() => applyTenantToUpdate({ update: [{ $unset: 'organizationId.x' }], tenant })).toThrow(
    'Tenant field "organizationId" can not be set in an update'
  );
});

test('pipeline form throws when $unset array form drops the tenant field', () => {
  expect(() =>
    applyTenantToUpdate({ update: [{ $unset: ['other', 'organizationId'] }], tenant })
  ).toThrow('Tenant field "organizationId" can not be set in an update');
});

test('pipeline form allows $unset of unrelated fields', () => {
  expect(applyTenantToUpdate({ update: [{ $unset: ['a', 'b'] }], tenant })).toEqual([
    { $unset: ['a', 'b'] },
    { $set: { organizationId: 'org_a' } },
  ]);
});

test('pipeline form allows $unset of a field that only shares the prefix', () => {
  expect(applyTenantToUpdate({ update: [{ $unset: 'organizationIdentifier' }], tenant })).toEqual([
    { $unset: 'organizationIdentifier' },
    { $set: { organizationId: 'org_a' } },
  ]);
});

test('uses the custom tenant field name', () => {
  const customTenant = { field: 'tenantId', value: 't_1' };
  expect(
    applyTenantToUpdate({ update: { $set: { organizationId: 'kept' } }, tenant: customTenant })
  ).toEqual({ $set: { organizationId: 'kept' } });
  expect(applyTenantToUpdate({ update: [{ $set: { v: 1 } }], tenant: customTenant })).toEqual([
    { $set: { v: 1 } },
    { $set: { tenantId: 't_1' } },
  ]);
  expect(() =>
    applyTenantToUpdate({ update: { $set: { tenantId: 't_2' } }, tenant: customTenant })
  ).toThrow('Tenant field "tenantId" can not be set in an update');
});
