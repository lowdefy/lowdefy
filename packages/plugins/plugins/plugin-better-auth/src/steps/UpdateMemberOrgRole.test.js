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

import { jest } from '@jest/globals';

import UpdateMemberOrgRole from './UpdateMemberOrgRole.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = {
  system: false,
  user: {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
    image: null,
    emailVerified: true,
    activeOrganizationId: 'org-1',
    role: 'admin',
  },
};
// The step floor resolves the target organization and passes the id in; the
// defaulting and tenant-policy rules are tested there, not here.
const organizationId = 'org-1';

test('UpdateMemberOrgRole calls updateMemberRole with the memberId, organizationId and role', async () => {
  const updateMemberRole = jest.fn().mockResolvedValue({ member: { id: 'member-1' } });
  const { auth } = createMockAuth({ organizationEndpoints: { updateMemberRole } });
  const result = await UpdateMemberOrgRole({
    acting,
    auth,
    organizationId,
    properties: { memberId: 'member-1', orgRole: 'admin' },
  });
  expect(result).toEqual({ member: { id: 'member-1' } });
  expect(updateMemberRole.mock.calls[0][0].body).toEqual({
    memberId: 'member-1',
    organizationId: 'org-1',
    role: 'admin',
  });
});

test('UpdateMemberOrgRole carries the real caller so the endpoint own member check runs', async () => {
  const updateMemberRole = jest.fn().mockResolvedValue({ member: { id: 'member-1' } });
  const { auth, authContext } = createMockAuth({
    adapter: { findOne: jest.fn() },
    organizationEndpoints: { updateMemberRole },
  });
  await UpdateMemberOrgRole({
    acting,
    auth,
    organizationId,
    properties: { memberId: 'member-1', orgRole: 'admin' },
  });
  const { context } = updateMemberRole.mock.calls[0][0];
  expect(context.session.user.id).toEqual('user-1');
  expect(context.session.user.role).toEqual('admin');
  expect(context.session.session.activeOrganizationId).toEqual('org-1');
  // The real adapter, so the endpoint resolves the caller's real member row
  // rather than a fabricated one.
  expect(context.adapter).toBe(authContext.adapter);
});

test('UpdateMemberOrgRole scopes the write to the organizationId passed by the floor', async () => {
  const updateMemberRole = jest.fn().mockResolvedValue({ member: { id: 'member-1' } });
  const { auth } = createMockAuth({ organizationEndpoints: { updateMemberRole } });
  await UpdateMemberOrgRole({
    acting,
    auth,
    organizationId: 'org-explicit',
    properties: { memberId: 'member-1', orgRole: 'admin' },
  });
  expect(updateMemberRole.mock.calls[0][0].body.organizationId).toBe('org-explicit');
});

test('UpdateMemberOrgRole sends orgRole "member" unchanged to revoke the org tier', async () => {
  const updateMemberRole = jest.fn().mockResolvedValue({ member: { id: 'member-1' } });
  const { auth } = createMockAuth({ organizationEndpoints: { updateMemberRole } });
  await UpdateMemberOrgRole({
    acting,
    auth,
    organizationId,
    properties: { memberId: 'member-1', orgRole: 'member' },
  });
  expect(updateMemberRole.mock.calls[0][0].body.role).toBe('member');
});

test('UpdateMemberOrgRole writes no field other than the org tier', async () => {
  const updateMemberRole = jest.fn().mockResolvedValue({ member: { id: 'member-1' } });
  const update = jest.fn();
  const { auth } = createMockAuth({
    adapter: { update },
    organizationEndpoints: { updateMemberRole },
  });
  await UpdateMemberOrgRole({
    acting,
    auth,
    organizationId,
    properties: { appRoles: ['branch-manager'], memberId: 'member-1', orgRole: 'admin' },
  });
  expect(update).not.toHaveBeenCalled();
  expect(updateMemberRole.mock.calls[0][0].body).toEqual({
    memberId: 'member-1',
    organizationId: 'org-1',
    role: 'admin',
  });
});

test('UpdateMemberOrgRole throws when memberId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberOrgRole({ acting, auth, organizationId, properties: { orgRole: 'admin' } })
  ).rejects.toThrow('UpdateMemberOrgRole requires a "memberId" property.');
});

test('UpdateMemberOrgRole throws when orgRole property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberOrgRole({ acting, auth, organizationId, properties: { memberId: 'member-1' } })
  ).rejects.toThrow(
    'UpdateMemberOrgRole requires an "orgRole" string property. Received undefined.'
  );
});

test('UpdateMemberOrgRole throws naming the value when orgRole is not a string', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberOrgRole({
      acting,
      auth,
      organizationId,
      properties: { memberId: 'member-1', orgRole: ['admin'] },
    })
  ).rejects.toThrow(
    'UpdateMemberOrgRole requires an "orgRole" string property. Received ["admin"].'
  );
});

test('UpdateMemberOrgRole surfaces the endpoint rejection of an unregistered role name', async () => {
  const apiError = new Error('generic');
  apiError.status = 'BAD_REQUEST';
  apiError.body = {
    code: 'ROLE_NOT_FOUND',
    message: 'ROLE_NOT_FOUND: branch-manager',
  };
  const updateMemberRole = jest.fn().mockRejectedValue(apiError);
  const { auth } = createMockAuth({ organizationEndpoints: { updateMemberRole } });
  // The step holds no allowlist of its own - validStaticRoles in the endpoint is
  // the only place a role name is checked.
  await expect(
    UpdateMemberOrgRole({
      acting,
      auth,
      organizationId,
      properties: { memberId: 'member-1', orgRole: 'branch-manager' },
    })
  ).rejects.toThrow('ROLE_NOT_FOUND: branch-manager');
  expect(updateMemberRole.mock.calls[0][0].body.role).toBe('branch-manager');
});
