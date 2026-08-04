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
const organization = {
  policy: 'pinned',
  pinned: { id: 'org_pinned', slug: 'org-a', name: 'org-a' },
};
// The step floor resolves the target organization and passes the id in; the
// defaulting and tenant-policy rules are tested there, not here.
const organizationId = 'org_pinned';

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
    UpdateMemberRoles({
      acting,
      auth,
      organization,
      organizationId,
      properties: { memberId: 'member-1', role: 'member' },
    })
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
    organization,
    organizationId: 'org-1',
    properties: { memberId: 'member-1', role: 'member' },
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
    organization,
    organizationId,
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
  await UpdateMemberRoles({
    acting,
    auth,
    organization,
    organizationId,
    properties: { memberId: 'member-2', role: 'admin' },
  });
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
    UpdateMemberRoles({
      acting,
      auth,
      organization,
      organizationId,
      properties: { memberId: 'member-1', role: 'admin' },
    })
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
    UpdateMemberRoles({
      acting,
      auth,
      organization,
      organizationId,
      properties: { memberId: 'missing', role: 'member' },
    })
  ).rejects.toThrow('Member not found');
});

test('UpdateMemberRoles scopes the last-owner guard lookup to the resolved organization', async () => {
  const adapter = createAdapter({
    member: { id: 'member-1', organizationId: 'org-1', role: 'owner' },
    members: [{ id: 'member-1', organizationId: 'org-1', role: 'owner' }],
  });
  const updateMemberRole = jest.fn();
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  await expect(
    UpdateMemberRoles({
      acting,
      auth,
      organization,
      organizationId,
      properties: { memberId: 'member-1', role: 'member' },
    })
  ).rejects.toThrow('You cannot leave the organization without an owner.');
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'id', value: 'member-1' },
      { field: 'organizationId', value: 'org_pinned' },
    ],
  });
});

test('UpdateMemberRoles throws when memberId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberRoles({
      acting,
      auth,
      organization,
      organizationId,
      properties: { role: 'member' },
    })
  ).rejects.toThrow('UpdateMemberRoles requires a "memberId" property.');
});

test('UpdateMemberRoles throws when role property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberRoles({
      acting,
      auth,
      organization,
      organizationId,
      properties: { memberId: 'member-1' },
    })
  ).rejects.toThrow('UpdateMemberRoles requires a "role" property.');
});

// user.role denormalization sync - findOne dispatches on model and where
// shape: the step's member prefetch queries by id, the sync queries the
// pinned membership by userId, then the user row.
function createSyncAdapter({ memberById, memberByUserId, userRow }) {
  const findOne = jest.fn(async ({ model, where }) => {
    if (model === 'member' && where.some((w) => w.field === 'id')) return memberById;
    if (model === 'member' && where.some((w) => w.field === 'userId')) return memberByUserId;
    if (model === 'user') return userRow;
    return null;
  });
  const update = jest.fn(async () => ({}));
  return { findOne, findMany: jest.fn().mockResolvedValue([]), update };
}

test('UpdateMemberRoles writes user.role when the granted roles include the user-admin role', async () => {
  const adapter = createSyncAdapter({
    memberById: { id: 'member-2', organizationId: 'org_pinned', role: 'member', userId: 'user_9' },
    memberByUserId: {
      id: 'member-2',
      organizationId: 'org_pinned',
      role: 'user-admin',
      userId: 'user_9',
    },
    userRow: { id: 'user_9', role: null },
  });
  const updateMemberRole = jest
    .fn()
    .mockResolvedValue({ id: 'member-2', role: 'user-admin', userId: 'user_9' });
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });

  await UpdateMemberRoles({
    acting,
    auth,
    organization,
    organizationId,
    properties: { memberId: 'member-2', role: 'user-admin' },
    userAdminRole: 'user-admin',
  });

  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_9' }],
    update: { role: 'user-admin' },
  });
});

test('UpdateMemberRoles clears user.role when the new roles drop the user-admin role', async () => {
  const adapter = createSyncAdapter({
    memberById: {
      id: 'member-2',
      organizationId: 'org_pinned',
      role: 'user-admin',
      userId: 'user_9',
    },
    memberByUserId: {
      id: 'member-2',
      organizationId: 'org_pinned',
      role: 'member',
      userId: 'user_9',
    },
    userRow: { id: 'user_9', role: 'user-admin' },
  });
  const updateMemberRole = jest
    .fn()
    .mockResolvedValue({ id: 'member-2', role: 'member', userId: 'user_9' });
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });

  await UpdateMemberRoles({
    acting,
    auth,
    organization,
    organizationId,
    properties: { memberId: 'member-2', role: 'member' },
    userAdminRole: 'user-admin',
  });

  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_9' }],
    update: { role: null },
  });
});

test('UpdateMemberRoles does not touch user.role when no user-admin role is configured', async () => {
  const adapter = createSyncAdapter({
    memberById: { id: 'member-2', organizationId: 'org_pinned', role: 'member', userId: 'user_9' },
    memberByUserId: null,
    userRow: null,
  });
  const updateMemberRole = jest
    .fn()
    .mockResolvedValue({ id: 'member-2', role: 'admin', userId: 'user_9' });
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });

  await UpdateMemberRoles({
    acting,
    auth,
    organization,
    organizationId,
    properties: { memberId: 'member-2', role: 'admin' },
  });

  expect(adapter.update).not.toHaveBeenCalled();
});
