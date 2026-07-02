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
    totp: true,
    otp: true,
    backupCodes: true,
  });
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
