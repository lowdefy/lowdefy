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

import stampTenantOnLogRecord from './stampTenantOnLogRecord.js';

test('stampTenantOnLogRecord stamps the tenant field onto the record', () => {
  const record = { requestId: 'r1', type: 'MongoDBInsertOne' };
  expect(
    stampTenantOnLogRecord({ record, tenant: { field: 'organization_id', value: 'org_a' } })
  ).toEqual({ requestId: 'r1', type: 'MongoDBInsertOne', organization_id: 'org_a' });
});

test('stampTenantOnLogRecord returns the record unchanged when tenant is null', () => {
  const record = { requestId: 'r1', type: 'MongoDBInsertOne' };
  expect(stampTenantOnLogRecord({ record, tenant: null })).toBe(record);
});

test('stampTenantOnLogRecord stamps a custom tenant field', () => {
  const record = { requestId: 'r1' };
  expect(stampTenantOnLogRecord({ record, tenant: { field: 'tenantId', value: 't_1' } })).toEqual({
    requestId: 'r1',
    tenantId: 't_1',
  });
});

test('stampTenantOnLogRecord overrides a colliding record key with the verdict value', () => {
  const record = { requestId: 'r1', meta: { fromConfig: true } };
  expect(stampTenantOnLogRecord({ record, tenant: { field: 'meta', value: 'org_a' } })).toEqual({
    requestId: 'r1',
    meta: 'org_a',
  });
});
