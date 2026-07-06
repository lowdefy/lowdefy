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

import createAfterAcceptInvitationHook from './createAfterAcceptInvitationHook.js';
import { registerOrganizationBinding, setPinnedOrganization } from './getOrganizationBinding.js';

function createMockAuth({ userRow = { id: 'user_1' } } = {}) {
  const updateUser = jest.fn(async () => ({}));
  const update = jest.fn(async () => ({}));
  const findOne = jest.fn(async () => userRow);
  const auth = {
    $context: Promise.resolve({
      adapter: { findOne, update },
      internalAdapter: { updateUser },
    }),
  };
  return { auth, findOne, update, updateUser };
}

test('afterAcceptInvitationHook writes the invitation profile as the bag when the user has no profile', async () => {
  const { auth, findOne, update, updateUser } = createMockAuth({ userRow: { id: 'user_1' } });
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', profile: { contactId: 'contact_9' } },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(findOne).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_1' }],
  });
  expect(updateUser).toHaveBeenCalledWith('user_1', { profile: { contactId: 'contact_9' } });
  expect(update).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook shallow-merges the invitation profile with the invitation winning per key', async () => {
  const { auth, updateUser } = createMockAuth({
    userRow: { id: 'user_1', profile: { contactId: 'contact_old', locale: 'en' } },
  });
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', profile: { contactId: 'contact_9', plan: 'pro' } },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).toHaveBeenCalledWith('user_1', {
    profile: { contactId: 'contact_9', locale: 'en', plan: 'pro' },
  });
});

test('afterAcceptInvitationHook copies invitation attributes onto the minted member row', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });
  const attributes = { branch: 'north' };

  await hook({
    invitation: { id: 'inv_1', attributes },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { attributes },
  });
  expect(updateUser).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook merges profile and copies attributes when the invitation carries both', async () => {
  const { auth, update, updateUser } = createMockAuth({ userRow: { id: 'user_1' } });
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });
  const attributes = { branch: 'north' };

  await hook({
    invitation: { id: 'inv_1', profile: { contactId: 'contact_9' }, attributes },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).toHaveBeenCalledWith('user_1', { profile: { contactId: 'contact_9' } });
  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { attributes },
  });
});

test('afterAcceptInvitationHook does nothing when the invitation carries neither profile nor attributes', async () => {
  const { auth, findOne, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1' },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(findOne).not.toHaveBeenCalled();
  expect(updateUser).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook does not update the user when profile is not a plain object', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', profile: 'not-an-object' },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook does not update the member row when attributes is not a plain object', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', attributes: 'not-an-object' },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(update).not.toHaveBeenCalled();
  expect(updateUser).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook fails the accept in-band when the profile write fails', async () => {
  const { auth, updateUser } = createMockAuth();
  updateUser.mockRejectedValue(new Error('write failed'));
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await expect(
    hook({
      invitation: { id: 'inv_1', profile: { contactId: 'contact_9' } },
      member: { id: 'member_1' },
      user: { id: 'user_1' },
      organization: { id: 'org_1' },
    })
  ).rejects.toThrow('write failed');
});

// The user.role denormalization on accept - the minted member roles may
// include the configured user-admin role.
function createSyncMockAuth({ memberRow = null, userRow = { id: 'user_1' } } = {}) {
  const updateUser = jest.fn(async () => ({}));
  const update = jest.fn(async () => ({}));
  const findOne = jest.fn(async ({ model }) => {
    if (model === 'member') return memberRow;
    return userRow;
  });
  const auth = {
    $context: Promise.resolve({
      adapter: { findOne, update },
      internalAdapter: { updateUser },
    }),
  };
  registerOrganizationBinding({
    auth,
    database: true,
    organizations: { policy: 'pinned', org: 'org-a' },
  });
  setPinnedOrganization({
    auth,
    organization: { id: 'org_pinned', slug: 'org-a', name: 'Org A' },
    slug: 'org-a',
  });
  return { auth, findOne, update, updateUser };
}

test('afterAcceptInvitationHook sets user.role when the minted member role is the user-admin role', async () => {
  const { auth, update } = createSyncMockAuth({
    memberRow: { id: 'member_1', role: 'user-admin', userId: 'user_1' },
    userRow: { id: 'user_1', role: null },
  });
  const hook = createAfterAcceptInvitationHook({
    getAuth: () => auth,
    userAdminRole: 'user-admin',
  });

  await hook({
    invitation: { id: 'inv_1' },
    member: { id: 'member_1', role: 'user-admin' },
    user: { id: 'user_1' },
    organization: { id: 'org_pinned' },
  });

  expect(update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_1' }],
    update: { role: 'user-admin' },
  });
});

test('afterAcceptInvitationHook does not write user.role when the minted member role is not the user-admin role', async () => {
  const { auth, update } = createSyncMockAuth({
    memberRow: { id: 'member_1', role: 'member', userId: 'user_1' },
    userRow: { id: 'user_1', role: null },
  });
  const hook = createAfterAcceptInvitationHook({
    getAuth: () => auth,
    userAdminRole: 'user-admin',
  });

  await hook({
    invitation: { id: 'inv_1' },
    member: { id: 'member_1', role: 'member' },
    user: { id: 'user_1' },
    organization: { id: 'org_pinned' },
  });

  expect(update).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook skips the user.role sync when userAdminRole is not configured', async () => {
  const { auth, findOne, update } = createSyncMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth, userAdminRole: null });

  await hook({
    invitation: { id: 'inv_1' },
    member: { id: 'member_1', role: 'user-admin' },
    user: { id: 'user_1' },
    organization: { id: 'org_pinned' },
  });

  expect(findOne).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook fails the accept in-band when the user.role sync write fails', async () => {
  const { auth, update } = createSyncMockAuth({
    memberRow: { id: 'member_1', role: 'user-admin', userId: 'user_1' },
    userRow: { id: 'user_1', role: null },
  });
  update.mockRejectedValue(new Error('role write failed'));
  const hook = createAfterAcceptInvitationHook({
    getAuth: () => auth,
    userAdminRole: 'user-admin',
  });

  await expect(
    hook({
      invitation: { id: 'inv_1' },
      member: { id: 'member_1', role: 'user-admin' },
      user: { id: 'user_1' },
      organization: { id: 'org_pinned' },
    })
  ).rejects.toThrow('role write failed');
});
