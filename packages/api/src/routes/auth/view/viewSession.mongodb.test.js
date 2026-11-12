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

// View sessions end to end (pnpm test:mongodb): an engine-configured BetterAuth
// instance on the MongoDB auth adapter, with the authorization server on. A
// view session is minted the way the MCP route mints it (mintViewSession, for
// the caller and grant that route resolved), sent back as "Authorization:
// Bearer", and the caller resolved the way every general route resolves it
// (resolveAuthentication).

import { randomUUID } from 'node:crypto';
import { vi, afterAll, beforeAll, expect, test } from 'vitest';
import * as mongodb from 'mongodb';

// The adapter keeps its client for the process lifetime, so the test records
// every client it creates and closes them afterwards.
const clients = [];
class RecordingMongoClient extends mongodb.MongoClient {
  constructor(...args) {
    super(...args);
    clients.push(this);
  }
}

vi.doMock('mongodb', () => ({ ...mongodb, MongoClient: RecordingMongoClient }));

vi.doMock('../../../email/renderAuthEmail.js', () => ({
  default: vi.fn(async ({ flow, vars }) => ({ subject: flow, html: '', text: '', vars })),
}));
vi.doMock('../createSendEmail.js', () => ({
  default: () => async function sendEmail() {},
}));

const renderAuthEmail = (await import('../../../email/renderAuthEmail.js')).default;
const { betterAuth } = await import('better-auth');
const { MongoDBAuthAdapter } = await import('@lowdefy/connection-mongodb/auth/adapters');
const { default: getBetterAuthConfig } = await import('../getBetterAuthConfig.js');
const { default: ensureAuthIndexes } = await import('../organizations/ensureAuthIndexes.js');
const { registerOrganizationBinding } = await import('../organizations/getOrganizationBinding.js');
const { default: resolveAuthentication } = await import(
  '../../../context/resolveAuthentication.js'
);
const { default: mintViewSession } = await import('./mintViewSession.js');

const ORIGIN = 'http://localhost:3264';
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60;
const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

let client;
let run = 0;

beforeAll(async () => {
  process.env.BETTER_AUTH_URL = ORIGIN;
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
});

afterAll(async () => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
  await Promise.all([client, ...clients].map((each) => each.close()));
});

function createLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    isLevelEnabled: vi.fn(() => false),
  };
}

const organizations = { policy: 'tenant', signup: 'invite-only', create: 'operator' };

// views: false builds an app whose MCP block has no view; mobile adds a mobile
// section.
async function setup({ mobile, views = true } = {}) {
  run += 1;
  const database = `viewSession${run}`;
  const logger = createLogger();
  const authJson = {
    configured: true,
    secret: { _secret: 'BETTER_AUTH_SECRET' },
    database: {
      id: 'auth_db',
      type: 'MongoDBAuthAdapter',
      properties: { uri: process.env.MONGO_URL, database },
    },
    providers: [],
    email: { connectionId: 'mail' },
    emailOTP: {
      enabled: true,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      disableSignUp: true,
    },
    session: {
      expiresIn: 7 * DAY,
      updateAge: DAY,
      cookieCache: { enabled: false, maxAge: 300 },
      crossSubDomainCookies: { enabled: false },
    },
    account: { accountLinking: { enabled: true, trustedProviders: [] } },
    rateLimit: { enabled: false, window: 60, max: 100 },
    authPages: { signIn: '/login', error: '/auth/error' },
    oauthProvider: { consentPage: '/consent' },
    api: { roles: {} },
    pages: { roles: {} },
    websockets: { roles: {} },
    organizations,
    roles: [],
    mobile,
  };
  let auth;
  auth = betterAuth(
    getBetterAuthConfig({
      appMeta: { name: 'Test App', slug: 'test-app' },
      authJson,
      createSystemContext: () => ({}),
      getAuth: () => auth,
      logger,
      mcpJson: { configured: true, views: { configured: views, pages: {}, sources: [] } },
      plugins: { adapters: { MongoDBAuthAdapter }, providers: {} },
      secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
    })
  );
  registerOrganizationBinding({ auth, database: true, organizations });
  await ensureAuthIndexes({ auth, logger });
  const { adapter, internalAdapter } = await auth.$context;
  return { adapter, auth, internalAdapter, logger };
}

