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

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { vi, afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
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

// Every email the engine sends: the flow and its variables (the code), and the
// address it went to.
const sent = [];
vi.doMock('../../../email/renderAuthEmail.js', () => ({
  default: vi.fn(async ({ flow, vars }) => ({ subject: flow, html: '', text: '', vars })),
}));
vi.doMock('../createSendEmail.js', () => ({
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
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    isLevelEnabled: vi.fn(() => false),
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
    // mobile: false builds an app with no mobile section.
    mobile:
      mobile === false
        ? undefined
        : mobile ?? {
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

// A phone's request: no Origin, no cookies, the session as a bearer, and the phone's device key
// on its email-code calls.
function nativeRequest({ path, method = 'POST', body, deviceKey, token }) {
  const headers = { 'content-type': 'application/json', 'x-lowdefy-shell': '7.1.0' };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  if (deviceKey) {
    headers['x-lowdefy-device-key'] = deviceKey;
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

test('a phone that signed in by code before still gets codes while a stranger fills the address cap', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'kim@example.com' });
  const deviceKey = randomBytes(32).toString('base64url');

  async function send(key) {
    const response = await auth.handler(
      nativeRequest({
        path: '/email-otp/send-verification-otp',
        body: { email: 'kim@example.com', type: 'sign-in' },
        deviceKey: key,
      })
    );
    return response.status;
  }

  expect(await send(deviceKey)).toBe(200);
  const signedIn = await auth.handler(
    nativeRequest({
      path: '/sign-in/email-otp',
      body: { email: 'kim@example.com', otp: lastCode() },
      deviceKey,
    })
  );
  expect(signedIn.status).toBe(200);
  const deviceKeyHash = createHash('sha256').update(deviceKey).digest('base64url');
  expect(
    await adapter.count({
      model: 'verification',
      where: [
        { field: 'identifier', value: `email-known-device:kim@example.com:${deviceKeyHash}` },
      ],
    })
  ).toBe(1);

  // A stranger with no key, or a made-up one, fills the address cap.
  const statuses = [];
  for (let index = 0; index < 5; index += 1) {
    statuses.push(await send(index % 2 === 0 ? undefined : randomBytes(32).toString('base64url')));
  }
  expect(statuses).toContain(429);
  expect(await send(undefined)).toBe(429);

  // The phone that signed in before is let through, and the code reaches the address.
  const before = sent.length;
  expect(await send(deviceKey)).toBe(200);
  expect(sent.slice(before)).toEqual([{ to: 'kim@example.com', flow: 'emailOTP' }]);
});

test('password reset codes are capped like sign-in codes', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'rex@example.com' });
  const statuses = [];
  for (let index = 0; index < 6; index += 1) {
    const response = await auth.handler(
      nativeRequest({ path: '/forget-password/email-otp', body: { email: 'rex@example.com' } })
    );
    statuses.push(response.status);
  }
  expect(statuses.slice(0, 5).every((status) => status !== 429)).toBe(true);
  expect(statuses[5]).toBe(429);
});

test('a signed session token sent as a bearer resolves no caller in an app with no mobile section', async () => {
  const { adapter, auth, internalAdapter } = await setup({ mobile: false });
  await createMember({ adapter, internalAdapter, email: 'una@example.com' });
  const response = await signInByCode({ auth, email: 'una@example.com', request: browserRequest });
  expect(response.status).toBe(200);
  const cookie = cookieOf(response);
  const sessionToken = decodeURIComponent(
    cookie
      .split('; ')
      .find((pair) => pair.split('=')[0].endsWith('session_token'))
      .split('=')
      .slice(1)
      .join('=')
  );
  expect((await resolveCaller({ auth, cookie })).user).not.toBeNull();
  expect((await resolveCaller({ auth, token: sessionToken })).user).toBeNull();
});

test('a browser exchanging a one-time token never gets the session token header', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'vic@example.com' });
  const { codeVerifier, oneTimeToken } = await handOffToShell({
    auth,
    authJson,
    email: 'vic@example.com',
  });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'vic@example.com', request: browserRequest })
  );
  const response = await auth.handler(
    browserRequest({
      path: '/one-time-token/verify',
      body: { token: oneTimeToken, code_verifier: codeVerifier },
      cookie,
    })
  );
  expect(response.headers.get('set-auth-token')).toBeNull();
});

