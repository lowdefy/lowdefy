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

// Phone sign-in end to end (pnpm test:mongodb): an engine-configured BetterAuth
// instance on the MongoDB auth adapter, called the way a phone shell calls it -
// HTTP requests with no Origin and no cookies, the session sent back as
// "Authorization: Bearer" - and the caller resolved the way every /api/request,
// /api/endpoints and websocket call resolves it (resolveAuthentication).

import { randomUUID } from 'node:crypto';
import { jest } from '@jest/globals';
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

jest.unstable_mockModule('mongodb', () => ({ ...mongodb, MongoClient: RecordingMongoClient }));

// Every email the engine sends: the flow and its variables (the code), and the
// address it went to.
const sent = [];
jest.unstable_mockModule('../../../email/renderAuthEmail.js', () => ({
  default: jest.fn(async ({ flow, vars }) => ({ subject: flow, html: '', text: '', vars })),
}));
jest.unstable_mockModule('../createSendEmail.js', () => ({
  default: () =>
    async function sendEmail({ to, subject }) {
      sent.push({ to, flow: subject });
    },
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
const { default: createWebSocketConnection } = await import(
  '../../websocket/createWebSocketConnection.js'
);
const { default: handleMobileSignIn } = await import('./handleMobileSignIn.js');

const ORIGIN = 'http://localhost:3264';
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

beforeEach(() => {
  sent.length = 0;
});

function createLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isLevelEnabled: jest.fn(() => false),
  };
}

const organizations = { policy: 'tenant', signup: 'invite-only', create: 'operator' };

async function setup({ cookieCache = false, mobile, twoFactor } = {}) {
  run += 1;
  const database = `bearerSession${run}`;
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
      cookieCache: { enabled: cookieCache, maxAge: 300 },
      crossSubDomainCookies: { enabled: false },
    },
    account: { accountLinking: { enabled: true, trustedProviders: [] } },
    rateLimit: { enabled: false, window: 60, max: 100 },
    authPages: { signIn: '/login', error: '/auth/error', twoFactor: '/two-factor' },
    twoFactor,
    api: { roles: {} },
    pages: { roles: {} },
    websockets: { roles: {} },
    organizations,
    roles: [],
    mobile: mobile ?? {
      shells: [{ id: 'field', scheme: 'com.example.field' }],
      sessionExpiresIn: null,
    },
  };
  let auth;
  auth = betterAuth(
    getBetterAuthConfig({
      appMeta: { name: 'Test App', slug: 'test-app' },
      authJson,
      createSystemContext: () => ({}),
      getAuth: () => auth,
      logger,
      plugins: { adapters: { MongoDBAuthAdapter }, providers: {} },
      secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
    })
  );
  registerOrganizationBinding({ auth, database: true, organizations });
  await ensureAuthIndexes({ auth, logger });
  const { adapter, internalAdapter } = await auth.$context;
  return { adapter, auth, authJson, db: client.db(database), internalAdapter, logger };
}

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

// A phone's request: no Origin, no cookies, the session as a bearer.
function nativeRequest({ path, method = 'POST', body, token }) {
  const headers = { 'content-type': 'application/json' };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  return new Request(`${ORIGIN}/api/auth${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// A browser's request: same-origin, with its cookies.
function browserRequest({ path, method = 'POST', body, cookie }) {
  const headers = { 'content-type': 'application/json', origin: ORIGIN };
  if (cookie) {
    headers.cookie = cookie;
  }
  return new Request(`${ORIGIN}/api/auth${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function lastCode() {
  const call = renderAuthEmail.mock.calls.at(-1);
  return call[0].vars.otp;
}

function cookieOf(response) {
  return response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .filter((pair) => !pair.endsWith('='))
    .join('; ');
}

async function signInByCode({ auth, email, request = nativeRequest }) {
  const sendResponse = await auth.handler(
    request({ path: '/email-otp/send-verification-otp', body: { email, type: 'sign-in' } })
  );
  expect(sendResponse.status).toBe(200);
  return auth.handler(request({ path: '/sign-in/email-otp', body: { email, otp: lastCode() } }));
}

async function resolveCaller({ auth, token, cookie }) {
  const headers = new Headers();
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  if (cookie) {
    headers.set('cookie', cookie);
  }
  const context = { config: {}, logger: createLogger() };
  await resolveAuthentication(context, { auth, headers, strategies: [] });
  return context;
}

test('a phone signs in by email code, gets the session token in set-auth-token and calls as that member', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'ana@example.com',
  });

  const response = await signInByCode({ auth, email: 'ana@example.com' });
  expect(response.status).toBe(200);
  const token = response.headers.get('set-auth-token');
  expect(typeof token).toBe('string');
  expect(sent).toEqual([{ to: 'ana@example.com', flow: 'emailOTP' }]);

  const context = await resolveCaller({ auth, token });
  expect(context.user).toMatchObject({
    id: user.id,
    email: 'ana@example.com',
    roles: ['field'],
    organization_id: organizationIds[0],
  });
  // The caller stamp the /api/request, /api/endpoints and /api/page responses carry.
  expect(context.authSession).toEqual({
    id: expect.any(String),
    memberOrganizationIds: [organizationIds[0]],
  });
});

