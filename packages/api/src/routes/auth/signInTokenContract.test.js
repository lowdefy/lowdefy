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

import crypto from 'node:crypto';

import { jest } from '@jest/globals';
import '@opentelemetry/api';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { CreateSignInToken, RevokeSignInTokens } from '@lowdefy/plugin-better-auth/steps';

import getBetterAuthConfig from './getBetterAuthConfig.js';
import handleAuthRequest from './handleAuthRequest.js';
import modelNames from './modelNames.js';
import resolveAuthentication from '../../context/resolveAuthentication.js';
import { registerAuthEnforcement } from './getAuthEnforcement.js';
import { registerOrganizationBinding } from './organizations/getOrganizationBinding.js';

// Contract test against the installed better-auth release: a real BetterAuth
// instance built from the assembled options drives the sign-in token flow end to
// end - the CreateSignInToken step mints, the exchange endpoint trades the token
// for a session, resolveAuthentication reads that session as a caller.

const ORIGIN = 'https://app.example.com';
const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

beforeAll(() => {
  process.env.BETTER_AUTH_URL = ORIGIN;
});

afterAll(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

const cheapPasswordHasher = {
  hash: async (password) => password,
  verify: async ({ hash, password }) => hash === password,
};

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

function createAuthJson({ organizations }) {
  return {
    configured: true,
    secret: { _secret: 'BETTER_AUTH_SECRET' },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      disableSignUp: false,
    },
    providers: [],
    session: {
      expiresIn: 604800,
      updateAge: 86400,
      cookieCache: { enabled: false, maxAge: 300 },
      crossSubDomainCookies: { enabled: false },
    },
    account: { accountLinking: { enabled: true, trustedProviders: [] } },
    sessionScopes: { 'email-link': { roles: ['control-owner'] } },
    rateLimit: { enabled: false, window: 60, max: 100 },
    twoFactor: { enabled: true, required: false, trustDevice: true },
    authPages: { signIn: '/login', verifyEmail: '/verify-email', twoFactor: '/two-factor' },
    api: { roles: {} },
    pages: { roles: {} },
    websockets: { roles: {} },
    organizations,
    roles: [],
  };
}

