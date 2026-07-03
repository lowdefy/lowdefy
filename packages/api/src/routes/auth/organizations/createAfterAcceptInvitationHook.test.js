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

function createMockAuth() {
  const updateUser = jest.fn(async () => ({}));
  const update = jest.fn(async () => ({}));
  const auth = {
    $context: Promise.resolve({
      adapter: { update },
      internalAdapter: { updateUser },
    }),
  };
  return { auth, update, updateUser };
}

test('afterAcceptInvitationHook stamps the invitation contactId onto the accepting user', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1', contactId: 'contact_9' },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).toHaveBeenCalledWith('user_1', { contactId: 'contact_9' });
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

test('afterAcceptInvitationHook stamps contactId and copies attributes when the invitation carries both', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });
  const attributes = { branch: 'north' };

  await hook({
    invitation: { id: 'inv_1', contactId: 'contact_9', attributes },
    member: { id: 'member_1' },
    user: { id: 'user_1' },
    organization: { id: 'org_1' },
  });

  expect(updateUser).toHaveBeenCalledWith('user_1', { contactId: 'contact_9' });
  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { attributes },
  });
});

test('afterAcceptInvitationHook does nothing when the invitation carries neither contactId nor attributes', async () => {
  const { auth, update, updateUser } = createMockAuth();
  const hook = createAfterAcceptInvitationHook({ getAuth: () => auth });

  await hook({
    invitation: { id: 'inv_1' },
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
