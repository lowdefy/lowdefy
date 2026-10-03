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
// BetterAuth loads @opentelemetry/api lazily on its first request. Through
// jest's ESM loader that costs most of a second (seconds with every worker
// busy) inside the first test; importing it here loads it before any test runs.
import '@opentelemetry/api';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';

import getBetterAuthConfig from './getBetterAuthConfig.js';
import handleAuthRequest, { CLIENT_ADDRESS_HEADER } from './handleAuthRequest.js';

// Contract test against the installed better-auth release: a real BetterAuth
// instance built from the assembled options, driven through handleAuthRequest,
// must key its sign-in rate limit (3 attempts per 10 s per address) on the
// address the server resolved - never on X-Forwarded-For or a client-sent copy
// of the internal header.

const ORIGIN = 'https://app.example.com';
const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

beforeAll(() => {
  process.env.BETTER_AUTH_URL = ORIGIN;
});

afterAll(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

// BetterAuth runs a full scrypt hash on every sign-in for an unknown user, to
// keep its timing the same as a wrong password. That hash is CPU-bound and, with
// every jest worker busy, stretches each sign-in to most of a second - enough
// to push these tests past the default timeout. The contract here does not
// depend on how passwords hash, so the instance hashes them cheaply instead.
const cheapPasswordHasher = {
  hash: async (password) => password,
  verify: async ({ hash, password }) => hash === password,
};

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
      rateLimit: { enabled: true, window: 60, max: 100 },
      authPages: { signIn: '/login', verifyEmail: '/verify-email' },
      api: { roles: {} },
      pages: { roles: {} },
      websockets: { roles: {} },
      organizations: { policy: 'pinned', org: 'default', signup: 'invite-only' },
      roles: [],
    },
    getAuth: () => ({}),
    logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    plugins: { adapters: {}, providers: {} },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  return betterAuth({
    ...options,
    database: memoryAdapter({ [options.user.modelName]: [] }),
    emailAndPassword: { ...options.emailAndPassword, password: cheapPasswordHasher },
  });
}

function signIn({ auth, clientAddress, headers = {} }) {
  return handleAuthRequest({
    auth,
    clientAddress,
    request: new Request(`${ORIGIN}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
      body: JSON.stringify({ email: 'user@example.com', password: 'password-1234' }),
    }),
  });
}

async function signInStatuses({ auth, attempts }) {
  const statuses = [];
  for (const attempt of attempts) {
    const response = await signIn({ auth, ...attempt });
    statuses.push(response.status);
  }
  return statuses;
}

test('limits sign-in attempts from one resolved address whatever X-Forwarded-For says', async () => {
  const auth = createAuth();
  const statuses = await signInStatuses({
    auth,
    attempts: [1, 2, 3, 4].map((index) => ({
      clientAddress: '198.51.100.1',
      headers: { 'x-forwarded-for': `203.0.113.${index}` },
    })),
  });
  expect(statuses).toEqual([401, 401, 401, 429]);
});

test('replaces a client-sent copy of the client address header', async () => {
  const auth = createAuth();
  const statuses = await signInStatuses({
    auth,
    attempts: [1, 2, 3, 4].map((index) => ({
      clientAddress: '198.51.100.2',
      headers: { [CLIENT_ADDRESS_HEADER]: `203.0.113.${index + 10}` },
    })),
  });
  expect(statuses).toEqual([401, 401, 401, 429]);
});

test('counts two resolved addresses apart', async () => {
  const auth = createAuth();
  const statuses = await signInStatuses({
    auth,
    attempts: [
      '198.51.100.3',
      '198.51.100.3',
      '198.51.100.3',
      '198.51.100.4',
      '198.51.100.4',
      '198.51.100.4',
    ].map((clientAddress) => ({ clientAddress })),
  });
  expect(statuses).toEqual([401, 401, 401, 401, 401, 401]);
});
