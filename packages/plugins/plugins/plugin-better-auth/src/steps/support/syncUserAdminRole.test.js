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

import syncUserAdminRole from './syncUserAdminRole.js';

const organization = {
  policy: 'pinned',
  pinned: { id: 'org_pinned', slug: 'org-a', name: 'org-a' },
};

function createMockAuth({ memberRow = null, userRow = null } = {}) {
  const findOne = jest.fn(async ({ model }) => {
    if (model === 'member') return memberRow;
    if (model === 'user') return userRow;
    return null;
  });
  const update = jest.fn(async () => ({}));
  const auth = { $context: Promise.resolve({ adapter: { findOne, update } }) };
  return { auth, findOne, update };
}

test('syncUserAdminRole writes user.role when the pinned member roles include the user-admin role', async () => {
  const { auth, findOne, update } = createMockAuth({
    memberRow: { id: 'member_1', role: 'member,user-admin', userId: 'user_1' },
    userRow: { id: 'user_1', role: null },
  });

  await syncUserAdminRole({ auth, organization, userAdminRole: 'user-admin', userId: 'user_1' });

  expect(findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'org_pinned' },
    ],
  });
  expect(update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_1' }],
    update: { role: 'user-admin' },
  });
});

test('syncUserAdminRole clears user.role when the pinned member roles no longer include the user-admin role', async () => {
  const { auth, update } = createMockAuth({
    memberRow: { id: 'member_1', role: 'member', userId: 'user_1' },
    userRow: { id: 'user_1', role: 'user-admin' },
  });

  await syncUserAdminRole({ auth, organization, userAdminRole: 'user-admin', userId: 'user_1' });

  expect(update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_1' }],
    update: { role: null },
  });
});

test('syncUserAdminRole clears user.role when the pinned membership is gone', async () => {
  const { auth, update } = createMockAuth({
    memberRow: null,
    userRow: { id: 'user_1', role: 'user-admin' },
  });

  await syncUserAdminRole({ auth, organization, userAdminRole: 'user-admin', userId: 'user_1' });

  expect(update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_1' }],
    update: { role: null },
  });
});

test('syncUserAdminRole skips the write when user.role already matches', async () => {
  const { auth, update } = createMockAuth({
    memberRow: { id: 'member_1', role: 'user-admin', userId: 'user_1' },
    userRow: { id: 'user_1', role: 'user-admin' },
  });

  await syncUserAdminRole({ auth, organization, userAdminRole: 'user-admin', userId: 'user_1' });

  expect(update).not.toHaveBeenCalled();
});

test('syncUserAdminRole leaves a foreign user.role value alone when the role is lost', async () => {
  const { auth, update } = createMockAuth({
    memberRow: { id: 'member_1', role: 'member', userId: 'user_1' },
    userRow: { id: 'user_1', role: 'admin' },
  });

  await syncUserAdminRole({ auth, organization, userAdminRole: 'user-admin', userId: 'user_1' });

  expect(update).not.toHaveBeenCalled();
});

test('syncUserAdminRole does nothing when userAdminRole is not configured', async () => {
  const { auth, findOne, update } = createMockAuth();

  await syncUserAdminRole({ auth, organization, userAdminRole: undefined, userId: 'user_1' });

  expect(findOne).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('syncUserAdminRole does nothing when userId is not resolved', async () => {
  const { auth, findOne, update } = createMockAuth();

  await syncUserAdminRole({ auth, organization, userAdminRole: 'user-admin', userId: undefined });

  expect(findOne).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('syncUserAdminRole does nothing under the tenant organizations policy', async () => {
  const { auth, findOne, update } = createMockAuth();

  await syncUserAdminRole({
    auth,
    organization: { policy: 'tenant', pinned: null },
    userAdminRole: 'user-admin',
    userId: 'user_1',
  });

  expect(findOne).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('syncUserAdminRole throws when the pinned organization is not resolved', async () => {
  const { auth } = createMockAuth();

  await expect(
    syncUserAdminRole({
      auth,
      organization: { policy: 'pinned', pinned: null },
      userAdminRole: 'user-admin',
      userId: 'user_1',
    })
  ).rejects.toThrow(
    'Could not sync the user-admin role - the pinned organization is not resolved.'
  );
});

test('syncUserAdminRole does nothing when the user row is gone', async () => {
  const { auth, update } = createMockAuth({
    memberRow: { id: 'member_1', role: 'user-admin', userId: 'user_1' },
    userRow: null,
  });

  await syncUserAdminRole({ auth, organization, userAdminRole: 'user-admin', userId: 'user_1' });

  expect(update).not.toHaveBeenCalled();
});
