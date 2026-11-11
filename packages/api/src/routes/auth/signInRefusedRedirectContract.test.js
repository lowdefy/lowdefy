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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { admin, magicLink } from 'better-auth/plugins';

import composeBeforeSlot from './hooks/composeBeforeSlot.js';
import createUserBeforeHook from './hooks/createUserBeforeHook.js';
import getBetterAuthConfig from './getBetterAuthConfig.js';
import buildRequestHooks from './requestHooks/buildRequestHooks.js';

// Contract test against the installed BetterAuth release for the
// refused-sign-in redirect on /magic-link/verify (createSignInRefusedRedirectHook).
// The first test pins the upstream gap: without the hook, the endpoint answers
// a refusal thrown at session creation with JSON. If upstream starts
// redirecting it, that test fails and the hook can go.

const ORIGIN = 'https://app.example.com';
const VERIFY_PATH = '/api/auth/magic-link/verify';
const NO_ACCESS = 'You have not been granted access to this application.';

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

beforeEach(() => {
  process.env.BETTER_AUTH_URL = ORIGIN;
});

afterEach(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
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

// The sent link's token on a verify URL carrying the given query, so one link
// can be followed with whichever destinations a test needs.
function verifyRequest({ link, query }) {
  const url = new URL(VERIFY_PATH, ORIGIN);
  url.searchParams.set('token', new URL(link).searchParams.get('token'));
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  return new Request(url);
}

function withoutErrorParams(location) {
  const url = new URL(location);
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  return url.toString();
}

// A plain BetterAuth with the magic-link and admin plugins, and the engine's
// request hooks when withHooks is set. advanced is passed through so a test can
// turn on the origin checks BetterAuth skips in its test environment.
async function createBannedUserAuth({ withHooks = true, advanced, databaseHooks } = {}) {
  const links = [];
  let auth = null;
  const hooks = withHooks
    ? buildRequestHooks({
        authConfig: {
          magicLink: { enabled: true },
          organizations: { policy: 'tenant', signup: 'open' },
        },
        getAuth: () => auth,
        logger: createLogger(),
      })
    : undefined;
  auth = betterAuth({
    baseURL: ORIGIN,
    secret: 'a-test-secret-that-is-at-least-32-characters-long',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    plugins: [
      magicLink({
        sendMagicLink: async ({ url }) => {
          links.push(url);
        },
      }),
      admin(),
    ],
    hooks,
    advanced,
    databaseHooks,
  });
  const { user } = await auth.api.createUser({
    body: { email: 'banned@example.com', name: 'Banned', password: 'a-long-password-123' },
  });
  const authContext = await auth.$context;
  // The link is sent before the ban: a banned user is sent no link at all
  // (createEmailSendGate), so the refusal is met by a link already in the inbox.
  async function sendLink({ ban = true } = {}) {
    await auth.api.signInMagicLink({
      body: { email: 'banned@example.com', callbackURL: '/home', errorCallbackURL: '/login' },
      headers: new Headers(),
    });
    if (ban) {
      await authContext.internalAdapter.updateUser(user.id, { banned: true });
    }
    return links.at(-1);
  }
  return { auth, sendLink };
}

test('BetterAuth answers a banned user following a magic link with JSON', async () => {
  const { auth, sendLink } = await createBannedUserAuth({ withHooks: false });
  const response = await auth.handler(new Request(await sendLink()));
  expect(response.status).toBe(403);
  expect((await response.json()).code).toBe('BANNED_USER');
});

test('a banned user following a magic link is redirected to the error page', async () => {
  const { auth, sendLink } = await createBannedUserAuth();
  const response = await auth.handler(new Request(await sendLink()));
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location'));
  expect(location.origin + location.pathname).toBe(`${ORIGIN}/login`);
  expect(location.searchParams.get('error')).toBe('BANNED_USER');
});

// The hook resolves the error URL itself, since the endpoint does not expose
// it. For each query shape, a refusal must land where the endpoint sends an
// expired link (INVALID_TOKEN) with the same query.
test.each([
  ['a relative errorCallbackURL', { callbackURL: '/home', errorCallbackURL: '/login' }],
  ['no errorCallbackURL', { callbackURL: '/home' }],
  ['an empty errorCallbackURL', { callbackURL: '/home', errorCallbackURL: '' }],
  ['no callbackURL', {}],
  [
    'an encoded errorCallbackURL',
    { callbackURL: '/home', errorCallbackURL: '%2Fa%2Flogin%3Fx%3D1' },
  ],
  ['an absolute errorCallbackURL', { callbackURL: '/home', errorCallbackURL: `${ORIGIN}/e?x=1` }],
])('a refusal lands where an expired link does, with %s', async (_, query) => {
  const { auth, sendLink } = await createBannedUserAuth();
  const refused = await auth.handler(verifyRequest({ link: await sendLink(), query }));
  const expired = await auth.handler(verifyRequest({ link: `${ORIGIN}?token=expired`, query }));
  expect(refused.status).toBe(302);
  expect(new URL(refused.headers.get('location')).searchParams.get('error')).toBe('BANNED_USER');
  expect(new URL(expired.headers.get('location')).searchParams.get('error')).toBe('INVALID_TOKEN');
  expect(withoutErrorParams(refused.headers.get('location'))).toBe(
    withoutErrorParams(expired.headers.get('location'))
  );
});

test('an origin check failure is not redirected to an untrusted error callback URL', async () => {
  const { auth, sendLink } = await createBannedUserAuth({
    advanced: { disableOriginCheck: false },
  });
  const response = await auth.handler(
    verifyRequest({
      link: await sendLink(),
      query: { callbackURL: '/home', errorCallbackURL: 'https://evil.com/login' },
    })
  );
  expect(response.status).toBe(403);
  // The same code as an untrusted callbackURL, so the hook cannot tell from the
  // code which URL failed - only its own check of the destination stops this.
  expect((await response.json()).code).toBe('INVALID_CALLBACK_URL');
});

test('an origin check failure is redirected to a trusted error callback URL', async () => {
  const { auth, sendLink } = await createBannedUserAuth({
    advanced: { disableOriginCheck: false },
  });
  const response = await auth.handler(
    verifyRequest({
      link: await sendLink(),
      query: { callbackURL: 'https://evil.com/home', errorCallbackURL: '/login' },
    })
  );
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location'));
  expect(location.pathname).toBe('/login');
  expect(location.searchParams.get('error')).toBe('INVALID_CALLBACK_URL');
});

test('a server-side magicLinkVerify call for a banned user still throws the refusal', async () => {
  const { auth, sendLink } = await createBannedUserAuth();
  const token = new URL(await sendLink()).searchParams.get('token');
  await expect(
    auth.api.magicLinkVerify({
      query: { token, callbackURL: '/home', errorCallbackURL: '/login' },
      headers: new Headers(),
    })
  ).rejects.toMatchObject({ body: { code: 'BANNED_USER' } });
});

test("an app's session.create.before :reject is redirected to the error page", async () => {
  const refuseSignIn = createUserBeforeHook({
    dispatch: async () => ({ status: 'reject', error: new Error('Sign-in is closed today.') }),
    hook: { id: 'refuse-sign-in', point: 'session.create.before' },
  });
  // The banned user is the only user, so leave the ban off: the app hook is
  // the refusal under test.
  const { auth, sendLink } = await createBannedUserAuth({
    databaseHooks: {
      session: { create: { before: composeBeforeSlot({ hooks: [refuseSignIn] }) } },
    },
  });
  const response = await auth.handler(new Request(await sendLink({ ban: false })));
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location'));
  expect(location.pathname).toBe('/login');
  expect(location.searchParams.get('error')).toBe('AUTH_HOOK_REJECTED');
  expect(location.searchParams.get('error_description')).toBe('Sign-in is closed today.');
});

// The engine's own configuration, so the membership refusals come from the
// real admission gate and active-organization wall. Only the magic-link plugin
// is swapped, for one that keeps the link instead of emailing it.
async function createInviteOnlyAuth() {
  const links = [];
  let auth;
  const options = getBetterAuthConfig({
    appMeta: { name: 'Test App', slug: 'test-app' },
    authJson: {
      configured: true,
      secret: { _secret: 'BETTER_AUTH_SECRET' },
      providers: [],
      session: {
        expiresIn: 604800,
        updateAge: 86400,
        cookieCache: { enabled: false, maxAge: 300 },
        crossSubDomainCookies: { enabled: false },
      },
      account: { accountLinking: { enabled: true, trustedProviders: [] } },
      rateLimit: { enabled: false, window: 60, max: 100 },
      authPages: { signIn: '/login', error: '/auth/error' },
      api: { roles: {} },
      pages: { roles: {} },
      websockets: { roles: {} },
      organizations: { policy: 'tenant', signup: 'invite-only' },
      roles: [],
      email: { connectionId: 'email' },
      magicLink: { enabled: true, expiresIn: 300, disableSignUp: false },
    },
    createSystemContext: vi.fn(),
    getAuth: () => auth,
    logger: createLogger(),
    plugins: { adapters: {}, providers: {} },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  const magicLinkIndex = options.plugins.findIndex((plugin) => plugin.id === 'magic-link');
  options.plugins[magicLinkIndex] = magicLink({
    sendMagicLink: async ({ url }) => {
      links.push(url);
    },
  });
  const db = {};
  auth = betterAuth({ ...options, database: memoryAdapter(db) });
  const context = await auth.$context;
  Object.values(context.tables).forEach(({ modelName }) => {
    db[modelName] = [];
  });
  const { adapter } = context;
  const organization = await adapter.create({
    model: 'organization',
    data: { name: 'Acme', slug: 'acme', createdAt: new Date() },
  });
  async function sendLink(email) {
    await auth.api.signInMagicLink({
      body: { email, callbackURL: '/home', errorCallbackURL: '/auth/error' },
      headers: new Headers(),
    });
    return links.at(-1);
  }
  async function followLink(link) {
    const response = await auth.handler(new Request(link));
    expect(response.status).toBe(302);
    return new URL(response.headers.get('location'));
  }
  return { adapter, followLink, organization, sendLink };
}

// The send gate admits only a member or an invitee, so each link is minted
// while the person is admitted and followed once they no longer are - as for
// someone removed, or whose invitation was cancelled, between asking for the
// link and clicking it.

test('an existing user removed from their last organization is redirected with MEMBERSHIP_REQUIRED', async () => {
  const { adapter, followLink, organization, sendLink } = await createInviteOnlyAuth();
  const user = await adapter.create({
    model: 'user',
    data: {
      email: 'former@example.com',
      name: 'Former',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await adapter.create({
    model: 'member',
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'member',
      createdAt: new Date(),
    },
  });
  const link = await sendLink('former@example.com');
  await adapter.delete({ model: 'member', where: [{ field: 'userId', value: user.id }] });
  const location = await followLink(link);
  expect(location.pathname).toBe('/auth/error');
  expect(location.searchParams.get('error')).toBe('MEMBERSHIP_REQUIRED');
  expect(location.searchParams.get('error_description')).toBe(NO_ACCESS);
});

test('a new user refused at user creation lands with the same error and description', async () => {
  const { adapter, followLink, organization, sendLink } = await createInviteOnlyAuth();
  const invitation = await adapter.create({
    model: 'invitation',
    data: {
      organizationId: organization.id,
      email: 'invited@example.com',
      role: 'member',
      status: 'pending',
      inviterId: 'inviter',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
    },
  });
  const link = await sendLink('invited@example.com');
  await adapter.update({
    model: 'invitation',
    where: [{ field: 'id', value: invitation.id }],
    update: { status: 'canceled' },
  });
  const location = await followLink(link);
  expect(location.pathname).toBe('/auth/error');
  expect(location.searchParams.get('error')).toBe('MEMBERSHIP_REQUIRED');
  expect(location.searchParams.get('error_description')).toBe(NO_ACCESS);
});
