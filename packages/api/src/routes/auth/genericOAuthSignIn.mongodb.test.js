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

// A GenericOAuth sign-in end to end: the BetterAuth client call the Lowdefy
// client makes, through an engine-configured BetterAuth instance on the MongoDB
// auth adapter, against a stub OAuth issuer (pnpm test:mongodb). The issuer's
// authorize step is skipped: the test reads the authorization URL and calls the
// callback with a code, as the issuer's redirect would. A second provider is
// configured by discovery, so BetterAuth also verifies id tokens the issuer
// signs.

import crypto from 'node:crypto';
import http from 'node:http';

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

const { betterAuth } = await import('better-auth');
const { createAuthClient } = await import('better-auth/client');
const { MongoDBAuthAdapter } = await import('@lowdefy/connection-mongodb/auth/adapters');
const { GenericOAuth } = await import('@lowdefy/plugin-better-auth/auth/providers');
const { default: getBetterAuthConfig } = await import('./getBetterAuthConfig.js');
const { default: ensureAuthIndexes } = await import('./organizations/ensureAuthIndexes.js');
const { default: ensureOrganization } = await import('./organizations/ensureOrganization.js');

const ORIGIN = 'http://localhost:3263';
const PROVIDER_ID = 'my-idp';
const OIDC_PROVIDER_ID = 'oidc-idp';
const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

let client;
let issuer;
let issuerUrl;
let run = 0;

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

// An id token as the issuer would mint it for the discovery-configured client.
function signIdToken({ email }) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'RS256', kid: jwk.kid, typ: 'JWT' });
  const payload = encode({
    iss: issuerUrl,
    aud: 'oidc-client-id',
    sub: `sub-${email}`,
    email,
    email_verified: true,
    name: email,
    iat: now,
    exp: now + 300,
  });
  const signature = crypto
    .sign('sha256', Buffer.from(`${header}.${payload}`), privateKey)
    .toString('base64url');
  return `${header}.${payload}.${signature}`;
}

// The token endpoint hands the code back as the access token, and the userinfo
// endpoint reads the email from it, so each test picks its user by the code. An
// email at unverified.example.com gets userinfo with no email_verified claim, as
// some issuers send.
function startIssuer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://issuer');
    if (req.method === 'POST' && url.pathname === '/token') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const code = new URLSearchParams(body).get('code');
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ access_token: code, token_type: 'Bearer', expires_in: 3600 }));
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/.well-known/openid-configuration') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          issuer: issuerUrl,
          authorization_endpoint: `${issuerUrl}/authorize`,
          token_endpoint: `${issuerUrl}/token`,
          userinfo_endpoint: `${issuerUrl}/userinfo`,
          jwks_uri: `${issuerUrl}/jwks`,
          id_token_signing_alg_values_supported: ['RS256'],
        })
      );
      return;
    }
    if (req.method === 'GET' && url.pathname === '/jwks') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/userinfo') {
      const email = req.headers.authorization.replace('Bearer ', '');
      const userInfo = { id: `sub-${email}`, email, name: email };
      if (!email.endsWith('@unverified.example.com')) {
        userInfo.email_verified = true;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(userInfo));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

beforeAll(async () => {
  process.env.BETTER_AUTH_URL = ORIGIN;
  client = new mongodb.MongoClient(process.env.MONGO_URL);
  await client.connect();
  issuer = await startIssuer();
  issuerUrl = `http://127.0.0.1:${issuer.address().port}`;
});

