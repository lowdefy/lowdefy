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

import assertTenantPathNotAuthored from './assertTenantPathNotAuthored.js';

const field = 'organization_id';
const position = 'an update';

test('throws when the tenant field is a top-level key', () => {
  expect(() =>
    assertTenantPathNotAuthored({ value: { organization_id: 'org_b' }, field, position })
  ).toThrow(
    'Tenant field "organization_id" can not be set in an update on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
});

test('throws when a dotted path rooted in the tenant field is a top-level key', () => {
  expect(() =>
    assertTenantPathNotAuthored({ value: { 'organization_id.x': 1 }, field, position })
  ).toThrow('Tenant field "organization_id" can not be set in an update');
});

test('throws for a null-prototype object keyed on the tenant field', () => {
  const value = Object.create(null);
  value.organization_id = 'org_b';
  expect(() => assertTenantPathNotAuthored({ value, field, position })).toThrow(
    'Tenant field "organization_id" can not be set in an update'
  );
});

test('does not throw when the tenant field name is nested inside a value', () => {
  expect(() =>
    assertTenantPathNotAuthored({
      value: {
        meta: { organization_id: 'org_b' },
        messages: [{ parts: [{ output: { organization_id: 'org_b' } }] }],
      },
      field,
      position,
    })
  ).not.toThrow();
});

test('does not throw for a key that only shares the prefix', () => {
  expect(() =>
    assertTenantPathNotAuthored({ value: { organization_identifier: 'x' }, field, position })
  ).not.toThrow();
});

test('does not throw for a subdocument path onto the field name', () => {
  expect(() =>
    assertTenantPathNotAuthored({ value: { 'meta.organization_id': 'x' }, field, position })
  ).not.toThrow();
});

test('ignores non-object values', () => {
  expect(() => assertTenantPathNotAuthored({ value: null, field, position })).not.toThrow();
  expect(() => assertTenantPathNotAuthored({ value: undefined, field, position })).not.toThrow();
  expect(() =>
    assertTenantPathNotAuthored({ value: 'organization_id', field, position })
  ).not.toThrow();
  expect(() =>
    assertTenantPathNotAuthored({ value: [{ organization_id: 1 }], field, position })
  ).not.toThrow();
});
