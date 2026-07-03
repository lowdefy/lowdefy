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

import authHookPoints from './authHookPoints.js';

test('the catalog covers the frozen launch point set', () => {
  expect(Object.keys(authHookPoints).sort()).toEqual(
    [
      'user.create.before',
      'user.create.after',
      'user.update.before',
      'user.update.after',
      'session.create.before',
      'session.create.after',
      'session.delete.after',
      'account.create.before',
      'account.create.after',
      'verification.create.before',
      'verification.create.after',
      'email.verified',
      'invitation.send',
    ].sort()
  );
});

test('user.create points hand { user }', () => {
  const user = { id: 'u1', email: 'a@b.c' };
  expect(authHookPoints['user.create.before'].buildPayload(user)).toEqual({ user });
  expect(authHookPoints['user.create.after'].buildPayload(user)).toEqual({ user });
});

test('user.update.before hands { user: null, changes } - BetterAuth provides only the changed fields', () => {
  const changes = { name: 'New Name' };
  expect(authHookPoints['user.update.before'].buildPayload(changes)).toEqual({
    user: null,
    changes,
  });
});

test('user.update.after hands { user, changes: null } - BetterAuth provides only the updated record', () => {
  const user = { id: 'u1', name: 'New Name' };
  expect(authHookPoints['user.update.after'].buildPayload(user)).toEqual({ user, changes: null });
});

test('session and account points hand the record plus the fetched subject user', async () => {
  const user = { id: 'u1', email: 'a@b.c' };
  const findUserById = jest.fn(async () => user);
  const ctx = { context: { internalAdapter: { findUserById } } };
  const session = { id: 's1', userId: 'u1' };
  const account = { id: 'acc1', userId: 'u1', providerId: 'google' };

  await expect(
    authHookPoints['session.create.before'].buildPayload(session, ctx)
  ).resolves.toEqual({ session, user });
  await expect(authHookPoints['session.delete.after'].buildPayload(session, ctx)).resolves.toEqual(
    { session, user }
  );
  await expect(
    authHookPoints['account.create.after'].buildPayload(account, ctx)
  ).resolves.toEqual({ account, user });
});

test('verification points hand { verification } and email.verified hands { user }', () => {
  const verification = { id: 'v1', identifier: 'a@b.c' };
  expect(authHookPoints['verification.create.before'].buildPayload(verification)).toEqual({
    verification,
  });
  const user = { id: 'u1' };
  expect(authHookPoints['email.verified'].buildPayload(user)).toEqual({ user });
});
