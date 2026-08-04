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
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toBe(null);
  expect(findOne).not.toHaveBeenCalled();
  expect(context.logger.debug).toHaveBeenCalledWith(
    'Session for user "user_1" has no active organization - resolved unauthenticated.'
  );
});

test('sets context.user to null when the user holds no member row in the active org', async () => {
  const { auth, findOne } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: null,
  });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toBe(null);
  expect(findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'org_1' },
    ],
  });
  expect(context.logger.debug).toHaveBeenCalledWith(
    'User "user_1" has no member row in organization "org_1" - resolved unauthenticated.'
  );
});

test('resolves roles from member.appRoles and orgRoles from the member role tier', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', email: 'user@example.com' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member', appRoles: ['branch-manager'] },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toEqual({
    id: 'user_1',
    email: 'user@example.com',
    roles: ['branch-manager'],
    orgRoles: ['member'],
    attributes: {},
    activeOrganizationId: 'org_1',
  });
});

test('sets activeOrganizationId from the session so steps can scope org operations', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.activeOrganizationId).toBe('org_1');
});

test('omits impersonatedBy from context.user when the session is not impersonated', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.impersonatedBy).toBeUndefined();
  expect('impersonatedBy' in context.user).toBe(false);
});

test('carries impersonatedBy onto context.user when the admin plugin is impersonating', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1', impersonatedBy: 'admin_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.impersonatedBy).toBe('admin_1');
});

test('splits a multi-value member role string into orgRoles', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'owner,admin' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.orgRoles).toEqual(['owner', 'admin']);
});

test('resolves an empty roles array when the member row has no appRoles key', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.roles).toEqual([]);
});

test('resolves an empty orgRoles array when the member row has an empty role string', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: '', appRoles: ['auditor'] },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.orgRoles).toEqual([]);
  expect(context.user.roles).toEqual(['auditor']);
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

test('carries the user profile bag from the session user row onto the resolved caller', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', profile: { contactId: 'contact_9', locale: 'en' } },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.profile).toEqual({ contactId: 'contact_9', locale: 'en' });
});

test('leaves profile undefined for a user with no profile writes', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.profile).toBe(undefined);
  expect('profile' in context.user).toBe(false);
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

function mockStrategy({ attributes = {}, id, match = null, roles = [], type = 'apiKey' }) {
  return { attributes, id, roles, type, verify: jest.fn().mockResolvedValue(match) };
}

function mockLogger() {
  return { debug: jest.fn(), warn: jest.fn() };
}

test('resolves a strategy caller when no session resolves', async () => {
  const { auth } = mockAuth({ session: null });
  const context = { logger: mockLogger() };
  const strategies = [
    mockStrategy({
      id: 'partner-access',
      match: { user: { id: 'apiKey:partner-access:acme' } },
      roles: ['partner'],
    }),
  ];

  await resolveAuthentication(context, { auth, headers: {}, strategies });

  expect(context.user).toEqual({
    id: 'apiKey:partner-access:acme',
    authMethod: 'apiKey',
    strategyId: 'partner-access',
    roles: ['partner'],
    attributes: {},
  });
});

test('sets context.user to null when no session resolves and no strategy matches', async () => {
  const { auth } = mockAuth({ session: null });
  const context = { logger: mockLogger() };
  const strategies = [mockStrategy({ id: 'partner-access' })];

  await resolveAuthentication(context, { auth, headers: {}, strategies });

  expect(context.user).toBe(null);
  expect(strategies[0].verify).toHaveBeenCalled();
});

test('a resolved session wins over a presented strategy credential', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = { logger: mockLogger() };
  const strategies = [
    mockStrategy({ id: 'partner-access', match: { user: { id: 'apiKey:partner-access:acme' } } }),
  ];

  await resolveAuthentication(context, { auth, headers: {}, strategies });

  expect(context.user.id).toBe('user_1');
  expect(context.user.authMethod).toBeUndefined();
  expect(strategies[0].verify).not.toHaveBeenCalled();
});

test('a session rejected by the membership wall does not fall through to strategies', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: null,
  });
  const context = { logger: mockLogger() };
  const strategies = [
    mockStrategy({ id: 'partner-access', match: { user: { id: 'apiKey:partner-access:acme' } } }),
  ];

  await resolveAuthentication(context, { auth, headers: {}, strategies });

  expect(context.user).toBe(null);
  expect(strategies[0].verify).not.toHaveBeenCalled();
});
