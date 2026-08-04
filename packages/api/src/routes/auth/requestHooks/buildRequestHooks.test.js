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

// Each slot is wrapped in createAuthMiddleware; mock it to identity so the unit
// test can invoke a slot with a plain endpoint context.
jest.unstable_mockModule('better-auth/api', () => ({
  createAuthMiddleware: (handler) => handler,
}));

// beginTwoFactorChallenge is exercised against a fake endpoint context in its
// own test; here the interest is only which paths reach it.
const mockBeginTwoFactorChallenge = jest.fn(async () => 'challenged');
jest.unstable_mockModule('./beginTwoFactorChallenge.js', () => ({
  default: mockBeginTwoFactorChallenge,
}));

const { default: buildRequestHooks } = await import('./buildRequestHooks.js');

const pinnedOrg = { id: 'org_pinned', slug: 'team-portal', name: 'team-portal' };
const organizations = { policy: 'pinned', org: 'team-portal', signup: 'invite-only' };

function createMockAuth({ invitations = [] } = {}) {
  const adapter = {
    findOne: jest.fn(async ({ model }) => (model === 'organization' ? pinnedOrg : null)),
    findMany: jest.fn(async () => invitations),
    create: jest.fn(async ({ model, data }) => ({ id: `${model}_new`, ...data })),
  };
  const internalAdapter = {
    findUserById: jest.fn(async () => null),
    findUserByEmail: jest.fn(async () => null),
  };
  return { $context: Promise.resolve({ adapter, internalAdapter }) };
}

