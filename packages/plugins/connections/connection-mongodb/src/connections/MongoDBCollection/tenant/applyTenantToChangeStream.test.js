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

import applyTenantToChangeStream from './applyTenantToChangeStream.js';

const tenant = { field: 'organizationId', value: 'org_a' };

test('prepends the tenant $match against fullDocument and forces updateLookup', () => {
  expect(
    applyTenantToChangeStream({ pipeline: [{ $match: { operationType: 'insert' } }], tenant })
  ).toEqual({
    pipeline: [
      { $match: { 'fullDocument.organizationId': 'org_a' } },
      { $match: { operationType: 'insert' } },
    ],
    fullDocument: 'updateLookup',
  });
});

test('handles an undefined pipeline', () => {
  expect(applyTenantToChangeStream({ pipeline: undefined, tenant })).toEqual({
    pipeline: [{ $match: { 'fullDocument.organizationId': 'org_a' } }],
    fullDocument: 'updateLookup',
  });
});

test('throws when the tenant field is authored in the pipeline', () => {
  expect(() =>
    applyTenantToChangeStream({ pipeline: [{ $match: { organizationId: 'org_b' } }], tenant })
  ).toThrow(
    'Tenant field "organizationId" can not be set in a change stream pipeline on a tenant connection - the tenant wall stamps and filters it mechanically.'
  );
});

test('throws when the fullDocument tenant path is authored in the pipeline', () => {
  expect(() =>
    applyTenantToChangeStream({
      pipeline: [{ $match: { 'fullDocument.organizationId': 'org_b' } }],
      tenant,
    })
  ).toThrow(
    'Tenant field "fullDocument.organizationId" can not be set in a change stream pipeline'
  );
});

test('throws when the tenant field is authored nested in the pipeline', () => {
  expect(() =>
    applyTenantToChangeStream({
      pipeline: [{ $match: { $or: [{ operationType: 'insert' }, { organizationId: 'x' }] } }],
      tenant,
    })
  ).toThrow('Tenant field "organizationId" can not be set in a change stream pipeline');
});

test('uses the custom tenant field name', () => {
  expect(
    applyTenantToChangeStream({ pipeline: [], tenant: { field: 'tenantId', value: 't_1' } })
  ).toEqual({
    pipeline: [{ $match: { 'fullDocument.tenantId': 't_1' } }],
    fullDocument: 'updateLookup',
  });
});

test('refuses an authored verdict — tenant: authored is aggregation-only', () => {
  expect(() =>
    applyTenantToChangeStream({
      pipeline: [],
      tenant: { field: 'organizationId', value: 'org_a', authored: true },
    })
  ).toThrow('"tenant: authored" applies only to aggregation requests');
});