afterAll(async () => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
  await new Promise((resolve) => issuer.close(resolve));
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

async function setup({ organizations, twoFactor, trustEmail, database: reuse }) {
  run += 1;
  const database = reuse ?? `genericOAuthSignIn${run}`;
  const logger = createLogger();
  let auth;
  const options = getBetterAuthConfig({
    appMeta: { name: 'Test App', slug: 'test-app' },
    authJson: {
      configured: true,
      secret: { _secret: 'BETTER_AUTH_SECRET' },
      database: {
        id: 'auth_db',
        type: 'MongoDBAuthAdapter',
        properties: { uri: process.env.MONGO_URL, database },
      },
      providers: [
        {
          id: PROVIDER_ID,
          type: 'GenericOAuth',
          properties: {
            clientId: 'client-id',
            clientSecret: 'client-secret',
            authorizationUrl: `${issuerUrl}/authorize`,
            tokenUrl: `${issuerUrl}/token`,
            userInfoUrl: `${issuerUrl}/userinfo`,
            scopes: ['profile', 'email'],
            trustEmail,
          },
        },
        {
          id: OIDC_PROVIDER_ID,
          type: 'GenericOAuth',
          properties: {
            clientId: 'oidc-client-id',
            clientSecret: 'oidc-client-secret',
            discoveryUrl: `${issuerUrl}/.well-known/openid-configuration`,
            scopes: ['openid', 'profile', 'email'],
          },
        },
      ],
      session: {
        expiresIn: 604800,
        updateAge: 86400,
        cookieCache: { enabled: false, maxAge: 300 },
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
    },
    createSystemContext: () => ({}),
    getAuth: () => auth,
    logger,
    plugins: { adapters: { MongoDBAuthAdapter }, providers: { GenericOAuth } },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  auth = betterAuth(options);
  await ensureAuthIndexes({ auth, logger });
  const { adapter } = await auth.$context;
  return { adapter, auth, database, db: client.db(database) };
}

// The browser's cookie jar after a response: its Set-Cookie values replace
// the cookies of the same name.
function mergeCookies(cookie, response) {
  const jar = new Map(
    cookie
      .split('; ')
      .filter(Boolean)
      .map((pair) => [pair.split('=')[0], pair])
  );
  response.headers.getSetCookie().forEach((header) => {
    const pair = header.split(';')[0];
    jar.set(pair.split('=')[0], pair);
  });
  return [...jar.values()].join('; ');
}

// The BetterAuth client as the Lowdefy server's AuthConfigured builds it, with
// its fetch routed to the in-process handler and the cookies kept in a jar.
function createBrowser(auth) {
  const browser = { cookie: '' };
  browser.authClient = createAuthClient({
    baseURL: `${ORIGIN}/api/auth`,
    fetchOptions: {
      customFetchImpl: async (input, init) => {
        const request = new Request(input, init);
        request.headers.set('origin', ORIGIN);
        if (browser.cookie) request.headers.set('cookie', browser.cookie);
        const response = await auth.handler(request);
        browser.cookie = mergeCookies(browser.cookie, response);
        return response;
      },
    },
  });
  return browser;
}

// What the issuer's redirect back to the app does: a GET on the redirect_uri
// with a code and the state BetterAuth sent.
async function returnFromIssuer({ auth, browser, authorizationUrl, code }) {
  const redirectUri = new URL(authorizationUrl.searchParams.get('redirect_uri'));
  redirectUri.searchParams.set('code', code);
  redirectUri.searchParams.set('state', authorizationUrl.searchParams.get('state'));
  const response = await auth.handler(
    new Request(redirectUri, { headers: { cookie: browser.cookie } })
  );
  browser.cookie = mergeCookies(browser.cookie, response);
  return response;
}

async function signIn({ auth, browser, email }) {
  const { data, error } = await browser.authClient.signIn.social({
    provider: PROVIDER_ID,
    callbackURL: '/home',
    disableRedirect: true,
  });
  expect(error).toBeNull();
  const authorizationUrl = new URL(data.url);
  const callback = await returnFromIssuer({ auth, browser, authorizationUrl, code: email });
  return { authorizationUrl, callback };
}

const pinnedOpen = { policy: 'pinned', org: 'default', signup: 'open' };
const pinnedInviteOnly = { policy: 'pinned', org: 'default', signup: 'invite-only' };

test('GenericOAuth sign-in redirects to the issuer with the core /callback/:id redirect URI', async () => {
  const { auth } = await setup({ organizations: pinnedOpen });
  const browser = createBrowser(auth);
  const { data, error } = await browser.authClient.signIn.social({
    provider: PROVIDER_ID,
    callbackURL: '/home',
    disableRedirect: true,
  });
  expect(error).toBeNull();
  const authorizationUrl = new URL(data.url);
  expect(`${authorizationUrl.origin}${authorizationUrl.pathname}`).toBe(`${issuerUrl}/authorize`);
  expect(authorizationUrl.searchParams.get('client_id')).toBe('client-id');
  expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
    `${ORIGIN}/api/auth/callback/${PROVIDER_ID}`
  );
});

test('the pre-1.7 GenericOAuth sign-in route is not served', async () => {
  const { auth } = await setup({ organizations: pinnedOpen });
  const browser = createBrowser(auth);
  const { data, error } = await browser.authClient.signIn.oauth2({
    providerId: PROVIDER_ID,
    callbackURL: '/home',
  });
  expect(data).toBeNull();
  expect(error.status).toBe(404);
});

test('a GenericOAuth callback creates the user, the account and a session under open signup', async () => {
  const { auth, db } = await setup({ organizations: pinnedOpen });
  const browser = createBrowser(auth);
  const { callback } = await signIn({ auth, browser, email: 'new@example.com' });
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).toBe('/home');

  const { data: session } = await browser.authClient.getSession();
  expect(session.user.email).toBe('new@example.com');
  const user = await db.collection('users').findOne({ email: 'new@example.com' });
  const accounts = await db
    .collection('user-accounts')
    .find({ user_id: session.user.id })
    .toArray();
  expect(user).not.toBeNull();
  expect(accounts.map((account) => account.provider_id)).toEqual([PROVIDER_ID]);
});

test('a GenericOAuth callback refuses an uninvited email under invite-only and writes no user', async () => {
  const { auth, db } = await setup({ organizations: pinnedInviteOnly });
  const browser = createBrowser(auth);
  const { callback } = await signIn({ auth, browser, email: 'stranger@example.com' });
  expect(callback.status).toBe(302);
  const location = new URL(callback.headers.get('location'), ORIGIN);
  expect(location.pathname).toBe('/auth/error');
  expect(location.searchParams.get('error')).toBe('MEMBERSHIP_REQUIRED');

  const { data: session } = await browser.authClient.getSession();
  expect(session).toBeNull();
  expect(await db.collection('users').findOne({ email: 'stranger@example.com' })).toBeNull();
});

test('a GenericOAuth callback signs in an invited email under invite-only', async () => {
  const { adapter, auth } = await setup({ organizations: pinnedInviteOnly });
  const organization = await ensureOrganization({ auth, slug: 'default' });
  await adapter.create({
    model: 'invitation',
    data: {
      organizationId: organization.id,
      email: 'invited@example.com',
      role: 'member',
      status: 'pending',
      inviterId: 'operator',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
    },
  });
  const browser = createBrowser(auth);
  const { callback } = await signIn({ auth, browser, email: 'invited@example.com' });
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).toBe('/home');

  const { data: session } = await browser.authClient.getSession();
  expect(session.user.email).toBe('invited@example.com');
});

async function inviteAndSignIn({ adapter, auth, email }) {
  const organization = await ensureOrganization({ auth, slug: 'default' });
  const invitation = await adapter.create({
    model: 'invitation',
    data: {
      organizationId: organization.id,
      email,
      role: 'member',
      status: 'pending',
      inviterId: 'operator',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      createdAt: new Date(),
    },
  });
  const browser = createBrowser(auth);
  await signIn({ auth, browser, email });
  const { data: session } = await browser.authClient.getSession();
  const accepted = await browser.authClient.$fetch('/organization/accept-invitation', {
    method: 'POST',
    body: { invitationId: invitation.id },
  });
  const member = await adapter.findOne({
    model: 'member',
    where: [{ field: 'userId', value: session.user.id }],
  });
  return { accepted, member, session };
}

test('a GenericOAuth user whose issuer sends no email_verified can not accept an invitation', async () => {
  const { adapter, auth } = await setup({ organizations: pinnedInviteOnly });
  const { accepted, member, session } = await inviteAndSignIn({
    adapter,
    auth,
    email: 'plain@unverified.example.com',
  });
  expect(session.user.emailVerified).toBe(false);
  expect(accepted.error.status).toBe(403);
  expect(accepted.error.code).toBe(
    'EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION'
  );
  expect(member).toBeNull();
});

test('a GenericOAuth provider with trustEmail creates a verified user who accepts an invitation', async () => {
  const { adapter, auth } = await setup({ organizations: pinnedInviteOnly, trustEmail: true });
  const { accepted, member, session } = await inviteAndSignIn({
    adapter,
    auth,
    email: 'trusted@unverified.example.com',
  });
  expect(session.user.emailVerified).toBe(true);
  expect(accepted.error).toBeNull();
  expect(member.role).toBe('member');
});

test('setting trustEmail verifies an existing user of the provider on their next sign-in', async () => {
  const before = await setup({ organizations: pinnedOpen });
  await signIn({
    auth: before.auth,
    browser: createBrowser(before.auth),
    email: 'existing@unverified.example.com',
  });
  const { adapter, auth } = await setup({
    organizations: pinnedOpen,
    trustEmail: true,
    database: before.database,
  });
  await signIn({ auth, browser: createBrowser(auth), email: 'existing@unverified.example.com' });

  const users = await adapter.findMany({
    model: 'user',
    where: [{ field: 'email', value: 'existing@unverified.example.com' }],
  });
  expect(users.map((user) => user.emailVerified)).toEqual([true]);
});

// A user enrolled in two-factor: signs in once to exist, then has two-factor
// switched on, so the next sign-in is the one the challenge hook sees.
async function signInEnrolled({ adapter, auth, email }) {
  const first = createBrowser(auth);
  await signIn({ auth, browser: first, email });
  const { data: session } = await first.authClient.getSession();
  await adapter.update({
    model: 'user',
    where: [{ field: 'id', value: session.user.id }],
    update: { twoFactorEnabled: true },
  });
  const browser = createBrowser(auth);
  const { callback } = await signIn({ auth, browser, email });
  return { browser, callback };
}

test('a GenericOAuth callback challenges an enrolled user for a second factor', async () => {
  const { adapter, auth } = await setup({
    organizations: pinnedOpen,
    twoFactor: { enabled: true, mfaTrustedProviderKeys: [] },
  });
  const { browser, callback } = await signInEnrolled({
    adapter,
    auth,
    email: 'enrolled@example.com',
  });
  expect(callback.status).toBe(302);
  const location = new URL(callback.headers.get('location'), ORIGIN);
  expect(location.pathname).toBe('/two-factor');
  expect(location.searchParams.get('callbackUrl')).toBe('/home');

  const { data: session } = await browser.authClient.getSession();
  expect(session).toBeNull();
});

test('a GenericOAuth callback skips the second factor when the provider is trusted for two-factor', async () => {
  const { adapter, auth } = await setup({
    organizations: pinnedOpen,
    twoFactor: { enabled: true, mfaTrustedProviderKeys: [PROVIDER_ID] },
  });
  const { browser, callback } = await signInEnrolled({
    adapter,
    auth,
    email: 'trusted@example.com',
  });
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).toBe('/home');

  const { data: session } = await browser.authClient.getSession();
  expect(session.user.email).toBe('trusted@example.com');
});