test('buildRequestHooks returns a before and an after slot with no magic link configured', async () => {
  const getAuth = jest.fn();
  const hooks = buildRequestHooks({ authConfig: { organizations }, getAuth });
  expect(typeof hooks.before).toBe('function');
  expect(typeof hooks.after).toBe('function');
  expect(
    await hooks.before({ path: '/sign-in/magic-link', body: { email: 'x@example.com' } })
  ).toBe(undefined);
  expect(await hooks.after({ path: '/sign-in/magic-link' })).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('buildRequestHooks routes /sign-in/magic-link into the send gate when magicLink is enabled', async () => {
  const auth = createMockAuth({ invitations: [] });
  const hooks = buildRequestHooks({
    authConfig: { magicLink: { enabled: true }, organizations },
    getAuth: () => auth,
  });
  const result = await hooks.before({
    path: '/sign-in/magic-link',
    body: { email: 'stranger@example.com' },
  });
  expect(result).toEqual({ status: true });
});

test('buildRequestHooks leaves paths other than /sign-in/magic-link alone when magicLink is enabled', async () => {
  const getAuth = jest.fn();
  const hooks = buildRequestHooks({
    authConfig: { magicLink: { enabled: true }, organizations },
    getAuth,
  });
  expect(
    await hooks.before({ path: '/sign-in/email', body: { email: 'stranger@example.com' } })
  ).toBeUndefined();
  expect(
    await hooks.after({ path: '/sign-in/magic-link', body: { email: 'stranger@example.com' } })
  ).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('buildRequestHooks does not resolve the BetterAuth instance while assembling', () => {
  const getAuth = jest.fn();
  buildRequestHooks({ authConfig: { magicLink: { enabled: true }, organizations }, getAuth });
  expect(getAuth).not.toHaveBeenCalled();
});

const twoFactorAuthConfig = {
  authPages: { twoFactor: '/two-factor' },
  magicLink: { enabled: true },
  organizations,
  twoFactor: { enabled: true },
};

// Enough of an endpoint context to reach the challenge; the challenge itself is
// mocked, so only the pending redirect the exit reads matters.
function createEnrolledCtx() {
  return {
    path: '/magic-link/verify',
    context: {
      newSession: { user: { id: 'user_1', twoFactorEnabled: true } },
      responseHeaders: new Headers({ location: 'https://app.example.com/invoices' }),
    },
    redirect: (url) => ({ redirectTo: url }),
    // Stands in for Hono's Response so a returning exit can be told apart from
    // a thrown redirect by shape alone.
    json: (body) => ({ jsonBody: body }),
  };
}

async function catchAfter(hooks, ctx) {
  try {
    return { returned: await hooks.after(ctx) };
  } catch (thrown) {
    return { thrown };
  }
}

beforeEach(() => {
  mockBeginTwoFactorChallenge.mockClear();
});

test('buildRequestHooks challenges an enrolled user on /magic-link/verify when twoFactor and magicLink are enabled', async () => {
  const hooks = buildRequestHooks({
    authConfig: twoFactorAuthConfig,
    basePath: '/app',
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });

  const { thrown } = await catchAfter(hooks, createEnrolledCtx());

  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
  expect(thrown.redirectTo).toBe('https://app.example.com/app/two-factor?callbackUrl=%2Finvoices');
});

test('buildRequestHooks does not challenge on a path no registration claims', async () => {
  const hooks = buildRequestHooks({
    authConfig: twoFactorAuthConfig,
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });

  const ctx = createEnrolledCtx();
  ctx.path = '/get-session';

  expect(await hooks.after(ctx)).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

test('buildRequestHooks registers no two factor challenge when twoFactor is disabled', async () => {
  const hooks = buildRequestHooks({
    authConfig: { ...twoFactorAuthConfig, twoFactor: { enabled: false } },
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });

  expect(await hooks.after(createEnrolledCtx())).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

test('buildRequestHooks registers no two factor challenge when magicLink is disabled', async () => {
  const hooks = buildRequestHooks({
    authConfig: { ...twoFactorAuthConfig, magicLink: { enabled: false } },
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });

  expect(await hooks.after(createEnrolledCtx())).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

test('buildRequestHooks registers no two factor challenge when authPages.twoFactor is unset', async () => {
  const hooks = buildRequestHooks({
    authConfig: { ...twoFactorAuthConfig, authPages: {} },
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });

  expect(await hooks.after(createEnrolledCtx())).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

function createOAuthHooks(mfaTrustedProviderKeys) {
  return buildRequestHooks({
    authConfig: {
      ...twoFactorAuthConfig,
      twoFactor: { enabled: true, mfaTrustedProviderKeys },
    },
    basePath: '/app',
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });
}

function createOAuthCtx(path) {
  const ctx = createEnrolledCtx();
  ctx.path = path;
  return ctx;
}

test('buildRequestHooks challenges both OAuth callbacks when no provider is trusted', async () => {
  const hooks = createOAuthHooks([]);

  expect((await catchAfter(hooks, createOAuthCtx('/callback/google'))).thrown.redirectTo).toBe(
    'https://app.example.com/app/two-factor?callbackUrl=%2Finvoices'
  );
  expect(
    (await catchAfter(hooks, createOAuthCtx('/oauth2/callback/my-idp'))).thrown.redirectTo
  ).toBe('https://app.example.com/app/two-factor?callbackUrl=%2Finvoices');
  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(2);
});

test('buildRequestHooks skips a trusted built-in provider by its lowercase type key and still challenges a generic provider', async () => {
  const hooks = createOAuthHooks(['google']);

  expect(await hooks.after(createOAuthCtx('/callback/google'))).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();

  expect(
    (await catchAfter(hooks, createOAuthCtx('/oauth2/callback/my-idp'))).thrown.redirectTo
  ).toBe('https://app.example.com/app/two-factor?callbackUrl=%2Finvoices');
  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
});

test('buildRequestHooks skips a trusted GenericOAuth provider by its id and still challenges a built-in provider', async () => {
  const hooks = createOAuthHooks(['my-idp']);

  expect(await hooks.after(createOAuthCtx('/oauth2/callback/my-idp'))).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();

  expect((await catchAfter(hooks, createOAuthCtx('/callback/google'))).thrown.redirectTo).toBe(
    'https://app.example.com/app/two-factor?callbackUrl=%2Finvoices'
  );
  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
});

test('buildRequestHooks challenges the OAuth callbacks with mfaTrustedProviderKeys unset', async () => {
  const hooks = createOAuthHooks(undefined);

  expect((await catchAfter(hooks, createOAuthCtx('/callback/google'))).thrown.redirectTo).toBe(
    'https://app.example.com/app/two-factor?callbackUrl=%2Finvoices'
  );
  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
});

test('buildRequestHooks challenges an OAuth callback with magicLink disabled', async () => {
  const hooks = buildRequestHooks({
    authConfig: { ...twoFactorAuthConfig, magicLink: { enabled: false } },
    basePath: '/app',
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });

  expect((await catchAfter(hooks, createOAuthCtx('/callback/google'))).thrown.redirectTo).toBe(
    'https://app.example.com/app/two-factor?callbackUrl=%2Finvoices'
  );
  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
});

test('buildRequestHooks challenges neither OAuth callback when twoFactor is disabled', async () => {
  const hooks = buildRequestHooks({
    authConfig: { ...twoFactorAuthConfig, twoFactor: { enabled: false } },
    basePath: '/app',
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });

  expect(await hooks.after(createOAuthCtx('/callback/google'))).toBeUndefined();
  expect(await hooks.after(createOAuthCtx('/oauth2/callback/my-idp'))).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

// /callback/:id also serves account linking, which attaches an account to an
// already signed-in user and redirects without minting a session, so a null
// newSession there is the ordinary linking case and must pass through untouched.
test('buildRequestHooks leaves an account linking callback with no new session untouched', async () => {
  const hooks = createOAuthHooks([]);
  const ctx = createOAuthCtx('/callback/google');
  ctx.context.newSession = null;

  const { returned, thrown } = await catchAfter(hooks, ctx);

  expect(thrown).toBeUndefined();
  expect(returned).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

const phoneNumberAuthConfig = {
  ...twoFactorAuthConfig,
  phoneNumber: { enabled: true },
};

function createPhoneHooks(authConfig) {
  return buildRequestHooks({
    authConfig,
    basePath: '/app',
    baseUrlOrigin: 'https://app.example.com',
    getAuth: jest.fn(),
  });
}

function createPhoneVerifyCtx(path = '/phone-number/verify') {
  const ctx = createEnrolledCtx();
  ctx.path = path;
  return ctx;
}

test('buildRequestHooks challenges an enrolled user on /phone-number/verify with a JSON response rather than a redirect', async () => {
  const hooks = createPhoneHooks(phoneNumberAuthConfig);

  const { returned, thrown } = await catchAfter(hooks, createPhoneVerifyCtx());

  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
  expect(thrown).toBeUndefined();
  expect(returned).toEqual({
    jsonBody: { twoFactorRedirect: true, twoFactorMethods: ['totp'] },
  });
});

test('buildRequestHooks claims no phone path other than /phone-number/verify', async () => {
  const hooks = createPhoneHooks(phoneNumberAuthConfig);

  expect(await hooks.after(createPhoneVerifyCtx('/phone-number/send-otp'))).toBeUndefined();
  expect(await hooks.after(createPhoneVerifyCtx('/phone-number/verify-otp'))).toBeUndefined();
  // The plugin's own matcher covers /sign-in/phone-number, so claiming it here
  // would double-fire the challenge rather than close a gap.
  expect(await hooks.after(createPhoneVerifyCtx('/sign-in/phone-number'))).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

test('buildRequestHooks registers no phone number challenge when phoneNumber is disabled', async () => {
  const hooks = createPhoneHooks({ ...phoneNumberAuthConfig, phoneNumber: { enabled: false } });

  expect(await hooks.after(createPhoneVerifyCtx())).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

test('buildRequestHooks registers no phone number challenge when twoFactor is disabled', async () => {
  const hooks = createPhoneHooks({ ...phoneNumberAuthConfig, twoFactor: { enabled: false } });

  expect(await hooks.after(createPhoneVerifyCtx())).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
});

// Sign-up and phone-change confirmation reach /phone-number/verify too, and
// neither can be answered by a user holding no two-factor row.
test('buildRequestHooks leaves an unenrolled user on /phone-number/verify untouched', async () => {
  const hooks = createPhoneHooks(phoneNumberAuthConfig);
  const ctx = createPhoneVerifyCtx();
  ctx.context.newSession = { user: { id: 'user_1', twoFactorEnabled: false } };

  const { returned, thrown } = await catchAfter(hooks, ctx);

  expect(thrown).toBeUndefined();
  expect(returned).toBeUndefined();
  expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
  expect(ctx.context.newSession).toEqual({ user: { id: 'user_1', twoFactorEnabled: false } });
});

// A trusted device already stepped up, so the endpoint's own session-bearing
// response must stand and PhoneNumberVerify must see no flag to navigate on.
test('buildRequestHooks returns no challenge flag on /phone-number/verify when the device is trusted', async () => {
  const hooks = createPhoneHooks(phoneNumberAuthConfig);
  mockBeginTwoFactorChallenge.mockResolvedValueOnce('trusted');

  const { returned, thrown } = await catchAfter(hooks, createPhoneVerifyCtx());

  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
  expect(thrown).toBeUndefined();
  expect(returned).toBeUndefined();
});

// This exit hands the destination to the client, so the registration must not
// pick up the redirect paths' twoFactorPageUrl guard in a later refactor.
test('buildRequestHooks challenges /phone-number/verify with authPages.twoFactor unset', async () => {
  const hooks = createPhoneHooks({ ...phoneNumberAuthConfig, authPages: {} });

  const { returned } = await catchAfter(hooks, createPhoneVerifyCtx());

  expect(mockBeginTwoFactorChallenge).toHaveBeenCalledTimes(1);
  expect(returned).toEqual({
    jsonBody: { twoFactorRedirect: true, twoFactorMethods: ['totp'] },
  });
});
