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

import RevokeUserPasskeys from './RevokeUserPasskeys.js';
import createMockAuth from '../../test/createMockAuth.js';

function createAdapter({ deleted = 0 } = {}) {
  return {
    deleteMany: jest.fn().mockResolvedValue(deleted),
    update: jest.fn(),
  };
}

test('RevokeUserPasskeys deletes all passkeys keyed only on userId when no passkeyId is given', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await RevokeUserPasskeys({ auth, properties: { userId: 'u1' } });
  expect(adapter.deleteMany).toHaveBeenCalledTimes(1);
  expect(adapter.deleteMany).toHaveBeenCalledWith({
    model: 'passkey',
    where: [{ field: 'userId', value: 'u1' }],
  });
});

test('RevokeUserPasskeys keeps the userId clause alongside passkeyId when one row is named', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await RevokeUserPasskeys({ auth, properties: { userId: 'u1', passkeyId: 'p1' } });
  // Both clauses are load-bearing: userId bounds the delete to this authorised
  // user, passkeyId narrows it to the one credential. Deleting by id alone would
  // let a caller authorised for u1 delete another user's passkey.
  expect(adapter.deleteMany).toHaveBeenCalledWith({
    model: 'passkey',
    where: [
      { field: 'userId', value: 'u1' },
      { field: 'id', value: 'p1' },
    ],
  });
});

test('RevokeUserPasskeys returns whatever deleteMany resolves, including 0, unchanged', async () => {
  const zero = await RevokeUserPasskeys({
    auth: createMockAuth({ adapter: createAdapter({ deleted: 0 }) }).auth,
    properties: { userId: 'u1' },
  });
  const one = await RevokeUserPasskeys({
    auth: createMockAuth({ adapter: createAdapter({ deleted: 1 }) }).auth,
    properties: { userId: 'u1' },
  });
  const three = await RevokeUserPasskeys({
    auth: createMockAuth({ adapter: createAdapter({ deleted: 3 }) }).auth,
    properties: { userId: 'u1' },
  });
  expect(zero).toBe(0);
  expect(one).toBe(1);
  expect(three).toBe(3);
});

test('RevokeUserPasskeys does not throw when the user holds no passkeys', async () => {
  const adapter = createAdapter({ deleted: 0 });
  const { auth } = createMockAuth({ adapter });
  await expect(RevokeUserPasskeys({ auth, properties: { userId: 'u1' } })).resolves.toBe(0);
});

test('RevokeUserPasskeys throws and makes no adapter call when userId is missing', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await expect(RevokeUserPasskeys({ auth, properties: {} })).rejects.toThrow(
    'RevokeUserPasskeys requires a "userId" property.'
  );
  expect(adapter.deleteMany).not.toHaveBeenCalled();
});

test('RevokeUserPasskeys treats passkeyId: null as omitted, deleting all with one clause', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await RevokeUserPasskeys({ auth, properties: { userId: 'u1', passkeyId: null } });
  expect(adapter.deleteMany).toHaveBeenCalledWith({
    model: 'passkey',
    where: [{ field: 'userId', value: 'u1' }],
  });
});

test('RevokeUserPasskeys treats passkeyId: undefined as omitted, deleting all with one clause', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await RevokeUserPasskeys({ auth, properties: { userId: 'u1', passkeyId: undefined } });
  expect(adapter.deleteMany).toHaveBeenCalledWith({
    model: 'passkey',
    where: [{ field: 'userId', value: 'u1' }],
  });
});

test('RevokeUserPasskeys touches only the passkey model', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await RevokeUserPasskeys({ auth, properties: { userId: 'u1', passkeyId: 'p1' } });
  adapter.deleteMany.mock.calls.forEach(([args]) => {
    expect(args.model).toBe('passkey');
    expect(args.model).not.toBe('user');
    expect(args.model).not.toBe('session');
    expect(args.model).not.toBe('twoFactor');
  });
  expect(adapter.update).not.toHaveBeenCalled();
});

test('RevokeUserPasskeys.meta.authority declares org revoke-passkeys authority targeting userId', () => {
  expect(RevokeUserPasskeys.meta.authority).toEqual({
    scope: 'org',
    permissions: { user: ['revoke-passkeys'] },
    targetUser: 'userId',
  });
});