// What a direct caller holding an id token does: no redirect, no callback - the
// token goes straight to /sign-in/social and the session comes back on the
// response.
async function signInWithIdToken({ browser, email }) {
  return browser.authClient.signIn.social({
    provider: OIDC_PROVIDER_ID,
    idToken: { token: signIdToken({ email }) },
  });
}

test('an id token sign-in creates a session for a user not enrolled in two-factor', async () => {
  const { auth } = await setup({
    organizations: pinnedOpen,
    twoFactor: { enabled: true, mfaTrustedProviderKeys: [] },
  });
  const browser = createBrowser(auth);
  const { data, error } = await signInWithIdToken({ browser, email: 'plain@example.com' });
  expect(error).toBeNull();
  expect(data.redirect).toBe(false);

  const { data: session } = await browser.authClient.getSession();
  expect(session.user.email).toBe('plain@example.com');
});

test('an id token sign-in challenges a user enrolled in two-factor', async () => {
  const { adapter, auth, db } = await setup({
    organizations: pinnedOpen,
    twoFactor: { enabled: true, mfaTrustedProviderKeys: [] },
  });
  const first = createBrowser(auth);
  await signInWithIdToken({ browser: first, email: 'enrolled-id-token@example.com' });
  const { data: firstSession } = await first.authClient.getSession();
  await adapter.update({
    model: 'user',
    where: [{ field: 'id', value: firstSession.user.id }],
    update: { twoFactorEnabled: true },
  });

  const browser = createBrowser(auth);
  const { data, error } = await signInWithIdToken({
    browser,
    email: 'enrolled-id-token@example.com',
  });
  expect(error).toBeNull();
  expect(data).toEqual({ twoFactorRedirect: true, twoFactorMethods: ['totp'] });

  const { data: session } = await browser.authClient.getSession();
  expect(session).toBeNull();
  // The cookie jar keeps only the expiring cookie, so check the row itself: the
  // challenged sign-in's session is gone and only the first one remains.
  const sessions = await db
    .collection('user-sessions')
    .countDocuments({ user_id: firstSession.user.id });
  expect(sessions).toBe(1);
});

test('an id token sign-in skips the second factor when the provider is trusted for two-factor', async () => {
  const { adapter, auth } = await setup({
    organizations: pinnedOpen,
    twoFactor: { enabled: true, mfaTrustedProviderKeys: [OIDC_PROVIDER_ID] },
  });
  const first = createBrowser(auth);
  await signInWithIdToken({ browser: first, email: 'trusted-id-token@example.com' });
  const { data: firstSession } = await first.authClient.getSession();
  await adapter.update({
    model: 'user',
    where: [{ field: 'id', value: firstSession.user.id }],
    update: { twoFactorEnabled: true },
  });

  const browser = createBrowser(auth);
  const { error } = await signInWithIdToken({ browser, email: 'trusted-id-token@example.com' });
  expect(error).toBeNull();

  const { data: session } = await browser.authClient.getSession();
  expect(session.user.email).toBe('trusted-id-token@example.com');
});
