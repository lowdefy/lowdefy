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

import createActingMemberAdapter from './createActingMemberAdapter.js';

const actingUser = {
  id: 'user-1',
  email: 'user1@example.com',
  name: 'User One',
  image: 'https://example.com/u1.png',
  role: 'admin',
};

test('createActingMemberAdapter returns a virtual member claiming the reserved $lowdefy-system role for the acting user member lookup', async () => {
  const findOne = jest.fn();
  const adapter = createActingMemberAdapter({ actingUser, adapter: { findOne } });
  const member = await adapter.findOne({
    model: 'member',
    where: [
      { field: 'userId', value: 'user-1' },
      { field: 'organizationId', value: 'org-1' },
    ],
    join: { user: true },
  });
  expect(findOne).not.toHaveBeenCalled();
  expect(member).toEqual({
    id: 'lowdefy:system-member',
    userId: 'user-1',
    organizationId: 'org-1',
    role: '$lowdefy-system',
    createdAt: expect.any(Date),
    user: {
      id: 'user-1',
      name: 'User One',
      email: 'user1@example.com',
      image: 'https://example.com/u1.png',
    },
  });
});

test('createActingMemberAdapter delegates member lookups for other users', async () => {
  const realMember = { id: 'member-9', userId: 'user-9', role: 'member' };
  const findOne = jest.fn().mockResolvedValue(realMember);
  const adapter = createActingMemberAdapter({ actingUser, adapter: { findOne } });
  const args = {
    model: 'member',
    where: [
      { field: 'userId', value: 'user-9' },
      { field: 'organizationId', value: 'org-1' },
    ],
  };
  const member = await adapter.findOne(args);
  expect(findOne).toHaveBeenCalledWith(args);
  expect(member).toBe(realMember);
});

test('createActingMemberAdapter delegates member lookups without an organizationId clause', async () => {
  const findOne = jest.fn().mockResolvedValue(null);
  const adapter = createActingMemberAdapter({ actingUser, adapter: { findOne } });
  const args = { model: 'member', where: [{ field: 'userId', value: 'user-1' }] };
  await adapter.findOne(args);
  expect(findOne).toHaveBeenCalledWith(args);
});

test('createActingMemberAdapter delegates lookups on other models', async () => {
  const realUser = { id: 'user-1' };
  const findOne = jest.fn().mockResolvedValue(realUser);
  const adapter = createActingMemberAdapter({ actingUser, adapter: { findOne } });
  const args = { model: 'user', where: [{ field: 'userId', value: 'user-1' }] };
  const user = await adapter.findOne(args);
  expect(findOne).toHaveBeenCalledWith(args);
  expect(user).toBe(realUser);
});

test('createActingMemberAdapter delegates all other adapter methods unchanged', async () => {
  const findMany = jest.fn().mockResolvedValue([{ id: 'row-1' }]);
  const create = jest.fn();
  const update = jest.fn();
  const deleteFn = jest.fn();
  const count = jest.fn();
  const adapter = createActingMemberAdapter({
    actingUser,
    adapter: { findOne: jest.fn(), findMany, create, update, delete: deleteFn, count },
  });
  expect(adapter.findMany).toBe(findMany);
  expect(adapter.create).toBe(create);
  expect(adapter.update).toBe(update);
  expect(adapter.delete).toBe(deleteFn);
  expect(adapter.count).toBe(count);
  await expect(adapter.findMany({ model: 'member' })).resolves.toEqual([{ id: 'row-1' }]);
});
