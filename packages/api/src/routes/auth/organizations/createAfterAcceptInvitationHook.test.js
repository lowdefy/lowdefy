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
    invitation: { id: 'inv_1', profile: { plan: 'pro' } },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(findOne).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_1' }],
  });
  expect(updateUser).toHaveBeenCalledWith('user_1', { profile: { plan: 'pro' } });
  expect(update).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook shallow-merges the invitation profile with the invitation winning per key', async () => {
  const { auth, updateUser } = createMockAuth({
    userRow: { id: 'user_1', profile: { theme: 'light', locale: 'en' } },
  });
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', profile: { theme: 'dark', plan: 'pro' } },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).toHaveBeenCalledWith('user_1', {
    profile: { theme: 'dark', locale: 'en', plan: 'pro' },
  });
});

test('afterAcceptInvitationHook copies the invitation contactId onto the user row', async () => {
  const { auth, findOne, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', contactId: 'contact_9' },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  // A top-level set needs no merge base, so the contactId-only copy reads no row.
  expect(findOne).not.toHaveBeenCalled();
  expect(updateUser).toHaveBeenCalledWith('user_1', { contactId: 'contact_9' });
  expect(update).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook copies contactId and merges profile in a single user update', async () => {
  const { auth, updateUser } = createMockAuth({
    userRow: { id: 'user_1', profile: { locale: 'en' } },
  });
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', contactId: 'contact_9', profile: { plan: 'pro' } },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).toHaveBeenCalledTimes(1);
  expect(updateUser).toHaveBeenCalledWith('user_1', {
    profile: { locale: 'en', plan: 'pro' },
    contactId: 'contact_9',
  });
});

test('afterAcceptInvitationHook does not write contactId when the invitation carries a non-string', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', contactId: { id: 'contact_9' } },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
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

// The silent-drop case the widened guard exists for: an app that does not use
// member attributes carries roles and nothing else on every invitation.
test('afterAcceptInvitationHook copies invitation appRoles onto the minted member row when the invitation carries no attributes', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', appRoles: ['branch-manager'] },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { appRoles: ['branch-manager'] },
  });
  expect(updateUser).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook copies attributes and appRoles in a single member update', async () => {
  const { auth, update } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });
  const attributes = { branch: 'north' };

  await hook({
    invitation: { id: 'inv_1', attributes, appRoles: ['branch-manager'] },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { attributes, appRoles: ['branch-manager'] },
  });
});

test('afterAcceptInvitationHook copies an empty appRoles array, which is distinct from an absent field', async () => {
  const { auth, update } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', appRoles: [] },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { appRoles: [] },
  });
});

test('afterAcceptInvitationHook merges profile and copies attributes when the invitation carries both', async () => {
  const { auth, update, updateUser } = createMockAuth({ userRow: { id: 'user_1' } });
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });
  const attributes = { branch: 'north' };

  await hook({
    invitation: { id: 'inv_1', profile: { plan: 'pro' }, attributes },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).toHaveBeenCalledWith('user_1', { profile: { plan: 'pro' } });
  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { attributes },
  });
});

test('afterAcceptInvitationHook does nothing when the invitation carries no profile, contactId, attributes or appRoles', async () => {
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

// The minted member row's org tier is BetterAuth's business alone - the accept
// denormalizes nothing onto the user row, whatever role the invitation carried.
test('afterAcceptInvitationHook writes nothing to the user row when the minted member is an org admin', async () => {
  const { auth, findOne, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', role: 'admin' },
    member: { id: 'member_1', role: 'admin', userId: 'user_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(findOne).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
  expect(updateUser).not.toHaveBeenCalled();
});

test('afterAcceptInvitationHook fails the accept in-band when the profile write fails', async () => {
  const { auth, updateUser } = createMockAuth();
  updateUser.mockRejectedValue(new Error('write failed'));
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await expect(
    hook({
      invitation: { id: 'inv_1', profile: { plan: 'pro' } },
      member: { id: 'member_1' },
      user: { id: 'user_1' },
      organization: { id: 'org_1' },
    })
  ).rejects.toThrow('write failed');
});