// What a shell does before it opens the sheet (RFC 7636): a random verifier it
// keeps in memory, and its S256 challenge, which goes in the URL.
function createPkce() {
  const codeVerifier = randomBytes(64).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

function mobileSignInRequest({
  shell = 'field',
  state = 'shell-state-1',
  codeChallenge,
  codeChallengeMethod = 'S256',
  platform = 'ios',
  cookie,
  method = 'GET',
  body,
  headers: extraHeaders = {},
} = {}) {
  const headers = new Headers();
  if (cookie) {
    headers.set('cookie', cookie);
  }
  if (method === 'POST') {
    headers.set('host', new URL(ORIGIN).host);
    headers.set('origin', ORIGIN);
    headers.set('content-type', 'application/x-www-form-urlencoded');
  }
  Object.entries(extraHeaders).forEach(([name, value]) => headers.set(name, value));
  const url = new URL(`${ORIGIN}/auth/mobile`);
  if (shell !== null) {
    url.searchParams.set('shell', shell);
  }
  if (state !== null) {
    url.searchParams.set('state', state);
  }
  if (codeChallenge !== null) {
    url.searchParams.set('code_challenge', codeChallenge ?? createPkce().codeChallenge);
  }
  if (codeChallengeMethod !== null) {
    url.searchParams.set('code_challenge_method', codeChallengeMethod);
  }
  if (platform !== null) {
    url.searchParams.set('platform', platform);
  }
  return new Request(url, { method, headers, body });
}

function joinCookies(...cookies) {
  return cookies.filter((each) => each).join('; ');
}

// The confirmation page a signed-in browser is shown, and its CSRF token.
async function showConfirmation({ auth, authJson, ...options }) {
  const response = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest(options),
  });
  const html = await response.clone().text();
  const csrfToken = html.match(/name="csrf_token" value="([^"]+)"/)?.[1];
  return { response, html, csrfToken };
}

// The confirmation page's Continue (or Cancel) post.
function confirm({ auth, authJson, csrfToken, decision = 'continue', ...options }) {
  const body = new URLSearchParams({ decision });
  if (csrfToken !== undefined) {
    body.set('csrf_token', csrfToken);
  }
  return handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ ...options, method: 'POST', body: body.toString() }),
  });
}

async function countOneTimeTokens({ adapter }) {
  const stored = await adapter.findMany({ model: 'verification' });
  return stored.filter((each) => each.identifier.startsWith('one-time-token')).length;
}

async function findSessions({ adapter, userId }) {
  return adapter.findMany({ model: 'session', where: [{ field: 'userId', value: userId }] });
}

// Signs a browser in, confirms on the mobile sign-in page and returns the
// one-time token from the redirect, and the verifier for it.
async function handOffToShell({ auth, authJson, email, platform = 'ios' }) {
  const cookie = cookieOf(await signInByCode({ auth, email, request: browserRequest }));
  const { codeVerifier, codeChallenge } = createPkce();
  const { csrfToken } = await showConfirmation({ auth, authJson, cookie, codeChallenge, platform });
  const redirect = await confirm({ auth, authJson, cookie, codeChallenge, csrfToken, platform });
  expect(redirect.status).toBe(303);
  const oneTimeToken = new URL(redirect.headers.get('location')).searchParams.get('token');
  return { codeVerifier, cookie, oneTimeToken, redirect };
}

// The shell's exchange of the one-time token for the session token.
function exchange({ auth, token, codeVerifier }) {
  const body = { token };
  if (codeVerifier !== undefined) {
    body.code_verifier = codeVerifier;
  }
  return auth.handler(nativeRequest({ path: '/one-time-token/verify', body }));
}

