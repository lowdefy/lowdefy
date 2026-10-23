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

import { callerHash } from '@lowdefy/helpers';
import { expect, test } from 'vitest';

import sessionCaller from './sessionCaller.js';

const RESOLVED = {
  id: 'user-1',
  email: 'user-1@example.com',
  email_verified: true,
  organization_id: 'org-1',
  roles: ['admin'],
};

function sessionFor(user) {
  return { session: { id: 'session-1', userId: user.id }, user };
}

test('while the store is pending, the server-resolved caller renders', () => {
  expect(sessionCaller({ isPending: true, resolvedUser: RESOLVED, session: null })).toBe(RESOLVED);
  expect(sessionCaller({ isPending: true, resolvedUser: null, session: null })).toBe(null);
});

test('with no session, no caller renders', () => {
  expect(sessionCaller({ isPending: false, resolvedUser: RESOLVED, session: null })).toBe(null);
  expect(sessionCaller({ isPending: false, resolvedUser: null, session: { user: null } })).toBe(
    null
  );
});

test('a session the server resolved to no caller renders no caller', () => {
  const session = sessionFor({ id: 'user-1', email: 'user-1@example.com', emailVerified: true });
  const user = sessionCaller({ isPending: false, resolvedUser: null, session });
  expect(user).toBe(null);
  // The server stamps such a response with the empty caller; the rendered
  // caller hashes the same, so the page does not reload.
  expect(callerHash({ user })).toBe('');
});

test('a resolved caller for the session user renders merged over the session user', () => {
  const session = sessionFor({
    id: 'user-1',
    email: 'user-1@example.com',
    emailVerified: true,
    image: 'https://example.com/a.png',
  });
  const user = sessionCaller({ isPending: false, resolvedUser: RESOLVED, session });
  expect(user).toEqual({
    id: 'user-1',
    email: 'user-1@example.com',
    email_verified: true,
    image: 'https://example.com/a.png',
    organization_id: 'org-1',
    roles: ['admin'],
  });
  expect(user).not.toHaveProperty('emailVerified');
  expect(callerHash({ user })).toBe(callerHash({ user: RESOLVED }));
});

test('a resolved caller for another person renders whole until the page reloads', () => {
  const session = sessionFor({ id: 'user-2', email: 'user-2@example.com' });
  expect(sessionCaller({ isPending: false, resolvedUser: RESOLVED, session })).toBe(RESOLVED);
});
