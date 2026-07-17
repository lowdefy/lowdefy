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

import stampTenantOnDoc from './stampTenantOnDoc.js';

const tenant = { field: 'organizationId', value: 'org_a' };

test('stamps the tenant field onto the document', () => {
  expect(stampTenantOnDoc({ doc: { name: 'x' }, tenant })).toEqual({
    name: 'x',
    organizationId: 'org_a',
  });
});

test('does not mutate the original document', () => {
  const doc = { name: 'x' };
  stampTenantOnDoc({ doc, tenant });
  expect(doc).toEqual({ name: 'x' });
});

test('throws when the tenant field is authored on the document', () => {
  expect(() => stampTenantOnDoc({ doc: { organizationId: 'org_a' }, tenant })).toThrow(
    'Tenant field "organizationId" can not be set in an insert document on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
});

test('throws when the tenant field is authored nested in the document', () => {
  expect(() => stampTenantOnDoc({ doc: { meta: { organizationId: 'org_b' } }, tenant })).toThrow(
    'Tenant field "organizationId" can not be set in an insert document'
  );
});

test('throws when a dotted tenant field key is authored', () => {
  expect(() => stampTenantOnDoc({ doc: { 'organizationId.x': 1 }, tenant })).toThrow(
    'Tenant field "organizationId" can not be set in an insert document'
  );
});

test('uses the position in the error message', () => {
  expect(() =>
    stampTenantOnDoc({
      doc: { organizationId: 'org_b' },
      tenant,
      position: 'a replacement document',
    })
  ).toThrow('Tenant field "organizationId" can not be set in a replacement document');
});

test('uses the custom tenant field name', () => {
  const customTenant = { field: 'tenantId', value: 't_1' };
  expect(stampTenantOnDoc({ doc: { organizationId: 'kept' }, tenant: customTenant })).toEqual({
    organizationId: 'kept',
    tenantId: 't_1',
  });
  expect(() => stampTenantOnDoc({ doc: { tenantId: 't_2' }, tenant: customTenant })).toThrow(
    'Tenant field "tenantId" can not be set in an insert document'
  );
});
