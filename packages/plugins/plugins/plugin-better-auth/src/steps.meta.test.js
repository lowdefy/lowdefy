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

import * as steps from './steps.js';

// The whole authority map, written out so a new step arrives with a declaration
// or fails here - the floor that reads meta.authority has no fallback for a step
// that declares nothing, and an undeclared step must not reach it.
const authorities = {
  BanUser: { scope: 'org', permissions: { user: ['ban'] }, targetUser: 'userId' },
  CancelInvitation: { scope: 'org', permissions: { invitation: ['cancel'] } },
  CreateOrganization: { scope: 'system' },
  DeleteUser: { scope: 'org', permissions: { user: ['delete'] }, targetUser: 'userId' },
  InviteMember: { scope: 'org', permissions: { invitation: ['create'] } },
  ListMembers: { scope: 'org', permissions: { member: ['list'] } },
  ListUsers: { scope: 'system' },
  RemoveMember: { scope: 'org', permissions: { member: ['delete'] } },
  ResetUserTwoFactor: {
    scope: 'org',
    permissions: { user: ['reset-two-factor'] },
    targetUser: 'userId',
  },
  RevokeUserPasskeys: {
    scope: 'org',
    permissions: { user: ['revoke-passkeys'] },
    targetUser: 'userId',
  },
  RevokeUserSessions: { scope: 'org', permissions: { session: ['revoke'] }, targetUser: 'userId' },
  UnbanUser: { scope: 'org', permissions: { user: ['ban'] }, targetUser: 'userId' },
  UpdateMemberAttributes: { scope: 'org', permissions: { member: ['update'] } },
  UpdateMemberOrgRole: { scope: 'org', permissions: { member: ['update'] } },
  UpdateMemberRoles: { scope: 'org', permissions: { member: ['update'] } },
  UpdateOrganization: { scope: 'org', permissions: { organization: ['update'] } },
  UpdateUserAttributes: {
    scope: 'org',
    permissions: { user: ['set-attributes'] },
    targetUser: 'userId',
  },
  UpdateUserProfile: {
    scope: 'org',
    permissions: { user: ['update'] },
    targetUser: 'userId',
    selfTargetExempt: 'userId',
  },
};

const stepNames = Object.keys(steps).sort();

test('every step exported from steps.js appears in the authority map', () => {
  expect(stepNames).toEqual(Object.keys(authorities).sort());
});

test.each(stepNames)('%s declares exactly the authority the map gives it', (stepName) => {
  expect(steps[stepName].meta.authority).toEqual(authorities[stepName]);
});

test.each(stepNames)('%s declares an authority the floor can read', (stepName) => {
  const authority = steps[stepName].meta.authority;
  expect(typeof authority).toBe('object');
  expect(['org', 'system']).toContain(authority.scope);
  if (authority.scope === 'org') {
    expect(Object.keys(authority.permissions).length).toBeGreaterThan(0);
    Object.values(authority.permissions).forEach((actions) => {
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });
    return;
  }
  // A system step is authorized by being caller-less, so a permission on it
  // would be a permission nothing ever checks.
  expect(authority.permissions).toBeUndefined();
});

test('UpdateUserProfile is the only step exempting a self-targeted caller', () => {
  const exempting = stepNames.filter(
    (stepName) => steps[stepName].meta.authority.selfTargetExempt !== undefined
  );
  expect(exempting).toEqual(['UpdateUserProfile']);
});
