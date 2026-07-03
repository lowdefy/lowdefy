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

import UpdateMemberRoles from './UpdateMemberRoles.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

function createAdapter({ member, members }) {
  return {
    findOne: jest.fn().mockResolvedValue(member),
    findMany: jest.fn().mockResolvedValue(members),
  };
}

test('UpdateMemberRoles throws when demoting the only owner of an organization', async () => {
  const adapter = createAdapter({
    member: { id: 'member-1', organizationId: 'org-1', role: 'owner' },
    members: [
      { id: 'member-1', organizationId: 'org-1', role: 'owner' },
      { id: 'member-2', organizationId: 'org-1', role: 'member' },
    ],
  });
  const updateMemberRole = jest.fn();
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  await expect(
    UpdateMemberRoles({ acting, auth, properties: { memberId: 'member-1', role: 'member' } })
  ).rejects.toThrow('You cannot leave the organization without an owner.');
  expect(updateMemberRole).not.toHaveBeenCalled();
});

test('UpdateMemberRoles demotes an owner when another owner remains', async () => {
  const adapter = createAdapter({
    member: { id: 'member-1', organizationId: 'org-1', role: 'owner' },
    members: [
      { id: 'member-1', organizationId: 'org-1', role: 'owner' },
      { id: 'member-2', organizationId: 'org-1', role: 'admin,owner' },
    ],
  });
  const updateMemberRole = jest.fn().mockResolvedValue({ id: 'member-1', role: 'member' });
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  const result = await UpdateMemberRoles({
    acting,
    auth,
    properties: { memberId: 'member-1', role: 'member', organizationId: 'org-1' },
  });
  expect(result).toEqual({ id: 'member-1', role: 'member' });
  expect(updateMemberRole.mock.calls[0][0].body).toEqual({
    memberId: 'member-1',
    organizationId: 'org-1',
    role: 'member',
  });
});

test('UpdateMemberRoles passes through when the new role set keeps owner', async () => {
  const adapter = createAdapter({
    member: { id: 'member-1', organizationId: 'org-1', role: 'owner' },
    members: [{ id: 'member-1', organizationId: 'org-1', role: 'owner' }],
  });
  const updateMemberRole = jest.fn().mockResolvedValue({ id: 'member-1', role: 'owner,admin' });
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  await UpdateMemberRoles({
    acting,
    auth,
    properties: { memberId: 'member-1', role: ['owner', 'admin'] },
  });
  expect(adapter.findMany).not.toHaveBeenCalled();
  expect(updateMemberRole).toHaveBeenCalledTimes(1);
});

test('UpdateMemberRoles passes through when the target member is not an owner', async () => {
  const adapter = createAdapter({
    member: { id: 'member-2', organizationId: 'org-1', role: 'member' },
    members: [],
  });
  const updateMemberRole = jest.fn().mockResolvedValue({ id: 'member-2', role: 'admin' });
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  await UpdateMemberRoles({ acting, auth, properties: { memberId: 'member-2', role: 'admin' } });
  expect(adapter.findMany).not.toHaveBeenCalled();
  expect(updateMemberRole).toHaveBeenCalledTimes(1);
});

test('UpdateMemberRoles detects owner demotion in comma-separated role strings', async () => {
  const adapter = createAdapter({
    member: { id: 'member-1', organizationId: 'org-1', role: 'admin, owner' },
    members: [{ id: 'member-1', organizationId: 'org-1', role: 'admin, owner' }],
  });
  const updateMemberRole = jest.fn();
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  await expect(
    UpdateMemberRoles({ acting, auth, properties: { memberId: 'member-1', role: 'admin' } })
  ).rejects.toThrow('You cannot leave the organization without an owner.');
});

test('UpdateMemberRoles passes through when the member row is not found so the endpoint surfaces MEMBER_NOT_FOUND', async () => {
  const adapter = createAdapter({ member: null, members: [] });
  const apiError = new Error('generic');
  apiError.status = 'BAD_REQUEST';
  apiError.body = { code: 'MEMBER_NOT_FOUND', message: 'Member not found' };
  const updateMemberRole = jest.fn().mockRejectedValue(apiError);
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  await expect(
    UpdateMemberRoles({ acting, auth, properties: { memberId: 'missing', role: 'member' } })
  ).rejects.toThrow('Member not found');
});

test('UpdateMemberRoles throws when memberId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(UpdateMemberRoles({ acting, auth, properties: { role: 'member' } })).rejects.toThrow(
    'UpdateMemberRoles requires a "memberId" property.'
  );
});

test('UpdateMemberRoles throws when role property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberRoles({ acting, auth, properties: { memberId: 'member-1' } })
  ).rejects.toThrow('UpdateMemberRoles requires a "role" property.');
});