test('the mobile sign-in page asks a signed-in browser to confirm, and a GET never mints a token', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'gus@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'gus@example.com', request: browserRequest })
  );
  const sessionsBefore = await findSessions({ adapter, userId: user.id });

  const { response, html, csrfToken } = await showConfirmation({ auth, authJson, cookie });
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  expect(html).toContain('Sign in to Test App on this device?');
  expect(html).toContain('The field app is asking to sign in as gus@example.com.');
  expect(typeof csrfToken).toBe('string');
  await showConfirmation({ auth, authJson, cookie });

  expect(await countOneTimeTokens({ adapter })).toBe(0);
  expect(await findSessions({ adapter, userId: user.id })).toEqual(sessionsBefore);
});

test('confirming creates a new phone session with the browser organization and hands it to the shell scheme as a one-time token', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  const { user, organizationIds } = await createMember({
    adapter,
    internalAdapter,
    email: 'jo@example.com',
    orgNames: ['First', 'Second'],
  });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'jo@example.com', request: browserRequest })
  );
  // The person switched to their second organization in the browser.
  const switched = await auth.handler(
    browserRequest({
      path: '/organization/set-active',
      body: { organizationId: organizationIds[1] },
      cookie,
    })
  );
  expect(switched.status).toBe(200);
  const [browserBefore] = await findSessions({ adapter, userId: user.id });
  const { codeVerifier, codeChallenge } = createPkce();

  const { csrfToken } = await showConfirmation({ auth, authJson, cookie, codeChallenge });
  const redirect = await confirm({ auth, authJson, cookie, codeChallenge, csrfToken });
  expect(redirect.status).toBe(303);
  expect(redirect.headers.get('cache-control')).toBe('no-store');
  const location = new URL(redirect.headers.get('location'));
  expect(location.protocol).toBe('com.example.field:');
  expect(location.host).toBe('auth');
  expect(location.searchParams.get('state')).toBe('shell-state-1');
  expect(location.searchParams.has('code_challenge')).toBe(false);
  const oneTimeToken = location.searchParams.get('token');

  // Stored hashed, for one minute, with the challenge it is bound to.
  const stored = await adapter.findMany({ model: 'verification' });
  const record = stored.find((each) => each.identifier.startsWith('one-time-token:'));
  expect(record.identifier).not.toContain(oneTimeToken);
  const lifetime = new Date(record.expiresAt).getTime() - Date.now();
  expect(lifetime).toBeGreaterThan(50 * 1000);
  expect(lifetime).toBeLessThanOrEqual(60 * 1000);
  const challenge = stored.find((each) => each.identifier.startsWith('one-time-token-challenge:'));
  expect(challenge.identifier).toBe(
    record.identifier.replace('one-time-token:', 'one-time-token-challenge:')
  );
  expect(challenge.value).toBe(codeChallenge);

  const verified = await exchange({ auth, token: oneTimeToken, codeVerifier });
  expect(verified.status).toBe(200);
  const token = verified.headers.get('set-auth-token');
  const phone = await resolveCaller({ auth, token });
  expect(phone.user).toMatchObject({ id: user.id, organization_id: organizationIds[1] });
  // A new session, not the browser's.
  expect(phone.authSession.id).not.toBe(browserBefore.id);
  const sessions = await findSessions({ adapter, userId: user.id });
  expect(sessions).toHaveLength(2);
  // The browser's session is untouched: not marked, not extended.
  const browserAfter = sessions.find((session) => session.id === browserBefore.id);
  expect(browserAfter).toEqual(browserBefore);
  // Nothing is left behind.
  expect(await countOneTimeTokens({ adapter })).toBe(0);

  // Single use.
  const again = await exchange({ auth, token: oneTimeToken, codeVerifier });
  expect(again.status).toBe(400);

  // Signing out on the phone leaves the browser signed in.
  const signedOut = await auth.handler(nativeRequest({ path: '/sign-out', token }));
  expect(signedOut.status).toBe(200);
  expect((await resolveCaller({ auth, token })).user).toBeNull();
  expect((await resolveCaller({ auth, cookie })).user).toMatchObject({ id: user.id });
});