function createAuth({ organizations }) {
  const authJson = createAuthJson({ organizations });
  const options = getBetterAuthConfig({
    appMeta: { name: 'Test App', slug: 'test-app' },
    authJson,
    getAuth: () => auth,
    logger,
    plugins: { adapters: {}, providers: {} },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  const tables = Object.fromEntries(Object.values(modelNames).map((name) => [name, []]));
  const auth = betterAuth({
    ...options,
    database: memoryAdapter(tables),
    emailAndPassword: { ...options.emailAndPassword, password: cheapPasswordHasher },
  });
  registerAuthEnforcement({ auth, authJson });
  registerOrganizationBinding({ auth, organizations });
  return auth;
}

const pinned = { policy: 'pinned', org: 'default', signup: 'invite-only' };
const tenant = { policy: 'tenant', signup: 'open', create: 'operator' };

async function seed({
  auth,
  memberships = [{ organizationId: 'default', appRoles: ['admin', 'control-owner'] }],
}) {
  const { adapter } = await auth.$context;
  // Written through the raw adapter: the internal adapter's user.create hooks
  // would apply the admission gate to a user that is about to be made a member.
  const user = await adapter.create({
    model: 'user',
    data: {
      email: 'person@example.com',
      name: 'Person',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await adapter.create({
    model: 'account',
    data: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: 'password-1234',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const members = {};
  for (const [index, membership] of memberships.entries()) {
    const existing = await adapter.findOne({
      model: 'organization',
      where: [{ field: 'id', value: membership.organizationId }],
    });
    if (!existing) {
      await adapter.create({
        model: 'organization',
        data: {
          id: membership.organizationId,
          name: membership.organizationId,
          slug: membership.organizationId,
          createdAt: new Date(),
        },
        forceAllowId: true,
      });
    }
    members[membership.organizationId] = await adapter.create({
      model: 'member',
      data: {
        userId: user.id,
        organizationId: membership.organizationId,
        role: 'admin',
        appRoles: membership.appRoles,
        createdAt: new Date(Date.now() + index),
      },
    });
  }
  return { adapter, members, user };
}

const LANDING = { pageId: 'task', urlQuery: { id: 'task-1' } };
const LANDING_URL = { url: '/task?id=task-1' };
const routes = [
  { pageId: 'task', path: 'task' },
  { pageId: 'ticket', path: 'tickets/{ticket_id}' },
];

async function readConfigFile(filePath) {
  return filePath === 'routes.json' ? routes : null;
}

function mint({
  auth,
  organizationId = 'default',
  userId,
  expiresIn = 3600,
  scope = 'email-link',
  landing = LANDING,
  organization = null,
}) {
  return CreateSignInToken({
    acting: { system: true, user: null },
    auth,
    markCredential: jest.fn(),
    organization,
    properties: { userId, organizationId, expiresIn, scope, landing },
    readConfigFile,
  });
}

// A token row written straight to the store, as a forged or legacy row would be.
function seedTokenRow({ adapter, token, ...fields }) {
  return adapter.create({
    model: 'signInToken',
    data: {
      organizationId: 'default',
      scope: 'email-link',
      landing: JSON.stringify(LANDING_URL),
      state: 'issued',
      hash: crypto.createHash('sha256').update(token).digest('hex'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
      ...fields,
    },
  });
}

function post({ auth, path, body, cookie }) {
  return handleAuthRequest({
    auth,
    clientAddress: '198.51.100.1',
    request: new Request(`${ORIGIN}/api/auth${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: ORIGIN,
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  });
}

function get({ auth, path, cookie }) {
  return handleAuthRequest({
    auth,
    clientAddress: '198.51.100.1',
    request: new Request(`${ORIGIN}/api/auth${path}`, {
      method: 'GET',
      headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}) },
    }),
  });
}

// The reason the last refused exchange logged. The response is the same for
// every refusal, so the log is where a test sees which check refused.
function lastRefusalReason() {
  const refusals = logger.warn.mock.calls.filter(
    ([entry]) => entry?.event === 'auth_sign_in_token_refused'
  );
  return refusals.at(-1)?.[0].reason;
}

function exchange({ auth, token, ...rest }) {
  return post({ auth, path: '/sign-in-token/exchange', body: { token, ...rest } });
}

function cookieFrom(response) {
  return response.headers
    .getSetCookie()
    .map((entry) => entry.split(';')[0])
    .join('; ');
}

async function resolveCaller({ auth, cookie }) {
  const context = { logger };
  await resolveAuthentication(context, { auth, headers: new Headers({ cookie }) });
  return context.user;
}

describe('pinned organization', () => {
  let auth;
  let seeded;

  beforeEach(async () => {
    logger.warn.mockClear();
    auth = createAuth({ organizations: pinned });
    seeded = await seed({ auth });
  });

  test('a token opens a session in its organization that carries its scope and the scope roles', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const response = await exchange({ auth, token });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true, landing: LANDING_URL });
    const cookie = cookieFrom(response);
    expect(cookie).not.toBe('');

    const session = await (await get({ auth, path: '/get-session', cookie })).json();
    expect(session.session.sessionScope).toBe('email-link');
    expect(session.session.activeOrganizationId).toBe('default');

    const caller = await resolveCaller({ auth, cookie });
    expect(caller.id).toBe(seeded.user.id);
    expect(caller.roles).toEqual(['control-owner']);
    expect(caller.org_roles).toEqual([]);
    expect(caller.session_scope).toBe('email-link');
    expect(caller.organization_id).toBe('default');
  });

  test('a scope never grants a role the member does not hold', async () => {
    const viewer = await seed({
      auth,
      memberships: [{ organizationId: 'default', appRoles: ['viewer'] }],
    });
    const { token } = await mint({ auth, userId: viewer.user.id });
    const cookie = cookieFrom(await exchange({ auth, token }));
    const caller = await resolveCaller({ auth, cookie });
    expect(caller.id).toBe(viewer.user.id);
    expect(caller.roles).toEqual([]);
    expect(caller.session_scope).toBe('email-link');
  });

  test('the token is spent on its first exchange, and a second exchange is refused', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    expect((await exchange({ auth, token })).status).toBe(200);
    const second = await exchange({ auth, token });
    expect(second.status).toBe(401);
    expect(second.headers.getSetCookie()).toEqual([]);
    expect(lastRefusalReason()).toBe('spent token');
    const [row] = await seeded.adapter.findMany({ model: 'signInToken' });
    expect(row.state).toBe('spent');
    expect(row.spentAt).toBeInstanceOf(Date);
    expect(await seeded.adapter.count({ model: 'session' })).toBe(1);
  });

  test('of two concurrent exchanges of one token exactly one succeeds', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const responses = await Promise.all([
      exchange({ auth, token }),
      exchange({ auth, token }),
      exchange({ auth, token }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401, 401]);
    expect(await seeded.adapter.count({ model: 'session' })).toBe(1);
  });

  test('the exchange always lands on the bound landing, whatever the caller asks', async () => {
    const { token } = await mint({
      auth,
      userId: seeded.user.id,
      landing: { url: '/tasks/7?tab=1' },
    });
    const response = await exchange({
      auth,
      token,
      landing: { url: '/admin' },
      callbackUrl: { pageId: 'admin' },
    });
    expect(response.status).toBe(200);
    expect((await response.json()).landing).toEqual({ url: '/tasks/7?tab=1' });
  });

  test('a page landing is built into its path at mint, placeholders included', async () => {
    const { token } = await mint({
      auth,
      userId: seeded.user.id,
      landing: { pageId: 'ticket', pathParams: { ticket_id: 7 }, urlQuery: { tab: 'notes' } },
    });
    const response = await exchange({ auth, token });
    expect((await response.json()).landing).toEqual({ url: '/tickets/7?tab=notes' });
    await expect(
      mint({ auth, userId: seeded.user.id, landing: { pageId: 'ticket' } })
    ).rejects.toThrow('missing a value for path placeholder "ticket_id"');
    await expect(
      mint({ auth, userId: seeded.user.id, landing: { pageId: 'no-such-page' } })
    ).rejects.toThrow('is not a page in this app');
  });

  test('the mint refuses a landing that is not in this app', async () => {
    for (const landing of [
      { url: 'https://evil.example.com/' },
      { url: '//evil.example.com/' },
      { url: '/\\evil.example.com/' },
      { url: '/\t/evil.example.com/' },
      { pageId: 'task', url: '/task' },
      {},
      null,
    ]) {
      await expect(mint({ auth, userId: seeded.user.id, landing })).rejects.toThrow(
        'CreateSignInToken'
      );
    }
    expect(await seeded.adapter.count({ model: 'signInToken' })).toBe(0);
  });

  test('expiresIn defaults to an hour and may not pass seven days', async () => {
    const before = Date.now();
    const { expiresAt } = await CreateSignInToken({
      acting: { system: true, user: null },
      auth,
      markCredential: jest.fn(),
      properties: {
        userId: seeded.user.id,
        organizationId: 'default',
        scope: 'email-link',
        landing: LANDING,
      },
      readConfigFile,
    });
    expect(expiresAt.getTime() - before).toBeGreaterThanOrEqual(3600 * 1000 - 1000);
    expect(expiresAt.getTime() - before).toBeLessThanOrEqual(3600 * 1000 + 1000);
    await expect(
      mint({ auth, userId: seeded.user.id, expiresIn: 7 * 24 * 3600 + 1 })
    ).rejects.toThrow('at most 604800 (7 days)');
    await expect(mint({ auth, userId: seeded.user.id, expiresIn: 7 * 24 * 3600 })).resolves.toEqual(
      expect.objectContaining({ token: expect.any(String) })
    );
  });

  test('the session ends when the token does', async () => {
    const { token, expiresAt } = await mint({ auth, userId: seeded.user.id, expiresIn: 600 });
    const cookie = cookieFrom(await exchange({ auth, token }));
    const [session] = await seeded.adapter.findMany({ model: 'session' });
    expect(new Date(session.expiresAt).getTime()).toBe(expiresAt.getTime());
    expect(await resolveCaller({ auth, cookie })).not.toBeNull();
  });

  test('only the hash is stored', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const rows = await seeded.adapter.findMany({ model: 'signInToken' });
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(rows[0].hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0]).toMatchObject({
      userId: seeded.user.id,
      organizationId: 'default',
      memberId: seeded.members.default.id,
      scope: 'email-link',
    });
  });

  test('a scanner GET of the exchange path creates no session and spends nothing', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const response = await get({
      auth,
      path: `/sign-in-token/exchange?token=${encodeURIComponent(token)}`,
    });
    expect(response.status).toBe(404);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await seeded.adapter.count({ model: 'session' })).toBe(0);
    const [row] = await seeded.adapter.findMany({ model: 'signInToken' });
    expect(row.state).toBe('issued');
    expect((await exchange({ auth, token })).status).toBe(200);
  });

  test('a tampered token is refused and leaves the real token unspent', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const last = token.at(-1) === 'A' ? 'B' : 'A';
    const tampered = await exchange({ auth, token: `${token.slice(0, -1)}${last}` });
    expect(tampered.status).toBe(401);
    expect(lastRefusalReason()).toBe('unknown token');
    expect(await seeded.adapter.count({ model: 'session' })).toBe(0);
    expect((await exchange({ auth, token })).status).toBe(200);
  });

  test('an unknown or malformed token is refused with no session', async () => {
    const unknown = await exchange({ auth, token: 'ldf_sit_not-a-real-token' });
    expect(unknown.status).toBe(401);
    expect((await unknown.json()).code).toBe('INVALID_SIGN_IN_TOKEN');
    expect((await exchange({ auth, token: '' })).status).toBe(401);
    expect((await post({ auth, path: '/sign-in-token/exchange', body: {} })).status).toBe(401);
    expect(await seeded.adapter.count({ model: 'session' })).toBe(0);
  });

  test('an expired token is refused', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    await seeded.adapter.updateMany({
      model: 'signInToken',
      where: [{ field: 'userId', value: seeded.user.id }],
      update: { expiresAt: new Date(Date.now() - 1000) },
    });
    const response = await exchange({ auth, token });
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(lastRefusalReason()).toBe('expired token');
  });

  test('a revoked token is refused before it is used', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    await RevokeSignInTokens({
      acting: { system: true, user: null },
      auth,
      properties: { userId: seeded.user.id },
    });
    const response = await exchange({ auth, token });
    expect(response.status).toBe(401);
    expect(lastRefusalReason()).toBe('revoked token');
    expect(await seeded.adapter.count({ model: 'session' })).toBe(0);
  });

  test('RevokeSignInTokens limits itself to the scope and organization it is given', async () => {
    await mint({ auth, userId: seeded.user.id });
    const result = await RevokeSignInTokens({
      acting: { system: true, user: null },
      auth,
      properties: { userId: seeded.user.id, scope: 'other-scope' },
    });
    expect(result).toEqual({ revoked: 0 });
    const byOrg = await RevokeSignInTokens({
      acting: { system: true, user: null },
      auth,
      properties: { userId: seeded.user.id, organizationId: 'default', scope: 'email-link' },
    });
    expect(byOrg).toEqual({ revoked: 1 });
    const [row] = await seeded.adapter.findMany({ model: 'signInToken' });
    expect(row.state).toBe('revoked');
  });

  test('revoking a spent token ends the session it opened', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const cookie = cookieFrom(await exchange({ auth, token }));
    expect((await resolveCaller({ auth, cookie })).id).toBe(seeded.user.id);

    const result = await RevokeSignInTokens({
      acting: { system: true, user: null },
      auth,
      properties: { userId: seeded.user.id },
    });
    expect(result).toEqual({ revoked: 1 });
    expect(await seeded.adapter.count({ model: 'session' })).toBe(0);
    expect(await (await get({ auth, path: '/get-session', cookie })).json()).toBeNull();
    expect(await resolveCaller({ auth, cookie })).toBeNull();
  });

  test('a token past its expiry ends the sessions it opened', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const cookie = cookieFrom(await exchange({ auth, token }));
    await seeded.adapter.updateMany({
      model: 'signInToken',
      where: [{ field: 'userId', value: seeded.user.id }],
      update: { expiresAt: new Date(Date.now() - 1000) },
    });
    // BetterAuth's session refresh may have moved the row's own expiry on; the
    // token's is the one that counts, and the dead row is deleted.
    await seeded.adapter.updateMany({
      model: 'session',
      where: [{ field: 'userId', value: seeded.user.id }],
      update: { expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
    });
    expect(await resolveCaller({ auth, cookie })).toBeNull();
    expect(await seeded.adapter.count({ model: 'session' })).toBe(0);
    expect(await (await get({ auth, path: '/get-session', cookie })).json()).toBeNull();
  });

  test('a banned user is refused at the exchange and at the mint', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    await seeded.adapter.update({
      model: 'user',
      where: [{ field: 'id', value: seeded.user.id }],
      update: { banned: true },
    });
    expect((await exchange({ auth, token })).status).toBe(401);
    expect(lastRefusalReason()).toBe('user is banned');
    await expect(mint({ auth, userId: seeded.user.id })).rejects.toThrow('is banned');
  });

  test('a user with a second factor enrolled is refused', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    await seeded.adapter.update({
      model: 'user',
      where: [{ field: 'id', value: seeded.user.id }],
      update: { twoFactorEnabled: true },
    });
    expect((await exchange({ auth, token })).status).toBe(401);
    expect(lastRefusalReason()).toBe('user has a second factor enrolled');
    await expect(mint({ auth, userId: seeded.user.id })).rejects.toThrow('second factor');
  });

  test('a user who left the organization is refused, and a rejoined member row holds no old token', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    await seeded.adapter.delete({
      model: 'member',
      where: [{ field: 'id', value: seeded.members.default.id }],
    });
    expect((await exchange({ auth, token })).status).toBe(401);
    expect(lastRefusalReason()).toBe('user is not the member the token was made for');
    await seeded.adapter.create({
      model: 'member',
      data: {
        userId: seeded.user.id,
        organizationId: 'default',
        role: 'member',
        createdAt: new Date(),
      },
    });
    expect((await exchange({ auth, token })).status).toBe(401);
    expect(lastRefusalReason()).toBe('user is not the member the token was made for');
  });

  test('a scope the config no longer declares is refused', async () => {
    await seedTokenRow({
      adapter: seeded.adapter,
      token: 'legacy',
      userId: seeded.user.id,
      memberId: seeded.members.default.id,
      scope: 'retired-scope',
    });
    expect((await exchange({ auth, token: 'legacy' })).status).toBe(401);
    expect(lastRefusalReason()).toBe('scope not declared in auth.sessionScopes');
    await expect(mint({ auth, userId: seeded.user.id, scope: 'retired-scope' })).rejects.toThrow(
      'not declared'
    );
  });

  test('the mint refuses an organization other than the pinned one', async () => {
    await expect(
      mint({
        auth,
        userId: seeded.user.id,
        organizationId: 'other',
        organization: { policy: 'pinned', pinned: { id: 'default', slug: 'default' } },
      })
    ).rejects.toThrow("is not this app's pinned organization");
  });

  test('the mint refuses a user with no membership in the organization', async () => {
    await expect(mint({ auth, userId: seeded.user.id, organizationId: 'other' })).rejects.toThrow(
      'no member row'
    );
  });

  test('a token for an organization other than the pinned one is refused', async () => {
    const other = await seed({
      auth,
      memberships: [{ organizationId: 'other', appRoles: ['admin'] }],
    });
    const { token } = await mint({ auth, userId: other.user.id, organizationId: 'other' });
    expect((await exchange({ auth, token })).status).toBe(401);
    expect(lastRefusalReason()).toBe('token organization is not the pinned organization');
  });

  test('a scoped session can not call session-bound auth routes, but can read and end itself', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const cookie = cookieFrom(await exchange({ auth, token }));

    const blocked = await post({
      auth,
      path: '/change-password',
      body: { currentPassword: 'password-1234', newPassword: 'password-5678' },
      cookie,
    });
    expect(blocked.status).toBe(403);
    expect((await blocked.json()).code).toBe('SCOPED_SESSION');
    expect((await post({ auth, path: '/revoke-other-sessions', body: {}, cookie })).status).toBe(
      403
    );
    expect((await get({ auth, path: '/list-sessions', cookie })).status).toBe(403);

    expect((await get({ auth, path: '/get-session', cookie })).status).toBe(200);
    expect((await post({ auth, path: '/sign-out', body: {}, cookie })).status).toBe(200);
  });

  test('an ordinary sign-in opens an unscoped session with the member roles', async () => {
    const { token } = await mint({ auth, userId: seeded.user.id });
    const scopedCookie = cookieFrom(await exchange({ auth, token }));

    const signIn = await post({
      auth,
      path: '/sign-in/email',
      body: { email: 'person@example.com', password: 'password-1234' },
      cookie: scopedCookie,
    });
    expect(signIn.status).toBe(200);
    const cookie = cookieFrom(signIn);

    const session = await (await get({ auth, path: '/get-session', cookie })).json();
    expect(session.session.sessionScope ?? null).toBeNull();
    const caller = await resolveCaller({ auth, cookie });
    expect(caller.roles).toEqual(['admin', 'control-owner']);
    expect(caller.session_scope).toBeUndefined();
  });
});

describe('tenant organizations', () => {
  test('the session opens in the token organization, not the oldest membership', async () => {
    const auth = createAuth({ organizations: tenant });
    const seeded = await seed({
      auth,
      memberships: [
        { organizationId: 'org_a', appRoles: ['viewer'] },
        { organizationId: 'org_b', appRoles: ['admin', 'control-owner'] },
      ],
    });
    const { token } = await mint({ auth, userId: seeded.user.id, organizationId: 'org_b' });
    const cookie = cookieFrom(await exchange({ auth, token }));
    const caller = await resolveCaller({ auth, cookie });
    expect(caller.organization_id).toBe('org_b');
    expect(caller.roles).toEqual(['control-owner']);
  });

  test('a token whose user has no member row in its organization is refused', async () => {
    const auth = createAuth({ organizations: tenant });
    const seeded = await seed({
      auth,
      memberships: [{ organizationId: 'org_a', appRoles: ['viewer'] }],
    });
    await seedTokenRow({
      adapter: seeded.adapter,
      token: 'forged',
      userId: seeded.user.id,
      organizationId: 'org_b',
      memberId: seeded.members.org_a.id,
    });
    expect((await exchange({ auth, token: 'forged' })).status).toBe(401);
    expect(lastRefusalReason()).toBe('user is not the member the token was made for');
  });
});
