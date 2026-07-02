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

import resolveAuthentication from './resolveAuthentication.js';

test('sets context.user to null when auth is not configured', async () => {
  const context = {};
  await resolveAuthentication(context, { auth: undefined, headers: {} });
  expect(context.user).toBe(null);
});

test('sets context.user to null when auth is explicitly null', async () => {
  const context = {};
  await resolveAuthentication(context, { auth: null, headers: {} });
  expect(context.user).toBe(null);
});

test('sets context.user to null when auth.api.getSession resolves to null', async () => {
  const getSession = jest.fn().mockResolvedValue(null);
  const context = {};
  const headers = { cookie: 'session=abc' };

  await resolveAuthentication(context, { auth: { api: { getSession } }, headers });

  expect(context.user).toBe(null);
  expect(getSession).toHaveBeenCalledWith({ headers });
});

test('sets context.user to the session user with an empty roles array when a session is found', async () => {
  const sessionUser = { id: 'user_1', email: 'user@example.com' };
  const getSession = jest.fn().mockResolvedValue({ user: sessionUser, session: { id: 'sess_1' } });
  const context = {};
  const headers = { cookie: 'session=abc' };

  await resolveAuthentication(context, { auth: { api: { getSession } }, headers });

  expect(context.user).toEqual({ id: 'user_1', email: 'user@example.com', roles: [] });
});

test('does not mutate the original session user object', async () => {
  const sessionUser = { id: 'user_1' };
  const getSession = jest.fn().mockResolvedValue({ user: sessionUser });
  const context = {};

  await resolveAuthentication(context, { auth: { api: { getSession } }, headers: {} });

  expect(sessionUser).toEqual({ id: 'user_1' });
  expect(context.user).not.toBe(sessionUser);
});
