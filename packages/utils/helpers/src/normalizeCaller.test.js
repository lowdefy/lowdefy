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

import normalizeCaller from './normalizeCaller.js';

test('normalizeCaller snakes every camelCase top-level key', () => {
  const user = {
    emailVerified: true,
    activeOrganizationId: 'org_1',
    orgRoles: ['admin'],
    twoFactorEnrolled: false,
    authMethod: 'password',
    strategyId: 'strategy_1',
  };
  expect(normalizeCaller(user)).toEqual({
    email_verified: true,
    active_organization_id: 'org_1',
    org_roles: ['admin'],
    two_factor_enrolled: false,
    auth_method: 'password',
    strategy_id: 'strategy_1',
  });
});

test('normalizeCaller leaves already single-word keys unchanged', () => {
  const user = { id: '1', name: 'Jane', email: 'jane@example.com', image: 'x.png', roles: [] };
  expect(normalizeCaller(user)).toEqual(user);
});

test('normalizeCaller does not recurse into the attributes and profile bags', () => {
  const attributes = { appRegion: 'x' };
  const profile = { contactId: 'c' };
  const user = { attributes, profile };
  const normalized = normalizeCaller(user);
  expect(normalized).toEqual({ attributes: { appRegion: 'x' }, profile: { contactId: 'c' } });
  expect(normalized.attributes).toBe(attributes);
  expect(normalized.profile).toBe(profile);
});

test('normalizeCaller passes the roles array through by reference', () => {
  const roles = ['admin', 'user'];
  const normalized = normalizeCaller({ roles });
  expect(normalized.roles).toBe(roles);
});

test('normalizeCaller returns null unchanged', () => {
  expect(normalizeCaller(null)).toBe(null);
});

test('normalizeCaller returns undefined unchanged', () => {
  expect(normalizeCaller(undefined)).toBe(undefined);
});
