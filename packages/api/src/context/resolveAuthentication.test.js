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
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

import { registerOrganizationBinding } from '../routes/auth/organizations/getOrganizationBinding.js';
import resolveAuthentication from './resolveAuthentication.js';

function mockAuth({ session, member, count, passkey } = {}) {
  const findOne = jest.fn().mockResolvedValue(member ?? null);
  const countFn = jest.fn().mockResolvedValue(count ?? 0);
  const auth = {
    api: { getSession: jest.fn().mockResolvedValue(session ?? null) },
    $context: Promise.resolve({ adapter: { findOne, count: countFn } }),
  };
  if (passkey) {
    auth.options = { plugins: [{ id: 'passkey' }] };
  }
  return { auth, findOne, count: countFn };
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

test('sets context.user to null when a pinned app gets a session active in another organization', async () => {
  const { auth, findOne } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'customer-portal' },
    },
    member: { id: 'member_1', role: 'admin', appRoles: ['user-admin'] },
  });
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'team' } });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toBe(null);
  expect(findOne).not.toHaveBeenCalled();
  expect(context.logger.debug).toHaveBeenCalledWith(
    'Session for user "user_1" has active organization "customer-portal", which is not this app\'s pinned organization "team" - resolved unauthenticated.'
  );
});

test('resolves a session active in the pinned organization', async () => {
  const { auth, findOne } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'team' },
    },
    member: { id: 'member_1', role: 'admin', appRoles: ['user-admin'] },
  });
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'team' } });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toEqual({
    id: 'user_1',
    roles: ['user-admin'],
    org_roles: ['admin'],
    attributes: {},
    active_organization_id: 'team',
    organization_id: 'team',
    two_factor_enrolled: false,
  });
  expect(findOne).toHaveBeenCalled();
});

test('resolves any active organization under the tenant policy', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_9' },
    },
    member: { id: 'member_1', role: 'member', appRoles: ['auditor'] },
  });
  registerOrganizationBinding({ auth, organizations: { policy: 'tenant', org: 'team' } });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.active_organization_id).toBe('org_9');
  expect(context.user.roles).toEqual(['auditor']);
});

test('resolves any active organization when no organization binding is registered', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_9' },
    },
    member: { id: 'member_1', role: 'member', appRoles: ['auditor'] },
  });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.active_organization_id).toBe('org_9');
  expect(context.user.roles).toEqual(['auditor']);
});

test('resolves roles from member.appRoles and org_roles from the member role tier', async () => {
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
    org_roles: ['member'],
    attributes: {},
    active_organization_id: 'org_1',
    organization_id: 'org_1',
    two_factor_enrolled: false,
  });
});

test('snake_cases the camelCase fields BetterAuth returns on the session user', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', emailVerified: true, twoFactorEnabled: true },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.email_verified).toBe(true);
  expect(context.user.two_factor_enabled).toBe(true);
  expect('emailVerified' in context.user).toBe(false);
  expect('twoFactorEnabled' in context.user).toBe(false);
});

test('sets active_organization_id from the session so steps can scope org operations', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.active_organization_id).toBe('org_1');
});

test('sets organization_id to the active org for tenant stamping and _user: organization_id', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.organization_id).toBe('org_1');
  expect(context.user.organization_id).toBe(context.user.active_organization_id);
});

// The admin plugin's session field never reaches the caller. Nothing writes
// user.role, so no browser session can be an impersonation in the first place,
// and a session row still carrying the field must not resurrect a _user surface
// no step reads.
test('never carries impersonatedBy onto context.user, even when the session row holds it', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1', impersonatedBy: 'admin_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect('impersonatedBy' in context.user).toBe(false);
});

test('splits a multi-value member role string into org_roles', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'owner,admin' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.org_roles).toEqual(['owner', 'admin']);
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

test('resolves an empty org_roles array when the member row has an empty role string', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: '', appRoles: ['auditor'] },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.org_roles).toEqual([]);
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
      user: { id: 'user_1', profile: { plan: 'pro', locale: 'en' } },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.profile).toEqual({ plan: 'pro', locale: 'en' });
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

