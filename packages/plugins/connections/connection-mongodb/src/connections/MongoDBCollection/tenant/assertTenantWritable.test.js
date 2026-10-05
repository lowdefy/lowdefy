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

import assertTenantWritable from './assertTenantWritable.js';

test('assertTenantWritable refuses a write under the read-only tenant: none guard', () => {
  expect(() =>
    assertTenantWritable({
      tenantGuard: { field: 'organization_id', readOnly: true },
      requestType: 'MongoDBInsertOne',
    })
  ).toThrow(
    'MongoDBInsertOne writes, and a request with tenant: none may only read. To write rows of one organization from a system run, call an endpoint with a CallApi step that names the "organization"'
  );
});

test.each([
  ['no guard', null],
  ['the write guard of a shared connection', { field: 'organization_id', readOnly: false }],
])('assertTenantWritable lets a write through with %s', (_, tenantGuard) => {
  expect(() =>
    assertTenantWritable({ tenantGuard, requestType: 'MongoDBInsertOne' })
  ).not.toThrow();
});
