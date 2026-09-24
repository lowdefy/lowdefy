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

import ResetUserTwoFactor from './ResetUserTwoFactor.js';
import createMockAuth from '../../test/createMockAuth.js';

function createAdapter({ user = { id: 'u1', twoFactorEnabled: false } } = {}) {
  return {
    deleteMany: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(user),
  };
}

test('ResetUserTwoFactor fires the three writes in order with exact arguments', async () => {
  const calls = [];
  const user = { id: 'u1', twoFactorEnabled: false };
  const adapter = {
    deleteMany: jest.fn((args) => {
      calls.push(['deleteMany', args]);
      return Promise.resolve(undefined);
    }),
    update: jest.fn((args) => {
      calls.push(['update', args]);
      return Promise.resolve(user);
    }),
  };
  const { auth } = createMockAuth({ adapter });

  const result = await ResetUserTwoFactor({ auth, properties: { userId: 'u1' } });

  expect(result).toBe(user);
  expect(calls).toEqual([
    ['deleteMany', { model: 'twoFactor', where: [{ field: 'userId', value: 'u1' }] }],
    [
      'update',
      {
        model: 'user',
        where: [{ field: 'id', value: 'u1' }],
        update: { twoFactorEnabled: false },
      },
    ],
    [
      'deleteMany',
      {
        model: 'verification',
        where: [
          { field: 'value', value: 'u1' },
          { field: 'identifier', value: 'trust-device-', operator: 'starts_with' },
        ],
      },
    ],
  ]);
});

test('ResetUserTwoFactor deletes the twoFactor row keyed only on userId', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await ResetUserTwoFactor({ auth, properties: { userId: 'u1' } });
  expect(adapter.deleteMany).toHaveBeenCalledWith({
    model: 'twoFactor',
    where: [{ field: 'userId', value: 'u1' }],
  });
});

test('ResetUserTwoFactor clears twoFactorEnabled on the user row', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await ResetUserTwoFactor({ auth, properties: { userId: 'u1' } });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'u1' }],
    update: { twoFactorEnabled: false },
  });
});

test('ResetUserTwoFactor deletes trust-device verification rows with BOTH where clauses', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await ResetUserTwoFactor({ auth, properties: { userId: 'u1' } });

  const verificationDelete = adapter.deleteMany.mock.calls.find(
    ([args]) => args.model === 'verification'
  );
  expect(verificationDelete).toBeDefined();
  const [{ where }] = verificationDelete;
  // Both clauses are load-bearing: the value clause scopes to the user, the
  // identifier clause scopes to trust-device rows. A one-clause "simplification"
  // must fail here.
  expect(where).toHaveLength(2);
  expect(where).toEqual([
    { field: 'value', value: 'u1' },
    { field: 'identifier', value: 'trust-device-', operator: 'starts_with' },
  ]);
});

test('ResetUserTwoFactor returns the row adapter.update resolved', async () => {
  const user = { id: 'u1', twoFactorEnabled: false, name: 'Ada' };
  const adapter = createAdapter({ user });
  const { auth } = createMockAuth({ adapter });
  const result = await ResetUserTwoFactor({ auth, properties: { userId: 'u1' } });
  expect(result).toBe(user);
});

test('ResetUserTwoFactor throws and makes no adapter call when userId is missing', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await expect(ResetUserTwoFactor({ auth, properties: {} })).rejects.toThrow(
    'ResetUserTwoFactor requires a "userId" property.'
  );
  expect(adapter.deleteMany).not.toHaveBeenCalled();
  expect(adapter.update).not.toHaveBeenCalled();
});

test('ResetUserTwoFactor throws when the user does not exist', async () => {
  const adapter = {
    deleteMany: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const { auth } = createMockAuth({ adapter });
  await expect(ResetUserTwoFactor({ auth, properties: { userId: 'u1' } })).rejects.toThrow(
    'ResetUserTwoFactor found no user with id "u1".'
  );
});

test('ResetUserTwoFactor never touches the session model', async () => {
  const adapter = createAdapter();
  const { auth } = createMockAuth({ adapter });
  await ResetUserTwoFactor({ auth, properties: { userId: 'u1' } });

  adapter.deleteMany.mock.calls.forEach(([args]) => {
    expect(args.model).not.toBe('session');
  });
  adapter.update.mock.calls.forEach(([args]) => {
    expect(args.model).not.toBe('session');
  });
});

test('ResetUserTwoFactor.meta.authority declares org reset-two-factor authority targeting userId', () => {
  expect(ResetUserTwoFactor.meta.authority).toEqual({
    scope: 'org',
    permissions: { user: ['reset-two-factor'] },
    targetUser: 'userId',
  });
});

test('ResetUserTwoFactor.meta.authority declares no selfTargetExempt', () => {
  expect(ResetUserTwoFactor.meta.authority.selfTargetExempt).toBeUndefined();
});