// contactId is a top-level caller field, not a key inside the profile bag - a
// consumer reading _user.profile as a display object never trips over the link.
// It reaches the caller as contact_id: the logical field is camelCase like
// every other schema field, and normalizeCaller's all-keys rule snakes it with
// no special handling, so the bag beside it is untouched.
test('carries contactId from the session user row onto the resolved caller as snake_case contact_id', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', contactId: 'contact_9', profile: { locale: 'en' } },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.contact_id).toBe('contact_9');
  expect('contactId' in context.user).toBe(false);
  expect(context.user.profile).toEqual({ locale: 'en' });
});

test('leaves contact_id undefined for a user with no link', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.contact_id).toBe(undefined);
  expect('contact_id' in context.user).toBe(false);
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

test('resolves two_factor_enrolled true and skips the passkey read when twoFactorEnabled is true', async () => {
  const { auth, count } = mockAuth({
    session: {
      user: { id: 'user_1', twoFactorEnabled: true },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
    passkey: true,
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.two_factor_enrolled).toBe(true);
  expect(count).not.toHaveBeenCalled();
});

test('resolves two_factor_enrolled true when an unenrolled caller has a passkey on a passkey instance', async () => {
  const { auth, count } = mockAuth({
    session: {
      user: { id: 'user_1', twoFactorEnabled: false },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
    passkey: true,
    count: 1,
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.two_factor_enrolled).toBe(true);
  expect(count).toHaveBeenCalledWith({
    model: 'passkey',
    where: [{ field: 'userId', value: 'user_1' }],
  });
});

test('resolves two_factor_enrolled false when an unenrolled caller has no passkey on a passkey instance', async () => {
  const { auth, count } = mockAuth({
    session: {
      user: { id: 'user_1', twoFactorEnabled: false },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
    passkey: true,
    count: 0,
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.two_factor_enrolled).toBe(false);
  expect(count).toHaveBeenCalledWith({
    model: 'passkey',
    where: [{ field: 'userId', value: 'user_1' }],
  });
});

test('resolves two_factor_enrolled false and skips the passkey read on an instance with no passkey plugin', async () => {
  const { auth, count } = mockAuth({
    session: {
      user: { id: 'user_1', twoFactorEnabled: false },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.two_factor_enrolled).toBe(false);
  expect(count).not.toHaveBeenCalled();
});

test('resolves two_factor_enrolled false, not undefined, when twoFactorEnabled is absent from the session', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.two_factor_enrolled).toBe(false);
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
    auth_method: 'apiKey',
    strategy_id: 'partner-access',
    roles: ['partner'],
    attributes: {},
  });
});

test('omits the two_factor_enrolled key entirely on a strategy caller', async () => {
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

  expect('two_factor_enrolled' in context.user).toBe(false);
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
  expect(context.user.auth_method).toBeUndefined();
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

test('resolves a caller awaiting an organization when a tenant session carries none', async () => {
  const { auth, findOne } = mockAuth({
    session: {
      user: { id: 'user_1', email: 'invited@example.com', name: 'Invited' },
      session: { id: 'sess_1' },
    },
  });
  registerOrganizationBinding({ auth, organizations: { policy: 'tenant' } });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toEqual({
    id: 'user_1',
    email: 'invited@example.com',
    name: 'Invited',
    roles: [],
    org_roles: [],
    attributes: {},
    awaiting_organization: true,
  });
  // No organization means there is no member row to read.
  expect(findOne).not.toHaveBeenCalled();
});

test('a caller awaiting an organization carries the global attributes alone', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', attributes: { region: 'eu' } },
      session: { id: 'sess_1' },
    },
  });
  registerOrganizationBinding({ auth, organizations: { policy: 'tenant' } });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.attributes).toEqual({ region: 'eu' });
  expect(context.user.active_organization_id).toBeUndefined();
  expect(context.user.awaiting_organization).toBe(true);
});

test('a session carrying no organization stays unauthenticated under pinned', async () => {
  const { auth, findOne } = mockAuth({
    session: { user: { id: 'user_1' }, session: { id: 'sess_1' } },
  });
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'team-portal' } });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user).toBe(null);
  expect(findOne).not.toHaveBeenCalled();
});