test('a browser signing in by email code gets its cookie and never the session token header', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'ben@example.com' });

  const response = await signInByCode({
    auth,
    email: 'ben@example.com',
    request: browserRequest,
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('set-auth-token')).toBeNull();
  expect(cookieOf(response)).toMatch(/session_token=/);
});

test('an unsigned or foreign bearer resolves no session', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'cara@example.com' });
  const response = await signInByCode({ auth, email: 'cara@example.com' });
  const token = response.headers.get('set-auth-token');
  const unsigned = decodeURIComponent(token).split('.')[0];

  expect((await resolveCaller({ auth, token: unsigned })).user).toBeNull();
  expect((await resolveCaller({ auth, token: `${unsigned}.forged` })).user).toBeNull();
});

test('organization.setActive changes the organization on the next bearer call', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'dev@example.com',
    orgNames: ['First', 'Second'],
  });
  const token = (await signInByCode({ auth, email: 'dev@example.com' })).headers.get(
    'set-auth-token'
  );
  expect((await resolveCaller({ auth, token })).user.organization_id).toBe(organizationIds[0]);

  const switched = await auth.handler(
    nativeRequest({
      path: '/organization/set-active',
      body: { organizationId: organizationIds[1] },
      token,
    })
  );
  expect(switched.status).toBe(200);

  const context = await resolveCaller({ auth, token });
  expect(context.user.organization_id).toBe(organizationIds[1]);
  expect(context.authSession.memberOrganizationIds).toEqual(
    expect.arrayContaining(organizationIds)
  );
});

test('signing out with the bearer ends the session for the next call', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'eli@example.com' });
  const token = (await signInByCode({ auth, email: 'eli@example.com' })).headers.get(
    'set-auth-token'
  );
  expect((await resolveCaller({ auth, token })).user).not.toBeNull();

  const signedOut = await auth.handler(nativeRequest({ path: '/sign-out', body: {}, token }));
  expect(signedOut.status).toBe(200);

  expect((await resolveCaller({ auth, token })).user).toBeNull();
});

test('an admin ending the sessions or removing the member stops the bearer on its next call', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'fay@example.com' });
  const first = (await signInByCode({ auth, email: 'fay@example.com' })).headers.get(
    'set-auth-token'
  );
  expect((await resolveCaller({ auth, token: first })).user).not.toBeNull();
  await internalAdapter.deleteUserSessions(user.id);
  expect((await resolveCaller({ auth, token: first })).user).toBeNull();

  const second = (await signInByCode({ auth, email: 'fay@example.com' })).headers.get(
    'set-auth-token'
  );
  expect((await resolveCaller({ auth, token: second })).user).not.toBeNull();
  await adapter.deleteMany({ model: 'member', where: [{ field: 'userId', value: user.id }] });
  // The session still names the organization, where they are no longer a
  // member: resolved unauthenticated, as a browser's would be.
  expect((await resolveCaller({ auth, token: second })).user).toBeNull();
});

test('bearer callers skip the cookie cache, so a deleted session stops at once', async () => {
  const { adapter, auth, internalAdapter } = await setup({ cookieCache: true });
  const { user } = await createMember({ adapter, internalAdapter, email: 'gus@example.com' });
  const browser = await signInByCode({
    auth,
    email: 'gus@example.com',
    request: browserRequest,
  });
  const cookie = cookieOf(browser);
  expect(cookie).toMatch(/session_data=/);
  const token = (await signInByCode({ auth, email: 'gus@example.com' })).headers.get(
    'set-auth-token'
  );

  await internalAdapter.deleteUserSessions(user.id);

  // The browser's cookie cache still vouches for its session until it lapses;
  // the phone's bearer is read from the database.
  expect((await resolveCaller({ auth, cookie })).user).not.toBeNull();
  expect((await resolveCaller({ auth, token })).user).toBeNull();
});