test('a confirmation without the page CSRF token or from another origin is refused and mints nothing', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'hal@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'hal@example.com', request: browserRequest })
  );
  const { codeChallenge } = createPkce();
  const { csrfToken } = await showConfirmation({ auth, authJson, cookie, codeChallenge });
  const otherCookie = cookieOf(
    await signInByCode({ auth, email: 'hal@example.com', request: browserRequest })
  );
  const { csrfToken: otherSessionCsrfToken } = await showConfirmation({
    auth,
    authJson,
    cookie: otherCookie,
    codeChallenge,
  });
  const { csrfToken: otherSignInCsrfToken } = await showConfirmation({
    auth,
    authJson,
    cookie,
  });
  const sessionsBefore = await findSessions({ adapter, userId: user.id });

  async function statusFor(options) {
    const response = await confirm({ auth, authJson, cookie, codeChallenge, ...options });
    return response.status;
  }
  expect(await statusFor({})).toBe(403);
  expect(await statusFor({ csrfToken: 'forged' })).toBe(403);
  expect(await statusFor({ csrfToken: otherSessionCsrfToken })).toBe(403);
  expect(await statusFor({ csrfToken: otherSignInCsrfToken })).toBe(403);
  expect(await statusFor({ csrfToken, headers: { origin: 'https://evil.example.com' } })).toBe(403);
  expect(await statusFor({ csrfToken, headers: { 'sec-fetch-site': 'cross-site' } })).toBe(403);
  expect(await statusFor({ csrfToken, cookie: undefined })).toBe(403);

  expect(await countOneTimeTokens({ adapter })).toBe(0);
  expect(await findSessions({ adapter, userId: user.id })).toEqual(sessionsBefore);
});

test('a browser session created inside the sheet sign-in is ended once the phone has its own', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'ivy@example.com' });
  const { codeVerifier, codeChallenge } = createPkce();

  // Signed out: sent to sign in, with the time noted.
  const signInRedirect = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ codeChallenge }),
  });
  expect(signInRedirect.status).toBe(302);
  const startedCookie = cookieOf(signInRedirect);
  expect(startedCookie).toMatch(/^lowdefy_mobile_sign_in_started=\d+$/);

  // Signs in in the sheet, and comes back.
  const sessionCookie = cookieOf(
    await signInByCode({ auth, email: 'ivy@example.com', request: browserRequest })
  );
  const cookie = joinCookies(sessionCookie, startedCookie);
  const { csrfToken } = await showConfirmation({ auth, authJson, cookie, codeChallenge });
  const redirect = await confirm({ auth, authJson, cookie, codeChallenge, csrfToken });
  expect(redirect.status).toBe(303);
  expect(redirect.headers.getSetCookie()[0]).toMatch(
    /^lowdefy_mobile_sign_in_started=; Path=\/auth\/mobile; Max-Age=0/
  );

  // The sheet's session is gone; the phone's works.
  expect((await resolveCaller({ auth, cookie: sessionCookie })).user).toBeNull();
  const oneTimeToken = new URL(redirect.headers.get('location')).searchParams.get('token');
  const verified = await exchange({ auth, token: oneTimeToken, codeVerifier });
  expect(verified.status).toBe(200);
  const token = verified.headers.get('set-auth-token');
  expect((await resolveCaller({ auth, token })).user).toMatchObject({ id: user.id });
  expect(await findSessions({ adapter, userId: user.id })).toHaveLength(1);
});

test('an Android sign-in returns by the https app link on the app origin', async () => {
  const mobile = {
    shells: [{ id: 'field', scheme: 'com.example.field', androidAppLink: true }],
    sessionExpiresIn: null,
  };
  const { adapter, auth, authJson, internalAdapter } = await setup({ mobile });
  const { user } = await createMember({ adapter, internalAdapter, email: 'una@example.com' });
  const { codeVerifier, redirect } = await handOffToShell({
    auth,
    authJson,
    email: 'una@example.com',
    platform: 'android',
  });
  const location = new URL(redirect.headers.get('location'));
  expect(`${location.origin}${location.pathname}`).toBe(`${ORIGIN}/auth/mobile/callback`);
  expect(location.searchParams.get('state')).toBe('shell-state-1');

  const verified = await exchange({
    auth,
    token: location.searchParams.get('token'),
    codeVerifier,
  });
  expect(verified.status).toBe(200);
  const token = verified.headers.get('set-auth-token');
  expect((await resolveCaller({ auth, token })).user).toMatchObject({ id: user.id });
});