// The first organization is the oldest membership - the one the organization
// policy picks for a new session.
async function createMember({ adapter, internalAdapter, email, orgNames = ['Acme'] }) {
  const user = await internalAdapter.createUser({ email, name: email, emailVerified: true });
  const organizationIds = [];
  for (const [index, name] of orgNames.entries()) {
    const organization = await adapter.create({
      model: 'organization',
      data: { name, slug: `${name.toLowerCase()}-${randomUUID()}`, createdAt: new Date() },
    });
    await adapter.create({
      model: 'member',
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: 'member',
        appRoles: ['field'],
        createdAt: new Date(Date.now() + index * 1000),
      },
    });
    organizationIds.push(organization.id);
  }
  return { user, organizationIds };
}

// The grant: the consent row the authorization server keeps per (client, user,
// organization).
async function createGrant({
  adapter,
  clientId = 'https://client.example.com/metadata.json',
  organizationId,
  scopes = ['mcp:read', 'mcp:write', 'offline_access'],
  userId,
}) {
  await adapter.create({
    model: 'oauthConsent',
    data: {
      clientId,
      userId,
      referenceId: organizationId,
      scopes,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return { clientId, organizationId, userId };
}

// The context the /api/mcp route hands a tool call made with an OAuth access
// token for the grant.
function mcpContext({ auth, grant, grantedScopes = ['mcp:read', 'mcp:write'] }) {
  return {
    auth,
    config: {},
    logger: createLogger(),
    mcpAuth: {
      clientId: grant.clientId,
      organizationId: grant.organizationId,
      tokenStatus: 'valid',
      parseableJwt: true,
      grantedScopes,
    },
    user: { id: grant.userId, auth_method: 'mcp' },
  };
}

async function resolveCaller({ auth, token, cookie, mcp }) {
  const headers = new Headers();
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  if (cookie) {
    headers.set('cookie', cookie);
  }
  const context = { config: {}, logger: createLogger() };
  await resolveAuthentication(context, { auth, headers, strategies: [], mcp });
  return context;
}

async function findViewSessions({ adapter, userId }) {
  const sessions = await adapter.findMany({
    model: 'session',
    where: [{ field: 'userId', value: userId }],
    sortBy: { field: 'createdAt', direction: 'asc' },
  });
  return sessions.filter((session) => session.view === true);
}

function request({ path, body, headers }) {
  return new Request(`${ORIGIN}/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function signInByCode({ auth, email, headers }) {
  const sendResponse = await auth.handler(
    request({
      path: '/email-otp/send-verification-otp',
      body: { email, type: 'sign-in' },
      headers,
    })
  );
  expect(sendResponse.status).toBe(200);
  const { otp } = renderAuthEmail.mock.calls.at(-1)[0].vars;
  return auth.handler(request({ path: '/sign-in/email-otp', body: { email, otp }, headers }));
}

function cookieOf(response) {
  return response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .filter((pair) => !pair.endsWith('='))
    .join('; ');
}

const browserHeaders = { origin: ORIGIN };
const nativeHeaders = { 'x-lowdefy-shell': '7.1.0' };

test('a view session is minted for the caller in the grant organization and resolves as that member', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'ana@example.com',
    orgNames: ['Acme', 'Globex'],
  });
  // The grant is in the newer organization, not the one the policy hook picks.
  const grant = await createGrant({ adapter, organizationId: organizationIds[1], userId: user.id });
  const context = mcpContext({ auth, grant, grantedScopes: ['mcp:read'] });

  const before = Date.now();
  const { token, expiresAt } = await mintViewSession(context);
  expect(expiresAt.getTime() - before).toBeGreaterThanOrEqual(15 * MINUTE);
  expect(expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(15 * MINUTE);

  const [session] = await findViewSessions({ adapter, userId: user.id });
  expect(session.view).toBe(true);
  expect(session.viewClientId).toBe(grant.clientId);
  expect(session.viewScopes).toBe('mcp:read');
  expect(session.activeOrganizationId).toBe(organizationIds[1]);
  expect(session.mobile).not.toBe(true);
  expect(new Date(session.expiresAt)).toEqual(expiresAt);
  // The signed form, never the stored token.
  expect(token).not.toBe(session.token);
  expect(decodeURIComponent(token).split('.')[0]).toBe(session.token);

  expect(context.logger.info).toHaveBeenCalledTimes(1);
  expect(context.logger.info.mock.calls[0][0]).toMatchObject({
    event: 'mcp_view_session_minted',
    sessionId: session.id,
  });

  const resolved = await resolveCaller({ auth, token });
  expect(resolved.user).toMatchObject({
    id: user.id,
    roles: ['field'],
    organization_id: organizationIds[1],
  });
  expect(resolved.user.auth_method).toBeUndefined();
  expect(resolved.viewSession).toEqual({ clientId: grant.clientId, grantedScopes: ['mcp:read'] });
  expect(resolved.authSession).toEqual({
    id: session.id,
    memberOrganizationIds: expect.arrayContaining(organizationIds),
  });
});

test('reading a view session never slides its expiry forward', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'ben@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const { token, expiresAt } = await mintViewSession(mcpContext({ auth, grant }));

  // With fifteen minutes left of a seven-day lifetime the session is due a
  // refresh on every read: BetterAuth would move the expiry seven days out.
  const headers = new Headers({ authorization: `Bearer ${token}` });
  const read = await auth.api.getSession({ headers });
  expect(read.session.view).toBe(true);
  expect(new Date(read.session.expiresAt)).toEqual(expiresAt);
  expect(read.session.token).toBeUndefined();

  expect((await resolveCaller({ auth, token })).user).not.toBeNull();
  expect((await resolveCaller({ auth, token })).user).not.toBeNull();
  const [session] = await findViewSessions({ adapter, userId: user.id });
  expect(new Date(session.expiresAt)).toEqual(expiresAt);

  // A browser session in the same app still slides: the hold is the view's alone.
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'ben@example.com', headers: browserHeaders })
  );
  const [browser] = (
    await adapter.findMany({ model: 'session', where: [{ field: 'userId', value: user.id }] })
  ).filter((each) => each.view !== true);
  await adapter.update({
    model: 'session',
    where: [{ field: 'id', value: browser.id }],
    update: { expiresAt: new Date(Date.now() + 5 * DAY * 1000) },
  });
  expect((await resolveCaller({ auth, cookie })).viewSession).toBeNull();
  const browserAfter = await adapter.findOne({
    model: 'session',
    where: [{ field: 'id', value: browser.id }],
  });
  expect(new Date(browserAfter.expiresAt).getTime() - Date.now()).toBeGreaterThan(6.9 * DAY * 1000);
});

test('a view session stops at its expiry, and at fifteen minutes of age even with a later expiry', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'cy@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });

  const expired = await mintViewSession(mcpContext({ auth, grant }));
  const aged = await mintViewSession(mcpContext({ auth, grant }));
  const [expiredRow, agedRow] = await findViewSessions({ adapter, userId: user.id });
  expect((await resolveCaller({ auth, token: expired.token })).user).not.toBeNull();
  expect((await resolveCaller({ auth, token: aged.token })).user).not.toBeNull();

  await adapter.update({
    model: 'session',
    where: [{ field: 'id', value: expiredRow.id }],
    update: { expiresAt: new Date(Date.now() - 1000) },
  });
  expect((await resolveCaller({ auth, token: expired.token })).user).toBeNull();

  // Sixteen minutes old with an expiry a week out, as if something had slid it.
  await adapter.update({
    model: 'session',
    where: [{ field: 'id', value: agedRow.id }],
    update: {
      createdAt: new Date(Date.now() - 16 * MINUTE),
      expiresAt: new Date(Date.now() + 7 * DAY * 1000),
    },
  });
  const resolved = await resolveCaller({ auth, token: aged.token });
  expect(resolved.user).toBeNull();
  expect(resolved.viewSession).toBeNull();
});

test('a revoked grant stops its view sessions at once, and a narrowed one caps them', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'dee@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const { token } = await mintViewSession(mcpContext({ auth, grant }));
  expect((await resolveCaller({ auth, token })).viewSession.grantedScopes).toEqual([
    'mcp:read',
    'mcp:write',
  ]);

  const consentWhere = [
    { field: 'clientId', value: grant.clientId },
    { field: 'userId', value: user.id },
    { field: 'referenceId', value: organizationIds[0] },
  ];
  await adapter.update({
    model: 'oauthConsent',
    where: consentWhere,
    update: { scopes: ['mcp:read'] },
  });
  expect((await resolveCaller({ auth, token })).viewSession.grantedScopes).toEqual(['mcp:read']);

  await adapter.delete({ model: 'oauthConsent', where: consentWhere });
  const resolved = await resolveCaller({ auth, token });
  expect(resolved.user).toBeNull();
  expect(resolved.viewSession).toBeNull();
  expect(resolved.authSession).toBeNull();
});

test('a grant holds twenty view sessions: minting another ends the oldest and leaves other grants alone', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'eli@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const otherGrant = await createGrant({
    adapter,
    clientId: 'https://other.example.com/metadata.json',
    organizationId: organizationIds[0],
    userId: user.id,
  });
  const other = await mintViewSession(mcpContext({ auth, grant: otherGrant }));

  const tokens = [];
  for (let index = 0; index < 20; index += 1) {
    tokens.push((await mintViewSession(mcpContext({ auth, grant }))).token);
  }
  const ofGrant = async () =>
    (await findViewSessions({ adapter, userId: user.id })).filter(
      (session) => session.viewClientId === grant.clientId
    );
  expect(await ofGrant()).toHaveLength(20);
  expect((await resolveCaller({ auth, token: tokens[0] })).user).not.toBeNull();

  const context = mcpContext({ auth, grant });
  const newest = await mintViewSession(context);
  expect(context.logger.info.mock.calls[0][0].pruned).toBe(1);
  expect(await ofGrant()).toHaveLength(20);
  expect((await resolveCaller({ auth, token: tokens[0] })).user).toBeNull();
  expect((await resolveCaller({ auth, token: tokens[1] })).user).not.toBeNull();
  expect((await resolveCaller({ auth, token: newest.token })).user).not.toBeNull();
  expect((await resolveCaller({ auth, token: other.token })).user).not.toBeNull();
});

test('a member token and an anonymous caller are refused and no session is made', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'fay@example.com',
  });
  const memberToken = {
    auth,
    config: {},
    logger: createLogger(),
    mcpAuth: {
      tokenStatus: 'valid',
      tokenId: 'token_1',
      organizationId: organizationIds[0],
      grantedScopes: ['mcp:read', 'mcp:write'],
    },
    user: { id: user.id, auth_method: 'mcp' },
  };
  await expect(mintViewSession(memberToken)).rejects.toMatchObject({ name: 'AuthorizationError' });
  const anonymous = {
    auth,
    config: {},
    logger: createLogger(),
    mcpAuth: { tokenStatus: 'none', parseableJwt: true },
    user: null,
  };
  await expect(mintViewSession(anonymous)).rejects.toMatchObject({ name: 'AuthenticationError' });
  expect(
    await adapter.findMany({ model: 'session', where: [{ field: 'userId', value: user.id }] })
  ).toHaveLength(0);
});

test('a view session is refused on the MCP route, and an MCP access token on the general routes', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'gus@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const { token } = await mintViewSession(mcpContext({ auth, grant }));

  const onMcp = await resolveCaller({ auth, token, mcp: true });
  expect(onMcp.user).toBeNull();
  expect(onMcp.mcpAuth.tokenStatus).toBe('invalid');
  expect(onMcp.viewSession).toBeNull();

  // An access token for the MCP resource: refused on its audience alone, so
  // no strategy is ever offered it.
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = `${encode({ alg: 'EdDSA' })}.${encode({
    aud: `${ORIGIN}/api/mcp`,
    sub: user.id,
  })}.signature`;
  const headers = new Headers({ authorization: `Bearer ${accessToken}` });
  const strategy = { id: 'jwt', type: 'jwt', roles: [], attributes: {}, verify: vi.fn() };
  const general = { config: {}, logger: createLogger() };
  await resolveAuthentication(general, { auth, headers, strategies: [strategy] });
  expect(general.user).toBeNull();
  expect(general.viewSession).toBeNull();
  expect(strategy.verify).not.toHaveBeenCalled();
});

test('a banned user, a removed member and a suspended member holding a view session resolve unauthenticated', async () => {
  const { adapter, auth, internalAdapter } = await setup();

  const banned = await createMember({ adapter, internalAdapter, email: 'hal@example.com' });
  const bannedGrant = await createGrant({
    adapter,
    organizationId: banned.organizationIds[0],
    userId: banned.user.id,
  });
  const bannedToken = (await mintViewSession(mcpContext({ auth, grant: bannedGrant }))).token;
  expect((await resolveCaller({ auth, token: bannedToken })).user).not.toBeNull();
  // The row is kept: the ban alone must stop it.
  await adapter.update({
    model: 'user',
    where: [{ field: 'id', value: banned.user.id }],
    update: { banned: true },
  });
  expect((await resolveCaller({ auth, token: bannedToken })).user).toBeNull();

  const suspended = await createMember({ adapter, internalAdapter, email: 'ida@example.com' });
  const suspendedGrant = await createGrant({
    adapter,
    organizationId: suspended.organizationIds[0],
    userId: suspended.user.id,
  });
  const suspendedToken = (await mintViewSession(mcpContext({ auth, grant: suspendedGrant }))).token;
  expect((await resolveCaller({ auth, token: suspendedToken })).user).not.toBeNull();
  await adapter.update({
    model: 'member',
    where: [{ field: 'userId', value: suspended.user.id }],
    update: { suspended: true },
  });
  const suspendedCaller = await resolveCaller({ auth, token: suspendedToken });
  expect(suspendedCaller.user).toBeNull();
  expect(suspendedCaller.viewSession).toBeNull();

  const removed = await createMember({ adapter, internalAdapter, email: 'jo@example.com' });
  const removedGrant = await createGrant({
    adapter,
    organizationId: removed.organizationIds[0],
    userId: removed.user.id,
  });
  const removedToken = (await mintViewSession(mcpContext({ auth, grant: removedGrant }))).token;
  expect((await resolveCaller({ auth, token: removedToken })).user).not.toBeNull();
  await adapter.deleteMany({
    model: 'member',
    where: [{ field: 'userId', value: removed.user.id }],
  });
  const removedCaller = await resolveCaller({ auth, token: removedToken });
  expect(removedCaller.user).toBeNull();
  expect(removedCaller.viewSession).toBeNull();
});

test('with a view and no mobile section the bearer works and no response carries the session token header', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'kit@example.com',
  });

  const browser = await signInByCode({ auth, email: 'kit@example.com', headers: browserHeaders });
  expect(browser.status).toBe(200);
  expect(browser.headers.get('set-auth-token')).toBeNull();
  expect(cookieOf(browser)).toContain('session_token');
  // Nor does a request shaped like a phone's: this app has no phones.
  const native = await signInByCode({ auth, email: 'kit@example.com', headers: nativeHeaders });
  expect(native.status).toBe(200);
  expect(native.headers.get('set-auth-token')).toBeNull();

  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const { token } = await mintViewSession(mcpContext({ auth, grant }));
  expect((await resolveCaller({ auth, token })).user.id).toBe(user.id);

  // Only the value BetterAuth's secret signed is a session.
  const [unsigned] = decodeURIComponent(token).split('.');
  expect((await resolveCaller({ auth, token: unsigned })).user).toBeNull();
  expect((await resolveCaller({ auth, token: `${unsigned}.forged` })).user).toBeNull();
});

test('a view session token resolves no caller in an app with no view and no mobile section', async () => {
  const { adapter, auth, internalAdapter } = await setup({ views: false });
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'lou@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const { token } = await mintViewSession(mcpContext({ auth, grant }));
  expect((await resolveCaller({ auth, token })).user).toBeNull();
});

test('an app with a view and phones keeps both marks apart, each session on its own lifetime', async () => {
  const mobile = {
    shells: [{ id: 'field', scheme: 'com.example.field', androidAppLink: false }],
    sessionExpiresIn: 30 * DAY,
  };
  const { adapter, auth, internalAdapter } = await setup({ mobile });
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'max@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });

  const phoneToken = (
    await signInByCode({ auth, email: 'max@example.com', headers: nativeHeaders })
  ).headers.get('set-auth-token');
  expect(phoneToken).not.toBeNull();
  const view = await mintViewSession(mcpContext({ auth, grant }));

  const findBoth = async () => {
    const sessions = await adapter.findMany({
      model: 'session',
      where: [{ field: 'userId', value: user.id }],
    });
    return {
      phone: sessions.find((session) => session.mobile === true),
      viewRow: sessions.find((session) => session.view === true),
    };
  };
  const daysLeft = (session) => (new Date(session.expiresAt).getTime() - Date.now()) / (DAY * 1000);

  let { phone, viewRow } = await findBoth();
  expect(phone.view).not.toBe(true);
  expect(viewRow.mobile).not.toBe(true);
  expect(daysLeft(phone)).toBeCloseTo(30, 1);
  expect(new Date(viewRow.expiresAt)).toEqual(view.expiresAt);

  // Both due a refresh: the phone's slides by the phone lifetime, the view's holds.
  await adapter.update({
    model: 'session',
    where: [{ field: 'id', value: phone.id }],
    update: { expiresAt: new Date(Date.now() + 5 * DAY * 1000) },
  });
  const phoneCaller = await resolveCaller({ auth, token: phoneToken });
  expect(phoneCaller.user).not.toBeNull();
  expect(phoneCaller.viewSession).toBeNull();
  const viewCaller = await resolveCaller({ auth, token: view.token });
  expect(viewCaller.user).not.toBeNull();
  expect(viewCaller.viewSession).toEqual({
    clientId: grant.clientId,
    grantedScopes: ['mcp:read', 'mcp:write'],
  });

  ({ phone, viewRow } = await findBoth());
  expect(daysLeft(phone)).toBeCloseTo(30, 1);
  expect(new Date(viewRow.expiresAt)).toEqual(view.expiresAt);
});

test('no client-writable body sets the view marks', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'ned@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'ned@example.com', headers: browserHeaders })
  );
  const response = await auth.handler(
    request({
      path: '/update-session',
      body: { view: true, viewClientId: 'client_1', viewScopes: 'mcp:write' },
      headers: { ...browserHeaders, cookie },
    })
  );
  expect(response.status).toBe(400);
  expect(await findViewSessions({ adapter, userId: user.id })).toHaveLength(0);
  expect((await resolveCaller({ auth, cookie })).viewSession).toBeNull();
});
