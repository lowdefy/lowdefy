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
// callback with a code, as the issuer's redirect would.

import http from 'node:http';

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

const { betterAuth } = await import('better-auth');
const { createAuthClient } = await import('better-auth/client');
const { MongoDBAuthAdapter } = await import('@lowdefy/connection-mongodb/auth/adapters');
const { GenericOAuth } = await import('@lowdefy/plugin-better-auth/auth/providers');
const { default: getBetterAuthConfig } = await import('./getBetterAuthConfig.js');
const { default: ensureAuthIndexes } = await import('./organizations/ensureAuthIndexes.js');
const { default: ensureOrganization } = await import('./organizations/ensureOrganization.js');

const ORIGIN = 'http://localhost:3263';
const PROVIDER_ID = 'my-idp';
const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

let client;
let issuer;
let issuerUrl;
let run = 0;

// The token endpoint hands the code back as the access token, and the userinfo
// endpoint reads the email from it, so each test picks its user by the code.
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
    if (req.method === 'GET' && url.pathname === '/userinfo') {
      const email = req.headers.authorization.replace('Bearer ', '');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: `sub-${email}`, email, email_verified: true, name: email }));
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
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isLevelEnabled: jest.fn(() => false),
  };
}

async function setup({ organizations, twoFactor }) {
  run += 1;
  const database = `genericOAuthSignIn${run}`;
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
  return { adapter, auth, db: client.db(database) };
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