test('an Android sign-in is refused for a shell with no app link', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'vic@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'vic@example.com', request: browserRequest })
  );
  const { response } = await showConfirmation({ auth, authJson, cookie, platform: 'android' });
  expect(response.status).toBe(400);
});

test('cancelling returns error=cancelled to the shell and creates nothing', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'wes@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'wes@example.com', request: browserRequest })
  );
  const { codeChallenge } = createPkce();
  const { csrfToken } = await showConfirmation({ auth, authJson, cookie, codeChallenge });
  const response = await confirm({
    auth,
    authJson,
    cookie,
    codeChallenge,
    csrfToken,
    decision: 'cancel',
  });
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe(
    'com.example.field://auth?error=cancelled&state=shell-state-1'
  );
  expect(await countOneTimeTokens({ adapter })).toBe(0);
  expect(await findSessions({ adapter, userId: user.id })).toHaveLength(1);
});

test('an exchange without the code verifier is refused and burns the one-time token', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'ola@example.com' });
  const { codeVerifier, oneTimeToken } = await handOffToShell({
    auth,
    authJson,
    email: 'ola@example.com',
  });

  const refused = await exchange({ auth, token: oneTimeToken });
  expect(refused.status).toBe(400);
  expect(refused.headers.get('set-auth-token')).toBeNull();
  expect(refused.headers.getSetCookie()).toEqual([]);

  const late = await exchange({ auth, token: oneTimeToken, codeVerifier });
  expect(late.status).toBe(400);
  expect(late.headers.get('set-auth-token')).toBeNull();
});

test('an exchange with the wrong code verifier is refused and burns the one-time token', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'pia@example.com' });
  const { codeVerifier, oneTimeToken } = await handOffToShell({
    auth,
    authJson,
    email: 'pia@example.com',
  });

  // An app that caught the redirect has the token but not the shell's verifier.
  const caught = await exchange({
    auth,
    token: oneTimeToken,
    codeVerifier: createPkce().codeVerifier,
  });
  expect(caught.status).toBe(400);
  expect(caught.headers.get('set-auth-token')).toBeNull();
  expect(caught.headers.getSetCookie()).toEqual([]);
  expect(await countOneTimeTokens({ adapter })).toBe(0);

  // The shell's own exchange then fails closed: the person signs in again.
  const late = await exchange({ auth, token: oneTimeToken, codeVerifier });
  expect(late.status).toBe(400);
  expect(late.headers.get('set-auth-token')).toBeNull();
});

test('a one-time token with no stored challenge is refused', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'quin@example.com' });
  const { codeVerifier, oneTimeToken } = await handOffToShell({
    auth,
    authJson,
    email: 'quin@example.com',
  });
  await adapter.deleteMany({
    model: 'verification',
    where: [{ field: 'identifier', operator: 'starts_with', value: 'one-time-token-challenge:' }],
  });

  const verified = await exchange({ auth, token: oneTimeToken, codeVerifier });
  expect(verified.status).toBe(400);
  expect(verified.headers.get('set-auth-token')).toBeNull();
});

test('an expired one-time token is refused', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'kim@example.com' });
  const { codeVerifier, oneTimeToken } = await handOffToShell({
    auth,
    authJson,
    email: 'kim@example.com',
  });
  await adapter.updateMany({
    model: 'verification',
    where: [{ field: 'identifier', operator: 'starts_with', value: 'one-time-token:' }],
    update: { expiresAt: new Date(Date.now() - 1000) },
  });

  const verified = await exchange({ auth, token: oneTimeToken, codeVerifier });
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
  const { codeChallenge } = createPkce();
  const response = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: mobileSignInRequest({ codeChallenge }),
  });
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(
    `/login?callbackUrl=${encodeURIComponent(
      `/auth/mobile?shell=field&state=shell-state-1&code_challenge=${codeChallenge}&code_challenge_method=S256&platform=ios`
    )}`
  );
});

