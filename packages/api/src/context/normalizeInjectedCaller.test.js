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

import normalizeInjectedCaller from './normalizeInjectedCaller.js';

test('normalizeInjectedCaller floors roles and attributes when absent', () => {
  expect(normalizeInjectedCaller({ id: 'x', name: 'X' })).toEqual({
    id: 'x',
    name: 'X',
    roles: [],
    attributes: {},
  });
});

test('normalizeInjectedCaller preserves existing roles and attributes', () => {
  expect(
    normalizeInjectedCaller({
      id: 'x',
      name: 'X',
      roles: ['admin'],
      attributes: { tenantId: 't1' },
    })
  ).toEqual({
    id: 'x',
    name: 'X',
    roles: ['admin'],
    attributes: { tenantId: 't1' },
  });
});

test('normalizeInjectedCaller does not synthesize profile or org fields', () => {
  const result = normalizeInjectedCaller({ id: 'x', name: 'X' });
  expect(result).not.toHaveProperty('profile');
  expect(result).not.toHaveProperty('activeOrganizationId');
  expect(result).not.toHaveProperty('organizationId');
});

test('normalizeInjectedCaller mirrors organizationId from activeOrganizationId', () => {
  const result = normalizeInjectedCaller({ id: 'x', activeOrganizationId: 'org_1' });
  expect(result.organizationId).toBe('org_1');
  expect(result.activeOrganizationId).toBe('org_1');
});

test('normalizeInjectedCaller mirrors activeOrganizationId from organizationId', () => {
  const result = normalizeInjectedCaller({ id: 'x', organizationId: 'org_1' });
  expect(result.organizationId).toBe('org_1');
  expect(result.activeOrganizationId).toBe('org_1');
});

test('normalizeInjectedCaller preserves an optional email', () => {
  expect(normalizeInjectedCaller({ id: 'x', name: 'X', email: 'x@example.com' })).toEqual({
    id: 'x',
    name: 'X',
    email: 'x@example.com',
    roles: [],
    attributes: {},
  });
});
