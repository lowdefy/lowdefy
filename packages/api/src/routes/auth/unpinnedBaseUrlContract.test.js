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
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

import getBetterAuthConfig from './getBetterAuthConfig.js';

// Contract test against the installed better-auth release: constructs a real
// BetterAuth instance (memory adapter - no database) from the options assembled
// with no pinned origin, and asserts that the origin BetterAuth trusts is the
// request's own, so an upstream change to how an unset baseURL resolves fails
// here instead of at runtime.
//
// BetterAuth skips its origin check when NODE_ENV is 'test', as it is under
// jest, so the instance turns it back on explicitly.

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

beforeEach(() => {
  delete process.env.BETTER_AUTH_URL;
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
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isLevelEnabled: jest.fn(() => false),
  };
}

function createAuth() {
  const options = getBetterAuthConfig({
    appMeta: { name: 'Test App', slug: 'test-app' },
    authJson: {
      configured: true,
      secret: { _secret: 'BETTER_AUTH_SECRET' },
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
        disableSignUp: false,
      },
      providers: [],
      session: {
        expiresIn: 604800,
        updateAge: 86400,
        cookieCache: { enabled: false, maxAge: 300 },
        crossSubDomainCookies: { enabled: false },
      },
      account: { accountLinking: { enabled: true, trustedProviders: [] } },
      rateLimit: { enabled: false, window: 60, max: 100 },
      authPages: {
        signIn: '/login',
        signUp: '/signup',
        error: '/auth/error',
        forgotPassword: '/forgot-password',
        resetPassword: '/reset-password',
        verifyEmail: '/verify-email',
      },
      api: { roles: {} },
      pages: { roles: {} },
      websockets: { roles: {} },
      organizations: { policy: 'pinned', org: 'default', signup: 'invite-only' },
      roles: [],
    },
    getAuth: () => ({}),
    logger: createLogger(),
    plugins: { adapters: {}, providers: {} },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  return betterAuth({
    ...options,
    database: memoryAdapter({ [options.user.modelName]: [] }),
    advanced: { ...options.advanced, disableOriginCheck: false },
  });
}

function signIn({ auth, requestOrigin, callbackURL }) {
  return auth.handler(
    new Request(`${requestOrigin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: requestOrigin },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password-1234',
        callbackURL,
      }),
    })
  );
}

test('accepts a callbackURL on the request origin when the base URL is not pinned', async () => {
  const auth = createAuth();
  const response = await signIn({
    auth,
    requestOrigin: 'https://app.example.com',
    callbackURL: 'https://app.example.com/home',
  });
  // Past the origin check - fails on the unknown user instead.
  expect(response.status).toBe(401);
});

test('accepts a callbackURL on whichever host served the request when the base URL is not pinned', async () => {
  const auth = createAuth();
  const response = await signIn({
    auth,
    requestOrigin: 'https://preview.example.com',
    callbackURL: 'https://preview.example.com/home',
  });
  expect(response.status).toBe(401);
});

test('rejects a callbackURL on another origin when the base URL is not pinned', async () => {
  const auth = createAuth();
  const response = await signIn({
    auth,
    requestOrigin: 'https://app.example.com',
    callbackURL: 'https://other.example.org/home',
  });
  expect(response.status).toBe(403);
});
