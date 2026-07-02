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

function mockAuth({ session, member }) {
  const findOne = jest.fn().mockResolvedValue(member ?? null);
  const auth = {
    api: { getSession: jest.fn().mockResolvedValue(session ?? null) },
    $context: Promise.resolve({ adapter: { findOne } }),
  };
  return { auth, findOne };
}

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
  const { auth } = mockAuth({ session: null });
  const context = {};
  const headers = { cookie: 'session=abc' };

  await resolveAuthentication(context, { auth, headers });

  expect(context.user).toBe(null);
  expect(auth.api.getSession).toHaveBeenCalledWith({ headers });
});

test('sets context.user to null when the session has no active organization', async () => {
  const { auth, findOne } = mockAuth({
    session: { user: { id: 'user_1' }, session: { id: 'sess_1' } },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toBe(null);
  expect(findOne).not.toHaveBeenCalled();
});

test('sets context.user to null when the user holds no member row in the active org', async () => {
  const { auth, findOne } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: null,
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toBe(null);
  expect(findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'org_1' },
    ],
  });
});

test('resolves roles from the active member row, splitting the CSV role string', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', email: 'user@example.com' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'admin, branch-manager' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toEqual({
    id: 'user_1',
    email: 'user@example.com',
    roles: ['admin', 'branch-manager'],
    attributes: {},
  });
});

test('resolves a single role string to a one-element roles array', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.roles).toEqual(['member']);
});

test('resolves an empty roles array when the member row has no role', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.roles).toEqual([]);
});

test('merges user and member attributes shallowly with member winning', async () => {
  const { auth } = mockAuth({
    session: {
      user: {
        id: 'user_1',
        attributes: { region: 'global', branches: ['a'], nested: { keep: false } },
      },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: {
      id: 'member_1',
      role: 'member',
      attributes: { branches: ['b', 'c'], nested: { replaced: true } },
    },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.attributes).toEqual({
    region: 'global',
    branches: ['b', 'c'],
    nested: { replaced: true },
  });
});

test('does not mutate the original session user object', async () => {
  const sessionUser = { id: 'user_1' };
  const { auth } = mockAuth({
    session: {
      user: sessionUser,
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(sessionUser).toEqual({ id: 'user_1' });
  expect(context.user).not.toBe(sessionUser);
});
