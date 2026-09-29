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

import TenantIntegrityError from './TenantIntegrityError.js';
import lowdefyErrorNames from './lowdefyErrorNames.js';

test('TenantIntegrityError sets name and isLowdefyError', () => {
  const error = new TenantIntegrityError('bad row');
  expect(error.name).toBe('TenantIntegrityError');
  expect(error.isLowdefyError).toBe(true);
  expect(error instanceof Error).toBe(true);
  expect(error.message).toBe('bad row');
  expect(error.collection).toBeNull();
  expect(error.endpointId).toBeNull();
});

test('TenantIntegrityError stores its fields and cause', () => {
  const cause = new Error('inner');
  const error = new TenantIntegrityError('bad row', {
    cause,
    collection: 'contacts',
    connectionId: 'contacts_conn',
    organizationId: 'org_a',
    field: 'organization_id',
    endpointId: 'save',
  });
  expect(error.cause).toBe(cause);
  expect(error.collection).toBe('contacts');
  expect(error.connectionId).toBe('contacts_conn');
  expect(error.organizationId).toBe('org_a');
  expect(error.field).toBe('organization_id');
  expect(error.endpointId).toBe('save');
});

test('TenantIntegrityError is a registered Lowdefy error name', () => {
  expect(lowdefyErrorNames.has('TenantIntegrityError')).toBe(true);
});