test('the mobile sign-in page refuses an unknown shell, a missing state, platform, or a missing or non-S256 challenge', async () => {
  const { adapter, auth, authJson, internalAdapter } = await setup();
  await createMember({ adapter, internalAdapter, email: 'rae@example.com' });
  const cookie = cookieOf(
    await signInByCode({ auth, email: 'rae@example.com', request: browserRequest })
  );
  const { codeVerifier, codeChallenge } = createPkce();

  async function statusFor(options) {
    const response = await handleMobileSignIn({
      auth,
      authJson,
      basePath: '',
      request: mobileSignInRequest({ cookie, ...options }),
    });
    return response.status;
  }

  expect(await statusFor({ shell: 'other' })).toBe(400);
  expect(await statusFor({ state: null })).toBe(400);
  expect(await statusFor({ platform: null })).toBe(400);
  expect(await statusFor({ codeChallenge: null })).toBe(400);
  expect(await statusFor({ codeChallengeMethod: null })).toBe(400);
  expect(await statusFor({ codeChallenge: codeVerifier, codeChallengeMethod: 'plain' })).toBe(400);
  expect(await statusFor({ codeChallenge: `${codeChallenge}=` })).toBe(400);
  // Refused before anything was minted.
  expect(await countOneTimeTokens({ adapter })).toBe(0);
});

test('phone sessions get mobile.auth.sessionExpiresIn and keep it when they slide forward', async () => {
  const mobile = {
    shells: [{ id: 'field', scheme: 'com.example.field', androidAppLink: false }],
    sessionExpiresIn: 30 * DAY,
  };
  const { adapter, auth, authJson, internalAdapter } = await setup({ mobile });
  const { user } = await createMember({ adapter, internalAdapter, email: 'max@example.com' });

  function daysLeft(session) {
    return (new Date(session.expiresAt).getTime() - Date.now()) / (DAY * 1000);
  }

  const token = (await signInByCode({ auth, email: 'max@example.com' })).headers.get(
    'set-auth-token'
  );
  const browserCookie = cookieOf(
    await signInByCode({ auth, email: 'max@example.com', request: browserRequest })
  );
  let sessions = await findSessions({ adapter, userId: user.id });
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
  sessions = await findSessions({ adapter, userId: user.id });
  expect(daysLeft(sessions.find((session) => session.id === phone.id))).toBeCloseTo(30, 1);

  // Confirming on the mobile sign-in page gives the phone a new phone session;
  // the browser's stays a browser session with its own lifetime.
  const { codeChallenge } = createPkce();
  const { csrfToken } = await showConfirmation({
    auth,
    authJson,
    cookie: browserCookie,
    codeChallenge,
  });
  const redirect = await confirm({
    auth,
    authJson,
    cookie: browserCookie,
    codeChallenge,
    csrfToken,
  });
  expect(redirect.status).toBe(303);
  sessions = await findSessions({ adapter, userId: user.id });
  expect(sessions).toHaveLength(3);
  const sheetPhone = sessions.find(
    (session) => session.id !== phone.id && session.id !== browser.id
  );
  expect(sheetPhone.mobile).toBe(true);
  expect(daysLeft(sheetPhone)).toBeCloseTo(30, 1);
  const browserAfter = sessions.find((session) => session.id === browser.id);
  expect(browserAfter.mobile).not.toBe(true);
  expect(browserAfter.expiresAt).toEqual(browser.expiresAt);
});

test('a websocket opened with a bearer acts for its session and closes once the session is deleted', async () => {
  const { adapter, auth, internalAdapter } = await setup();
  const { user } = await createMember({ adapter, internalAdapter, email: 'nia@example.com' });
  const token = (await signInByCode({ auth, email: 'nia@example.com' })).headers.get(
    'set-auth-token'
  );
  const headers = new Headers({ authorization: `Bearer ${token}` });
  const context = { config: {}, logger: createLogger(), rid: 'ws-1', handleError: vi.fn() };
  await resolveAuthentication(context, { auth, headers, strategies: [] });
  expect(context.user).toMatchObject({ id: user.id });
  context.auth = auth;

  const closeSocket = vi.fn();
  const send = vi.fn();
  const registry = { subscribe: vi.fn(), unsubscribeAll: vi.fn() };
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
