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

// A view session on BetterAuth's own handler, /api/auth (pnpm test:mongodb): an
// engine-configured BetterAuth instance on the MongoDB auth adapter, with the
// authorization server on. That handler never passes through
// resolveAuthentication, so the gate is BetterAuth's own
// (buildViewSessionGatePlugin). Every endpoint here is called over the handler,
// as the server's /api/auth route calls it, with a view session, and with the
// same person's ordinary session beside it.

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
const { default: getCallerFingerprint } = await import('../../websocket/getCallerFingerprint.js');
const { default: resolveWebsocketCaller } = await import(
  '../../websocket/resolveWebsocketCaller.js'
);

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
  const database = `viewSessionAuthRoutes${run}`;
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
    passkey: { enabled: true, rpId: 'localhost', rpName: 'Test App' },
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

async function findSessions({ adapter, userId }) {
  return adapter.findMany({
    model: 'session',
    where: [{ field: 'userId', value: userId }],
    sortBy: { field: 'createdAt', direction: 'asc' },
  });
}

function request({ path, body, headers, method = 'POST' }) {
  if (method === 'GET') {
    return new Request(`${ORIGIN}/api/auth${path}`, { method, headers });
  }
  return new Request(`${ORIGIN}/api/auth${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
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

// The person, their ordinary browser session, and a view session minted from
// their grant - sent as a bearer, the way a view sends it, and as the session
// cookie, which whoever holds the signed token can send just as well.
async function setupCallers({ mobile, grantedScopes } = {}) {
  const { adapter, auth, internalAdapter } = await setup({ mobile });
  const email = `ana-${randomUUID()}@example.com`;
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email,
    orgNames: ['Acme', 'Globex'],
  });
  const browserCookie = cookieOf(await signInByCode({ auth, email, headers: browserHeaders }));
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const { token } = await mintViewSession(mcpContext({ auth, grant, grantedScopes }));
  const { authCookies } = await auth.$context;
  return {
    adapter,
    auth,
    browser: { ...browserHeaders, cookie: browserCookie },
    email,
    grant,
    organizationIds,
    token,
    user,
    viewBearer: { ...browserHeaders, authorization: `Bearer ${token}` },
    viewCookie: { ...browserHeaders, cookie: `${authCookies.sessionToken.name}=${token}` },
  };
}

async function call({ auth, headers, endpoint }) {
  const response = await auth.handler(request({ ...endpoint, headers }));
  let body = null;
  try {
    body = await response.clone().json();
  } catch (error) {
    // Not every answer is JSON - a redirect or an empty body is none.
  }
  return { body, response, status: response.status };
}

function expectRefused({ body, status }) {
  expect(status).toBe(403);
  expect(body).toEqual({
    code: 'VIEW_SESSION_REFUSED',
    message: 'A view session cannot be used on this route.',
  });
}

// What a holder of a full session can do on /api/auth, and a view session
// must not: each is refused to the view session and still served to the
// person's ordinary session. status is what the ordinary session gets.
const accountEndpoints = [
  ['the session read', { method: 'GET', path: '/get-session' }, 200],
  ['update user', { path: '/update-user', body: { name: 'Changed' } }, 200],
  ['change email', { path: '/change-email', body: { newEmail: 'other@example.com' } }, null],
  ['list sessions', { method: 'GET', path: '/list-sessions' }, 200],
  ['list organizations', { method: 'GET', path: '/organization/list' }, 200],
  ['register a passkey', { method: 'GET', path: '/passkey/generate-register-options' }, 200],
  ['list passkeys', { method: 'GET', path: '/passkey/list-user-passkeys' }, 200],
  ['list linked accounts', { method: 'GET', path: '/list-accounts' }, 200],
  ['update session', { path: '/update-session', body: {} }, null],
  ['delete user', { path: '/delete-user', body: {} }, null],
  ['change password', { path: '/change-password', body: {} }, null],
  ['OAuth consent', { path: '/oauth2/consent', body: { accept: true } }, null],
  ['OAuth authorize', { method: 'GET', path: '/oauth2/authorize?client_id=x' }, null],
  ['a path BetterAuth does not serve', { method: 'GET', path: '/no-such-endpoint' }, 404],
];

test.each(accountEndpoints)(
  '%s: a view session is refused as a bearer and as a cookie, and an ordinary session is not',
  async (name, endpoint, ordinaryStatus) => {
    const { auth, browser, viewBearer, viewCookie } = await setupCallers();

    expectRefused(await call({ auth, headers: viewBearer, endpoint }));
    expectRefused(await call({ auth, headers: viewCookie, endpoint }));

    const ordinary = await call({ auth, headers: browser, endpoint });
    expect(ordinary.body?.code).not.toBe('VIEW_SESSION_REFUSED');
    if (ordinaryStatus !== null) {
      expect(ordinary.status).toBe(ordinaryStatus);
    }
  }
);

test('the session read hands a view session nothing, and the ordinary session its session', async () => {
  const { auth, browser, user, viewBearer } = await setupCallers();
  const endpoint = { method: 'GET', path: '/get-session' };
  const refused = await call({ auth, headers: viewBearer, endpoint });
  expectRefused(refused);
  expect(refused.response.headers.get('set-cookie')).toBeNull();
  expect(refused.response.headers.get('set-auth-token')).toBeNull();
  const ordinary = await call({ auth, headers: browser, endpoint });
  expect(ordinary.body.user.id).toBe(user.id);
});

test('update user with a view session changes nothing', async () => {
  const { adapter, auth, browser, user, viewBearer } = await setupCallers();
  const endpoint = { path: '/update-user', body: { name: 'Changed by a view' } };
  expectRefused(await call({ auth, headers: viewBearer, endpoint }));
  const findUser = () =>
    adapter.findOne({ model: 'user', where: [{ field: 'id', value: user.id }] });
  expect((await findUser()).name).toBe(user.name);

  const ordinary = await call({
    auth,
    headers: browser,
    endpoint: { path: '/update-user', body: { name: 'Changed by the person' } },
  });
  expect(ordinary.status).toBe(200);
  expect((await findUser()).name).toBe('Changed by the person');
});

test('revoking sessions with a view session ends no session, and the ordinary session can', async () => {
  const { adapter, auth, browser, token, user, viewBearer, viewCookie } = await setupCallers();
  const before = await findSessions({ adapter, userId: user.id });
  expect(before).toHaveLength(2);
  const browserSession = before.find((session) => session.view !== true);

  for (const headers of [viewBearer, viewCookie]) {
    expectRefused(await call({ auth, headers, endpoint: { path: '/revoke-sessions' } }));
    expectRefused(await call({ auth, headers, endpoint: { path: '/revoke-other-sessions' } }));
    expectRefused(
      await call({
        auth,
        headers,
        endpoint: { path: '/revoke-session', body: { token: browserSession.token } },
      })
    );
    expectRefused(await call({ auth, headers, endpoint: { path: '/sign-out' } }));
  }
  expect(await findSessions({ adapter, userId: user.id })).toHaveLength(2);
  expect((await resolveCaller({ auth, cookie: browser.cookie })).user.id).toBe(user.id);
  expect((await resolveCaller({ auth, token })).user.id).toBe(user.id);

  // The person's own session ends the view session with the others.
  const revoked = await call({
    auth,
    headers: browser,
    endpoint: { path: '/revoke-other-sessions' },
  });
  expect(revoked.status).toBe(200);
  const after = await findSessions({ adapter, userId: user.id });
  expect(after.map((session) => session.id)).toEqual([browserSession.id]);
  expect((await resolveCaller({ auth, token })).user).toBeNull();

  const signedOut = await call({ auth, headers: browser, endpoint: { path: '/sign-out' } });
  expect(signedOut.status).toBe(200);
  expect(await findSessions({ adapter, userId: user.id })).toHaveLength(0);
});

test('setting the active organization with a view session leaves it in its grant organization', async () => {
  const { adapter, auth, browser, organizationIds, user, viewBearer, viewCookie } =
    await setupCallers();
  const endpoint = {
    path: '/organization/set-active',
    body: { organizationId: organizationIds[1] },
  };
  expectRefused(await call({ auth, headers: viewBearer, endpoint }));
  expectRefused(await call({ auth, headers: viewCookie, endpoint }));
  const viewSession = (await findSessions({ adapter, userId: user.id })).find(
    (session) => session.view === true
  );
  expect(viewSession.activeOrganizationId).toBe(organizationIds[0]);

  const ordinary = await call({ auth, headers: browser, endpoint });
  expect(ordinary.status).toBe(200);
  const browserSession = (await findSessions({ adapter, userId: user.id })).find(
    (session) => session.view !== true
  );
  expect(browserSession.activeOrganizationId).toBe(organizationIds[1]);
});

test('a request carrying an ordinary cookie and a view bearer is refused', async () => {
  const { auth, browser, token } = await setupCallers();
  expectRefused(
    await call({
      auth,
      headers: { ...browser, authorization: `Bearer ${token}` },
      endpoint: { path: '/update-user', body: { name: 'Changed' } },
    })
  );
});

test('a view session on a read-and-write grant is refused on /api/auth all the same', async () => {
  const { auth, viewBearer } = await setupCallers({ grantedScopes: ['mcp:read', 'mcp:write'] });
  expectRefused(
    await call({ auth, headers: viewBearer, endpoint: { method: 'GET', path: '/list-sessions' } })
  );
});

test('the in-process session read still resolves a view session, so the app routes know it as one', async () => {
  const { auth, grant, token, user } = await setupCallers();
  expectRefused(
    await call({
      auth,
      headers: { ...browserHeaders, authorization: `Bearer ${token}` },
      endpoint: { method: 'GET', path: '/get-session' },
    })
  );
  const resolved = await resolveCaller({ auth, token });
  expect(resolved.user.id).toBe(user.id);
  expect(resolved.viewSession).toEqual({
    clientId: grant.clientId,
    grantedScopes: ['mcp:read', 'mcp:write'],
  });
});

test('sign-in and the public endpoints still answer a caller with no session', async () => {
  const { auth, email } = await setupCallers();
  const anonymous = await call({
    auth,
    headers: browserHeaders,
    endpoint: { method: 'GET', path: '/get-session' },
  });
  expect(anonymous.status).toBe(200);
  expect(anonymous.body).toBeNull();
  const signIn = await signInByCode({ auth, email, headers: browserHeaders });
  expect(signIn.status).toBe(200);
  // A bearer that is no session token - an API client's own credential.
  const foreign = await call({
    auth,
    headers: { ...browserHeaders, authorization: 'Bearer not-a-session.token' },
    endpoint: { method: 'GET', path: '/get-session' },
  });
  expect(foreign.status).toBe(200);
  expect(foreign.body).toBeNull();
});

test('a phone session bearer works on /api/auth as before, beside a refused view session', async () => {
  const mobile = {
    shells: [{ id: 'field', scheme: 'com.example.field', androidAppLink: false }],
    sessionExpiresIn: 30 * DAY,
  };
  const { adapter, auth, email, user, viewBearer } = await setupCallers({ mobile });
  const phoneToken = (await signInByCode({ auth, email, headers: nativeHeaders })).headers.get(
    'set-auth-token'
  );
  expect(phoneToken).not.toBeNull();
  const phone = { ...nativeHeaders, authorization: `Bearer ${phoneToken}` };

  const session = await call({
    auth,
    headers: phone,
    endpoint: { method: 'GET', path: '/get-session' },
  });
  expect(session.status).toBe(200);
  expect(session.body.user.id).toBe(user.id);
  const sessions = await call({
    auth,
    headers: phone,
    endpoint: { method: 'GET', path: '/list-sessions' },
  });
  expect(sessions.status).toBe(200);
  const updated = await call({
    auth,
    headers: phone,
    endpoint: { path: '/update-user', body: { name: 'Changed on the phone' } },
  });
  expect(updated.status).toBe(200);
  expect(
    (await adapter.findOne({ model: 'user', where: [{ field: 'id', value: user.id }] })).name
  ).toBe('Changed on the phone');

  expectRefused(
    await call({ auth, headers: viewBearer, endpoint: { method: 'GET', path: '/get-session' } })
  );

  const signedOut = await call({ auth, headers: phone, endpoint: { path: '/sign-out' } });
  expect(signedOut.status).toBe(200);
  expect((await resolveCaller({ auth, token: phoneToken })).user).toBeNull();
});

test('a view session minted before the app lost its views is still refused as a cookie', async () => {
  const { adapter, auth, internalAdapter } = await setup({ views: false });
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'old@example.com',
  });
  const grant = await createGrant({ adapter, organizationId: organizationIds[0], userId: user.id });
  const { token } = await mintViewSession(mcpContext({ auth, grant }));
  const { authCookies } = await auth.$context;
  expectRefused(
    await call({
      auth,
      headers: { ...browserHeaders, cookie: `${authCookies.sessionToken.name}=${token}` },
      endpoint: { path: '/update-user', body: { name: 'Changed' } },
    })
  );
});

// The websocket connection resolves its caller again once a minute from the
// upgrade's headers and closes when the caller's fingerprint changed
// (createWebSocketConnection). These are that check's two inputs.
test('the websocket caller check stops vouching for a view session that expired or whose grant was revoked', async () => {
  const { adapter, auth, grant, token, user } = await setupCallers();
  const headers = new Headers({ authorization: `Bearer ${token}` });
  const context = { auth, config: {}, logger: createLogger() };
  const opened = await resolveCaller({ auth, token });
  const fingerprint = getCallerFingerprint({ user: opened.user });
  expect(fingerprint).not.toBeNull();

  const still = await resolveWebsocketCaller(context, { headers, strategies: [] });
  expect(getCallerFingerprint({ user: still })).toBe(fingerprint);

  const [viewSession] = (await findSessions({ adapter, userId: user.id })).filter(
    (session) => session.view === true
  );
  await adapter.update({
    model: 'session',
    where: [{ field: 'id', value: viewSession.id }],
    update: { createdAt: new Date(Date.now() - 16 * MINUTE) },
  });
  const expired = await resolveWebsocketCaller(context, { headers, strategies: [] });
  expect(expired).toBeNull();
  expect(getCallerFingerprint({ user: expired })).not.toBe(fingerprint);

  // A second view session, ended by its grant being revoked.
  const second = await mintViewSession(mcpContext({ auth, grant }));
  const secondHeaders = new Headers({ authorization: `Bearer ${second.token}` });
  expect(
    getCallerFingerprint({
      user: await resolveWebsocketCaller(context, { headers: secondHeaders, strategies: [] }),
    })
  ).toBe(fingerprint);
  await adapter.delete({
    model: 'oauthConsent',
    where: [
      { field: 'clientId', value: grant.clientId },
      { field: 'userId', value: user.id },
      { field: 'referenceId', value: grant.organizationId },
    ],
  });
  expect(
    await resolveWebsocketCaller(context, { headers: secondHeaders, strategies: [] })
  ).toBeNull();
});
