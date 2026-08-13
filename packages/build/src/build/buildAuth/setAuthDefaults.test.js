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

import setAuthDefaults from './setAuthDefaults.js';

test('setAuthDefaults sets only authorization defaults when auth is not configured', () => {
  const components = {
    auth: {
      configured: false,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res).toEqual({
    auth: {
      configured: false,
      api: { roles: {} },
      pages: { roles: {} },
      websockets: { roles: {} },
      providers: [],
    },
  });
});

test('setAuthDefaults does not set authorization defaults over existing values', () => {
  const components = {
    auth: {
      configured: false,
      api: { protected: true, roles: { admin: ['a'] } },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.api).toEqual({ protected: true, roles: { admin: ['a'] } });
});

test('setAuthDefaults sets full defaults when auth is configured', () => {
  const components = {
    auth: {
      configured: true,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res).toEqual({
    auth: {
      configured: true,
      api: { roles: {} },
      pages: { roles: {} },
      websockets: { roles: {} },
      providers: [],
      hooks: [],
      strategies: [],
      organizations: {
        policy: 'pinned',
        org: 'default',
        signup: 'invite-only',
      },
      authPages: {
        signIn: '/login',
        signUp: '/signup',
        error: '/auth/error',
        forgotPassword: '/forgot-password',
        resetPassword: '/reset-password',
        verifyEmail: '/verify-email',
      },
      session: {
        expiresIn: 604800,
        updateAge: 86400,
        cookieCache: { enabled: false, maxAge: 300 },
        crossSubDomainCookies: { enabled: false },
      },
      account: {
        accountLinking: { enabled: true, trustedProviders: [] },
      },
      rateLimit: { enabled: true, window: 60, max: 100 },
    },
  });
});

test('setAuthDefaults sets strategies to an empty array when auth is configured', () => {
  const components = {
    auth: {
      configured: true,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.strategies).toEqual([]);
});

test('setAuthDefaults does not set strategies when auth is not configured', () => {
  const components = {
    auth: {
      configured: false,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.strategies).toBeUndefined();
});

test('setAuthDefaults does not overwrite explicitly provided values', () => {
  const components = {
    auth: {
      configured: true,
      authPages: { signIn: '/custom-login' },
      session: { expiresIn: 100 },
      rateLimit: { enabled: false },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.authPages.signIn).toBe('/custom-login');
  expect(res.auth.authPages.signUp).toBe('/signup');
  expect(res.auth.session.expiresIn).toBe(100);
  expect(res.auth.session.updateAge).toBe(86400);
  expect(res.auth.rateLimit.enabled).toBe(false);
  expect(res.auth.rateLimit.window).toBe(60);
});

test('setAuthDefaults does not default authPages.twoFactor - it stays unset so the build check in validateAuthConfig can require it', () => {
  const components = {
    auth: {
      configured: true,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.authPages.twoFactor).toBeUndefined();
});

test('setAuthDefaults pins the auto-seeded default org with invite-only signup', () => {
  const components = {
    auth: {
      configured: true,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.organizations).toEqual({
    policy: 'pinned',
    org: 'default',
    signup: 'invite-only',
  });
});

test('setAuthDefaults does not overwrite explicit organizations values under pinned', () => {
  const components = {
    auth: {
      configured: true,
      organizations: { policy: 'pinned', org: 'team-portal', signup: 'open' },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.organizations).toEqual({
    policy: 'pinned',
    org: 'team-portal',
    signup: 'open',
  });
});

test('setAuthDefaults defaults signup to open and create to auto under the tenant policy', () => {
  const components = {
    auth: {
      configured: true,
      organizations: { policy: 'tenant' },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.organizations).toEqual({ policy: 'tenant', signup: 'open', create: 'auto' });
});

test('setAuthDefaults sets no org default under the tenant policy', () => {
  const components = {
    auth: {
      configured: true,
      organizations: { policy: 'tenant' },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.organizations.org).toBeUndefined();
});

test('setAuthDefaults does not overwrite explicit signup or create under the tenant policy', () => {
  const components = {
    auth: {
      configured: true,
      organizations: { policy: 'tenant', signup: 'invite-only', create: 'operator' },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.organizations).toEqual({
    policy: 'tenant',
    signup: 'invite-only',
    create: 'operator',
  });
});

test('setAuthDefaults does not add emailAndPassword or magicLink blocks when absent', () => {
  const components = {
    auth: {
      configured: true,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.emailAndPassword).toBeUndefined();
  expect(res.auth.magicLink).toBeUndefined();
});

test('setAuthDefaults fills emailAndPassword defaults when present', () => {
  const components = {
    auth: {
      configured: true,
      emailAndPassword: { enabled: true },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.emailAndPassword).toEqual({
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    disableSignUp: false,
  });
});

test('setAuthDefaults fills magicLink defaults when present', () => {
  const components = {
    auth: {
      configured: true,
      magicLink: { enabled: true },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.magicLink).toEqual({
    enabled: true,
    expiresIn: 300,
    disableSignUp: false,
  });
});

test('setAuthDefaults does not add twoFactor or passkey blocks when absent', () => {
  const components = {
    auth: {
      configured: true,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.twoFactor).toBeUndefined();
  expect(res.auth.passkey).toBeUndefined();
});

test('setAuthDefaults enables twoFactor sub-options by default when the block is present', () => {
  const components = {
    auth: {
      configured: true,
      twoFactor: {},
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.twoFactor).toEqual({
    enabled: true,
    required: false,
  });
});

test('setAuthDefaults keeps twoFactor.required true when explicitly set', () => {
  const components = {
    auth: {
      configured: true,
      twoFactor: { enabled: true, required: true },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.twoFactor.required).toBe(true);
});

test('setAuthDefaults enables passkey by default when the block is present', () => {
  const components = {
    auth: {
      configured: true,
      passkey: {},
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.passkey).toEqual({ enabled: true });
});

test('setAuthDefaults does not add a phoneNumber block when absent', () => {
  const components = {
    auth: {
      configured: true,
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.phoneNumber).toBeUndefined();
});

test('setAuthDefaults writes phoneNumber OTP defaults when the block is present', () => {
  const components = {
    auth: {
      configured: true,
      phoneNumber: { enabled: true },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.phoneNumber).toEqual({
    enabled: true,
    otpLength: 6,
    expiresIn: 300,
    allowedAttempts: 3,
    requireVerification: false,
  });
});

test('setAuthDefaults keeps explicit phoneNumber values', () => {
  const components = {
    auth: {
      configured: true,
      phoneNumber: {
        enabled: true,
        otpLength: 8,
        expiresIn: 120,
        allowedAttempts: 5,
        requireVerification: true,
        signUpOnVerification: { tempEmailDomain: 'phone.example.com' },
      },
    },
  };
  const res = setAuthDefaults({ components });
  expect(res.auth.phoneNumber).toEqual({
    enabled: true,
    otpLength: 8,
    expiresIn: 120,
    allowedAttempts: 5,
    requireVerification: true,
    signUpOnVerification: { tempEmailDomain: 'phone.example.com' },
  });
});
