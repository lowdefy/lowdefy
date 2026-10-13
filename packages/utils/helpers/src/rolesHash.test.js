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

import { createHash } from 'node:crypto';

import rolesHash from './rolesHash.js';

test('rolesHash is the stamp hash of the sorted app roles and organization role tier', () => {
  expect(rolesHash({ user: { roles: ['editor', 'admin'] } })).toBe('228d50a09b1b1e2b');
  expect(rolesHash({ user: { roles: ['editor', 'admin'], org_roles: ['member'] } })).toBe(
    createHash('sha256')
      .update('{"roles":["admin","editor"],"org_roles":["member"]}')
      .digest('hex')
      .slice(0, 16)
  );
});

test('rolesHash hashes a caller with no roles as empty lists', () => {
  expect(rolesHash({ user: { roles: [], org_roles: [] } })).toBe(rolesHash({ user: {} }));
});

test('rolesHash changes when only the organization role tier changes', () => {
  const member = rolesHash({ user: { roles: ['editor'], org_roles: ['member'] } });
  const admin = rolesHash({ user: { roles: ['editor'], org_roles: ['admin'] } });
  expect(member).not.toBe(admin);
});

test('rolesHash does not mistake an app role for an organization role', () => {
  expect(rolesHash({ user: { roles: ['admin'], org_roles: [] } })).not.toBe(
    rolesHash({ user: { roles: [], org_roles: ['admin'] } })
  );
});

test('rolesHash does not reorder the caller roles', () => {
  const roles = ['editor', 'admin'];
  const orgRoles = ['owner', 'admin'];
  rolesHash({ user: { roles, org_roles: orgRoles } });
  expect(roles).toEqual(['editor', 'admin']);
  expect(orgRoles).toEqual(['owner', 'admin']);
});