test('a user enrolled in two-factor gets the two-factor answer, not a session', async () => {
  const { adapter, auth, internalAdapter } = await setup({ twoFactor: { enabled: true } });
  const { user } = await createMember({ adapter, internalAdapter, email: 'hal@example.com' });
  await internalAdapter.updateUser(user.id, { twoFactorEnabled: true });

  const response = await signInByCode({ auth, email: 'hal@example.com' });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ twoFactorRedirect: true, twoFactorMethods: ['totp'] });
  expect(response.headers.get('set-auth-token')).toBeNull();
  const sessions = await adapter.findMany({
    model: 'session',
    where: [{ field: 'userId', value: user.id }],
  });
  expect(sessions).toEqual([]);
});

test('an unknown email is sent nothing, answered the same way, and capped like a known one', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'ivy@example.com' });

  async function send(email) {
    const response = await auth.handler(
      nativeRequest({
        path: '/email-otp/send-verification-otp',
        body: { email, type: 'sign-in' },
      })
    );
    return { status: response.status, body: await response.json() };
  }

  for (let index = 0; index < 5; index += 1) {
    expect(await send('nobody@example.com')).toEqual({ status: 200, body: { success: true } });
    expect(await send('ivy@example.com')).toEqual({ status: 200, body: { success: true } });
  }
  expect(sent.map(({ to }) => to)).toEqual(Array(5).fill('ivy@example.com'));

  const unknown = await send('nobody@example.com');
  const known = await send('IVY@example.com');
  expect(unknown.status).toBe(429);
  expect(known).toEqual(unknown);
  expect(sent).toHaveLength(5);
});

test('the send cap counts only the last 15 minutes', async () => {
  const { adapter, auth } = await setup();
  await Promise.all(
    Array.from({ length: 5 }, () =>
      adapter.create({
        model: 'verification',
        data: {
          identifier: 'email-send-limit:old@example.com',
          value: 'sent',
          expiresAt: new Date(Date.now() - 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    )
  );
  const response = await auth.handler(
    nativeRequest({
      path: '/email-otp/send-verification-otp',
      body: { email: 'old@example.com', type: 'sign-in' },
    })
  );
  expect(response.status).toBe(200);
  const left = await adapter.count({
    model: 'verification',
    where: [{ field: 'identifier', value: 'email-send-limit:old@example.com' }],
  });
  expect(left).toBe(1);
});

function mobileSignInRequest({ shell = 'field', state = 'shell-state-1', cookie } = {}) {
  const headers = new Headers();
  if (cookie) {
    headers.set('cookie', cookie);
  }
  const url = new URL(`${ORIGIN}/auth/mobile`);
  if (shell !== null) {
    url.searchParams.set('shell', shell);
  }
  if (state !== null) {
    url.searchParams.set('state', state);
  }
  return new Request(url, { headers });
}

test('the mobile sign-in page hands a signed-in browser session to the shell scheme as a one-time token', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'jo@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'jo@example.com', request: browserRequest })
  );

  const redirect = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ cookie }),
  });
  expect(redirect.status).toBe(302);
  expect(redirect.headers.get('cache-control')).toBe('no-store');
  const location = new URL(redirect.headers.get('location'));
  expect(location.protocol).toBe('com.example.field:');
  expect(location.host).toBe('auth');
  expect(location.searchParams.get('state')).toBe('shell-state-1');
  const oneTimeToken = location.searchParams.get('token');

  // Stored hashed, for one minute.
  const stored = await adapter.findMany({ model: 'verification' });
  const record = stored.find((each) => each.identifier.startsWith('one-time-token:'));
  expect(record.identifier).not.toContain(oneTimeToken);
  const lifetime = new Date(record.expiresAt).getTime() - Date.now();
  expect(lifetime).toBeGreaterThan(50 * 1000);
  expect(lifetime).toBeLessThanOrEqual(60 * 1000);

  const verified = await auth.handler(
    nativeRequest({ path: '/one-time-token/verify', body: { token: oneTimeToken } })
  );
  expect(verified.status).toBe(200);
  const token = verified.headers.get('set-auth-token');
  expect((await resolveCaller({ auth, token })).user).toMatchObject({ id: user.id });

  // Single use.
  const again = await auth.handler(
    nativeRequest({ path: '/one-time-token/verify', body: { token: oneTimeToken } })
  );
  expect(again.status).toBe(400);
});

test('an expired one-time token is refused', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'kim@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'kim@example.com', request: browserRequest })
  );
  const redirect = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ cookie }),
  });
  const oneTimeToken = new URL(redirect.headers.get('location')).searchParams.get('token');
  await adapter.updateMany({
    model: 'verification',
    where: [{ field: 'identifier', operator: 'starts_with', value: 'one-time-token:' }],
    update: { expiresAt: new Date(Date.now() - 1000) },
  });

  const verified = await auth.handler(
    nativeRequest({ path: '/one-time-token/verify', body: { token: oneTimeToken } })
  );
  expect(verified.status).toBe(400);
});

