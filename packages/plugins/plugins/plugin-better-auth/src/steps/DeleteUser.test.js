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

import DeleteUser from './DeleteUser.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

const user = { id: 'user-2', email: 'user2@example.com', name: 'User Two' };
const members = [
  { id: 'member-1', userId: 'user-2', organizationId: 'org-1' },
  { id: 'member-2', userId: 'user-2', organizationId: 'org-2' },
];
const invitations = [{ id: 'invitation-1', email: 'user2@example.com', status: 'pending' }];

function createCascadeMocks() {
  const calls = [];
  const adapter = {
    findOne: jest.fn(async ({ model }) => {
      calls.push(`findOne:${model}`);
      if (model === 'user') return user;
      return null;
    }),
    findMany: jest.fn(async ({ model }) => {
      calls.push(`findMany:${model}`);
      if (model === 'member') return members;
      if (model === 'invitation') return invitations;
      return [];
    }),
    delete: jest.fn(async ({ model, where }) => {
      calls.push(`delete:${model}:${where[0].value}`);
    }),
  };
  const removeUser = jest.fn(async () => {
    calls.push('removeUser');
    return { success: true };
  });
  return { adapter, calls, removeUser };
}

test('DeleteUser cascade calls removeUser then deletes member rows and pending invitations', async () => {
  const { adapter, calls, removeUser } = createCascadeMocks();
  const { auth } = createMockAuth({ adapter, adminEndpoints: { removeUser } });
  const result = await DeleteUser({ acting, auth, properties: { userId: 'user-2' } });
  expect(removeUser.mock.calls[0][0].body).toEqual({ userId: 'user-2' });
  expect(calls).toEqual([
    'findOne:user',
    'removeUser',
    'findMany:member',
    'delete:member:member-1',
    'delete:member:member-2',
    'findMany:invitation',
    'delete:invitation:invitation-1',
  ]);
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'userId', value: 'user-2' }],
  });
  // Pending invitations are matched by the deleted user's email.
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'email', value: 'user2@example.com' },
      { field: 'status', value: 'pending' },
    ],
  });
  expect(result).toEqual({ success: true, user, members, invitations });
});

test('DeleteUser leaves the app-owned contact untouched', async () => {
  const { adapter, removeUser } = createCascadeMocks();
  const { auth } = createMockAuth({ adapter, adminEndpoints: { removeUser } });
  await DeleteUser({ acting, auth, properties: { userId: 'user-2' } });
  const models = [
    ...adapter.findOne.mock.calls,
    ...adapter.findMany.mock.calls,
    ...adapter.delete.mock.calls,
  ].map(([args]) => args.model);
  expect(models).not.toContain('contact');
});

test('DeleteUser throws when the user does not exist', async () => {
  const adapter = { findOne: jest.fn().mockResolvedValue(null) };
  const removeUser = jest.fn();
  const { auth } = createMockAuth({ adapter, adminEndpoints: { removeUser } });
  await expect(DeleteUser({ acting, auth, properties: { userId: 'missing' } })).rejects.toThrow(
    'DeleteUser found no user with id "missing".'
  );
  expect(removeUser).not.toHaveBeenCalled();
});

test('DeleteUser throws when userId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(DeleteUser({ acting, auth, properties: {} })).rejects.toThrow(
    'DeleteUser requires a "userId" property.'
  );
});