test('a tenant member removed mid-session stays unauthenticated', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1' },
      session: { id: 'sess_1', activeOrganizationId: 'org_1' },
    },
    member: null,
  });
  registerOrganizationBinding({ auth, organizations: { policy: 'tenant' } });
  const context = { logger: mockLogger() };

  await resolveAuthentication(context, { auth, headers: {} });

  // Awaiting an organization covers a session carrying none at all. It must
  // never become a way around revocation.
  expect(context.user).toBe(null);
});

describe('MCP bearer branch and the general-path audience invariant', () => {
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;
  const issuer = 'https://app.test.com/api/auth';
  const orgResourceUri = (orgId) => `https://app.test.com/api/mcp/${orgId}`;

  let privateKey;
  let jwksRows;

  beforeAll(async () => {
    const keyPair = await generateKeyPair('EdDSA');
    privateKey = keyPair.privateKey;
    jwksRows = [
      {
        id: 'kid_1',
        publicKey: JSON.stringify(await exportJWK(keyPair.publicKey)),
        privateKey: 'encrypted-and-never-read',
        createdAt: new Date(),
        alg: 'EdDSA',
      },
    ];
  });

  beforeEach(() => {
    process.env.BETTER_AUTH_URL = 'https://app.test.com';
  });

  afterAll(() => {
    if (originalBetterAuthUrl === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    }
  });

  function mockMcpAuth({ count = 0, member, passkey, session, user } = {}) {
    const findOne = jest.fn(async ({ model }) => {
      if (model === 'user') {
        return user ?? null;
      }
      if (model === 'member') {
        return member ?? null;
      }
      return null;
    });
    const findMany = jest.fn(async ({ model }) => (model === 'jwks' ? jwksRows : []));
    const countFn = jest.fn().mockResolvedValue(count);
    const auth = {
      api: { getSession: jest.fn().mockResolvedValue(session ?? null) },
      $context: Promise.resolve({ adapter: { count: countFn, findMany, findOne } }),
    };
    if (passkey) {
      auth.options = { plugins: [{ id: 'passkey' }] };
    }
    return { auth, count: countFn, findMany, findOne };
  }

  function mcpContext() {
    return { config: {}, logger: mockLogger() };
  }

  async function mintToken({
    aud = orgResourceUri('org_1'),
    iss = issuer,
    scope = 'mcp:read',
    sub = 'user_1',
  } = {}) {
    return new SignJWT({ scope })
      .setProtectedHeader({ alg: 'EdDSA', kid: 'kid_1' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .setIssuer(iss)
      .setAudience(aud)
      .setSubject(sub)
      .sign(privateKey);
  }

  function bearerHeaders(token) {
    return new Headers({ authorization: `Bearer ${token}` });
  }

  test('no bearer resolves the anonymous caller with tokenStatus none', async () => {
    const { auth, findOne } = mockMcpAuth();
    const context = mcpContext();

    await resolveAuthentication(context, {
      auth,
      headers: new Headers({}),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth).toEqual({ orgId: 'org_1', tokenStatus: 'none', parseableJwt: true });
    expect(findOne).not.toHaveBeenCalled();
  });

  test('a session cookie never authenticates on the MCP branch - the session branch is skipped', async () => {
    const { auth, findOne } = mockMcpAuth({
      session: {
        user: { id: 'user_1' },
        session: { id: 'sess_1', activeOrganizationId: 'org_1' },
      },
      member: { id: 'member_1', role: 'member', appRoles: ['auditor'] },
    });
    const context = mcpContext();

    await resolveAuthentication(context, {
      auth,
      headers: new Headers({ cookie: 'better-auth.session_token=abc' }),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth.tokenStatus).toBe('none');
    expect(auth.api.getSession).not.toHaveBeenCalled();
    expect(findOne).not.toHaveBeenCalled();
  });

  test('a token minted for another org resolves invalid on the audience check with no member lookup', async () => {
    const { auth, findOne } = mockMcpAuth({
      user: { id: 'user_1' },
      member: { id: 'member_1', role: 'member', appRoles: ['auditor'] },
    });
    const context = mcpContext();
    const token = await mintToken({ aud: orgResourceUri('org_x') });

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'org_y' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth).toEqual({ orgId: 'org_y', tokenStatus: 'invalid', parseableJwt: true });
    expect(findOne).not.toHaveBeenCalled();
  });

  test('a validly signed token with a foreign-service audience resolves invalid', async () => {
    const { auth, findOne } = mockMcpAuth({
      user: { id: 'user_1' },
      member: { id: 'member_1', role: 'member', appRoles: ['auditor'] },
    });
    const context = mcpContext();
    const token = await mintToken({ aud: 'https://other-service.example.com/api' });

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth).toEqual({ orgId: 'org_1', tokenStatus: 'invalid', parseableJwt: true });
    expect(findOne).not.toHaveBeenCalled();
  });

  test('a token with the wrong issuer resolves invalid even with a valid signature and audience', async () => {
    const { auth, findOne } = mockMcpAuth({
      user: { id: 'user_1' },
      member: { id: 'member_1', role: 'member', appRoles: ['auditor'] },
    });
    const context = mcpContext();
    // The bare origin is not the AS issuer - the issuer carries /api/auth.
    const token = await mintToken({ iss: 'https://app.test.com' });

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth).toEqual({ orgId: 'org_1', tokenStatus: 'invalid', parseableJwt: true });
    expect(findOne).not.toHaveBeenCalled();
  });

  test('a valid token with a live member resolves the member caller', async () => {
    const { auth, findOne } = mockMcpAuth({
      user: { id: 'user_1', email: 'user@example.com', attributes: { region: 'global' } },
      member: {
        id: 'member_1',
        role: 'admin',
        appRoles: ['user-admin'],
        attributes: { region: 'eu' },
      },
    });
    const context = mcpContext();
    const token = await mintToken({ scope: 'mcp:read mcp:write offline_access' });

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toEqual({
      id: 'user_1',
      email: 'user@example.com',
      roles: ['user-admin'],
      org_roles: ['admin'],
      attributes: { region: 'eu' },
      active_organization_id: 'org_1',
      organization_id: 'org_1',
      two_factor_enrolled: false,
    });
    expect(context.mcpAuth).toEqual({
      orgId: 'org_1',
      tokenStatus: 'valid',
      parseableJwt: true,
      grantedScopes: ['mcp:read', 'mcp:write'],
    });
    expect(findOne).toHaveBeenCalledWith({
      model: 'member',
      where: [
        { field: 'userId', value: 'user_1' },
        { field: 'organizationId', value: 'org_1' },
      ],
    });
  });

  test('a bearer-resolved member computes two_factor_enrolled from the passkey count', async () => {
    const { auth, count } = mockMcpAuth({
      user: { id: 'user_1', twoFactorEnabled: false },
      member: { id: 'member_1', role: 'member' },
      passkey: true,
      count: 1,
    });
    const context = mcpContext();
    const token = await mintToken();

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'org_1' },
    });

    expect(context.user.two_factor_enrolled).toBe(true);
    expect(count).toHaveBeenCalledWith({
      model: 'passkey',
      where: [{ field: 'userId', value: 'user_1' }],
    });
  });

  test('a valid token whose member row is revoked degrades to the anonymous caller with tokenStatus valid', async () => {
    const { auth } = mockMcpAuth({ user: { id: 'user_1' }, member: null });
    const context = mcpContext();
    const token = await mintToken();

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth).toEqual({
      orgId: 'org_1',
      tokenStatus: 'valid',
      parseableJwt: true,
      grantedScopes: ['mcp:read'],
    });
  });

  test('a valid token whose subject has no user row degrades to the anonymous caller', async () => {
    const { auth } = mockMcpAuth({
      user: null,
      member: { id: 'member_1', role: 'member' },
    });
    const context = mcpContext();
    const token = await mintToken({ sub: 'user_deleted' });

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth.tokenStatus).toBe('valid');
  });

  test('a valid token for an org that is not the pinned org degrades to the anonymous caller', async () => {
    const { auth, findOne } = mockMcpAuth({
      user: { id: 'user_1' },
      member: { id: 'member_1', role: 'member' },
    });
    registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'team' } });
    const context = mcpContext();
    const token = await mintToken({ aud: orgResourceUri('other-org') });

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      resource: { orgId: 'other-org' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth.tokenStatus).toBe('valid');
    expect(findOne).not.toHaveBeenCalled();
  });

  test('an unparseable bearer resolves invalid with parseableJwt false', async () => {
    const { auth, findOne } = mockMcpAuth();
    const context = mcpContext();

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders('not-a-jwt'),
      resource: { orgId: 'org_1' },
    });

    expect(context.user).toBe(null);
    expect(context.mcpAuth).toEqual({
      orgId: 'org_1',
      tokenStatus: 'invalid',
      parseableJwt: false,
    });
    expect(findOne).not.toHaveBeenCalled();
  });

  test('the general path refuses a bearer with an MCP-prefixed audience before the strategies run', async () => {
    const { auth } = mockMcpAuth();
    const context = mcpContext();
    const token = await mintToken();
    const strategies = [
      mockStrategy({ id: 'partner-access', match: { user: { id: 'apiKey:partner-access:acme' } } }),
    ];

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      strategies,
    });

    expect(context.user).toBe(null);
    expect(strategies[0].verify).not.toHaveBeenCalled();
    expect(context.logger.debug).toHaveBeenCalledWith(
      { event: 'auth_mcp_audience_bearer_rejected' },
      'Bearer token carrying an MCP resource audience rejected on the general API surface - resolved unauthenticated.'
    );
  });

  test('the general path passes a JWT bearer with a non-MCP audience through to the strategies', async () => {
    const { auth } = mockMcpAuth();
    const context = mcpContext();
    const token = await mintToken({ aud: 'https://other-service.example.com/api' });
    const strategies = [
      mockStrategy({
        id: 'service-jwt',
        match: { user: { id: 'jwt:service-jwt:svc' } },
        type: 'jwt',
      }),
    ];

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders(token),
      strategies,
    });

    expect(context.user.id).toBe('jwt:service-jwt:svc');
    expect(strategies[0].verify).toHaveBeenCalled();
  });

  test('the general path passes an opaque non-JWT bearer through to the strategies', async () => {
    const { auth } = mockMcpAuth();
    const context = mcpContext();
    const strategies = [
      mockStrategy({ id: 'partner-access', match: { user: { id: 'apiKey:partner-access:acme' } } }),
    ];

    await resolveAuthentication(context, {
      auth,
      headers: bearerHeaders('opaque-api-key'),
      strategies,
    });

    expect(context.user.id).toBe('apiKey:partner-access:acme');
    expect(strategies[0].verify).toHaveBeenCalled();
  });
});

test('prefers the member row display copies for name and image (per-organization identity)', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', name: 'Alice in B', image: 'data:image/svg;b' },
      session: { id: 'sess_1', activeOrganizationId: 'org_a' },
    },
    member: {
      id: 'member_1',
      role: 'member',
      name: 'Alice Anderson',
      image: 'data:image/svg;a',
    },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  // The user row is deployment-global and last-edit-wins across workspaces;
  // the member copies carry the identity saved in THIS organization (T18).
  expect(context.user.name).toBe('Alice Anderson');
  expect(context.user.image).toBe('data:image/svg;a');
});

test('falls back to the global user row for name and image when the member row carries no copies', async () => {
  const { auth } = mockAuth({
    session: {
      user: { id: 'user_1', name: 'Alice Anderson', image: 'data:image/svg;a' },
      session: { id: 'sess_1', activeOrganizationId: 'org_a' },
    },
    member: { id: 'member_1', role: 'member' },
  });
  const context = {};

  await resolveAuthentication(context, { auth, headers: {} });

  expect(context.user.name).toBe('Alice Anderson');
  expect(context.user.image).toBe('data:image/svg;a');
});