test('a browser can not mint a one-time token over HTTP', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'lee@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'lee@example.com', request: browserRequest })
  );
  const response = await auth.handler(
    browserRequest({ path: '/one-time-token/generate', method: 'GET', cookie })
  );
  expect(response.status).toBe(400);
});

test('the mobile sign-in page sends a signed-out person to sign in and back', async () => {
  const { auth, authJson } = await setup();
  const response = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest(),
  });
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(
    `/login?callbackUrl=${encodeURIComponent('/auth/mobile?shell=field&state=shell-state-1')}`
  );
});

test('the mobile sign-in page refuses an unknown shell and a missing state', async () => {
  const { auth, authJson } = await setup();
  const unknown = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ shell: 'other' }),
  });
  expect(unknown.status).toBe(400);
  const noState = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ state: null }),
  });
  expect(noState.status).toBe(400);
});

test('phone sessions get mobile.auth.sessionExpiresIn and keep it when they slide forward', async () => {
  const mobile = {
    shells: [{ id: 'field', scheme: 'com.example.field' }],
    sessionExpiresIn: 30 * DAY,
  };
  const { adapter, auth, authJson, internalAdapter } = await setup({ mobile });
  const { user } = await createMember({ adapter, internalAdapter, email: 'max@example.com' });

  function daysLeft(session) {
    return (new Date(session.expiresAt).getTime() - Date.now()) / (DAY * 1000);
  }
  async function findSessions() {
    return adapter.findMany({ model: 'session', where: [{ field: 'userId', value: user.id }] });
  }

  const token = (await signInByCode({ auth, email: 'max@example.com' })).headers.get(
    'set-auth-token'
  );
  const browserCookie = cookieOf(
    await signInByCode({ auth, email: 'max@example.com', request: browserRequest })
  );
  let sessions = await findSessions();
  const phone = sessions.find((session) => session.mobile === true);
  const browser = sessions.find((session) => session.mobile !== true);
  expect(daysLeft(phone)).toBeCloseTo(30, 1);
  expect(daysLeft(browser)).toBeCloseTo(7, 1);

  // Due a refresh: BetterAuth slides a session forward once a day of its
  // lifetime has passed. The phone's slides by its own lifetime.
  await adapter.update({
    model: 'session',
    where: [{ field: 'id', value: phone.id }],
    update: { expiresAt: new Date(Date.now() + 5 * DAY * 1000) },
  });
  expect((await resolveCaller({ auth, token })).user).not.toBeNull();
  sessions = await findSessions();
  expect(daysLeft(sessions.find((session) => session.id === phone.id))).toBeCloseTo(30, 1);

  // A browser session handed to a phone by the mobile sign-in page becomes a
  // phone session.
  await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ cookie: browserCookie }),
  });
  sessions = await findSessions();
  const handed = sessions.find((session) => session.id === browser.id);
  expect(handed.mobile).toBe(true);
  expect(daysLeft(handed)).toBeCloseTo(30, 1);
});

test('a websocket opened with a bearer acts for its session and closes once the session is deleted', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'nia@example.com' });
  const token = (await signInByCode({ auth, email: 'nia@example.com' })).headers.get(
    'set-auth-token'
  );
  const headers = new Headers({ authorization: `Bearer ${token}` });
  const context = { config: {}, logger: createLogger(), rid: 'ws-1', handleError: jest.fn() };
  await resolveAuthentication(context, { auth, headers, strategies: [] });
  expect(context.user).toMatchObject({ id: user.id });
  context.auth = auth;

  const closeSocket = jest.fn();
  const send = jest.fn();
  const registry = { subscribe: jest.fn(), unsubscribeAll: jest.fn() };
  const connection = createWebSocketConnection(context, {
    closeSocket,
    headers,
    registry,
    send,
    strategies: [],
  });

  async function subscribe(requestId) {
    await connection.handleMessage(
      JSON.stringify({ type: 'subscribe', websocketId: 'feed', requestId, payload: {} })
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  await subscribe('r1');
  expect(registry.subscribe).toHaveBeenCalledTimes(1);
  expect(closeSocket).not.toHaveBeenCalled();

  await internalAdapter.deleteUserSessions(user.id);
  await subscribe('r2');
  expect(registry.subscribe).toHaveBeenCalledTimes(1);
  expect(closeSocket).toHaveBeenCalledWith({ code: 4401, reason: 'caller-changed' });
  connection.close();
});
