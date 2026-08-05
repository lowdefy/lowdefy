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

import { ObjectId } from 'mongodb';
import assertTenantFieldNotAuthored from './assertTenantFieldNotAuthored.js';

const field = 'organizationId';
const position = 'a query';

test('throws when the tenant field is a top-level key', () => {
  expect(() =>
    assertTenantFieldNotAuthored({ value: { organizationId: 'org_b' }, field, position })
  ).toThrow(
    'Tenant field "organizationId" can not be set in a query on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
});

test('throws when a dotted key is rooted in the tenant field', () => {
  expect(() =>
    assertTenantFieldNotAuthored({ value: { 'organizationId.x': 1 }, field, position })
  ).toThrow('Tenant field "organizationId" can not be set in a query');
});

test('throws when the tenant field is nested inside $and', () => {
  expect(() =>
    assertTenantFieldNotAuthored({
      value: { $and: [{ name: 'a' }, { organizationId: 'org_b' }] },
      field,
      position,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a query');
});

test('throws when the tenant field is nested inside $or', () => {
  expect(() =>
    assertTenantFieldNotAuthored({
      value: { $or: [{ name: 'a' }, { $and: [{ organizationId: { $ne: null } }] }] },
      field,
      position,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a query');
});

test('throws when the tenant field is nested inside $elemMatch', () => {
  expect(() =>
    assertTenantFieldNotAuthored({
      value: { items: { $elemMatch: { organizationId: 'org_b' } } },
      field,
      position,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a query');
});

test('does not throw when the tenant field is absent', () => {
  expect(() =>
    assertTenantFieldNotAuthored({
      value: { $and: [{ name: 'a' }, { status: { $in: ['x', 'y'] } }] },
      field,
      position,
    })
  ).not.toThrow();
});

test('does not throw when the tenant field appears as a value', () => {
  expect(() =>
    assertTenantFieldNotAuthored({ value: { sortBy: 'organizationId' }, field, position })
  ).not.toThrow();
});

test('does not throw for a key that only shares the tenant field prefix', () => {
  expect(() =>
    assertTenantFieldNotAuthored({ value: { organizationIdentifier: 'x' }, field, position })
  ).not.toThrow();
});

test('does not throw for a nested subdocument path onto the field name', () => {
  expect(() =>
    assertTenantFieldNotAuthored({ value: { 'meta.organizationId': 'x' }, field, position })
  ).not.toThrow();
});

test('does not recurse into BSON values', () => {
  expect(() =>
    assertTenantFieldNotAuthored({
      value: { createdAt: new Date(), _id: new ObjectId() },
      field,
      position,
    })
  ).not.toThrow();
});

test('handles null and undefined values', () => {
  expect(() => assertTenantFieldNotAuthored({ value: null, field, position })).not.toThrow();
  expect(() => assertTenantFieldNotAuthored({ value: undefined, field, position })).not.toThrow();
  expect(() => assertTenantFieldNotAuthored({ value: { a: null }, field, position })).not.toThrow();
});

test('scans through arrays', () => {
  expect(() =>
    assertTenantFieldNotAuthored({
      value: [{ a: 1 }, [{ organizationId: 'org_b' }]],
      field,
      position,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a query');
});

test('scans null-prototype objects', () => {
  const nullProtoDoc = Object.create(null);
  nullProtoDoc.organizationId = 'org_b';
  expect(() => assertTenantFieldNotAuthored({ value: nullProtoDoc, field, position })).toThrow(
    'Tenant field "organizationId" can not be set in a query'
  );
  const nested = { $set: Object.create(null) };
  nested.$set.organizationId = 'org_b';
  expect(() => assertTenantFieldNotAuthored({ value: nested, field, position })).toThrow(
    'Tenant field "organizationId" can not be set in a query'
  );
});

test('uses the custom tenant field name', () => {
  expect(() =>
    assertTenantFieldNotAuthored({
      value: { tenantId: 'org_b' },
      field: 'tenantId',
      position: 'an update',
    })
  ).toThrow(
    'Tenant field "tenantId" can not be set in an update on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
  expect(() =>
    assertTenantFieldNotAuthored({
      value: { organizationId: 'org_b' },
      field: 'tenantId',
      position: 'an update',
    })
  ).not.toThrow();
});
