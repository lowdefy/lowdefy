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

import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { admin, magicLink } from 'better-auth/plugins';

import createSignInRefusedRedirectHook from './createSignInRefusedRedirectHook.js';
import dispatchRequestHooks from './dispatchRequestHooks.js';

const BASE_URL = 'https://app.example.com';

function createCtx({ returned, query = {} } = {}) {
  return {
    context: { baseURL: `${BASE_URL}/api/auth`, returned },
    query,
  };
}

async function redirectLocation(ctx) {
  const response = await createSignInRefusedRedirectHook()(ctx);
  expect(response.status).toBe(302);
  return new URL(response.headers.get('location'));
}

test('createSignInRefusedRedirectHook redirects a ban to the error callback URL with the code', async () => {
  const url = await redirectLocation(
    createCtx({
      returned: new APIError('FORBIDDEN', {
        message: 'You have been banned.',
        code: 'BANNED_USER',
      }),
      query: { callbackURL: '/home', errorCallbackURL: '%2Fuser-account%2Flogin' },
    })
  );
  expect(url.origin + url.pathname).toBe(`${BASE_URL}/user-account/login`);
  expect(url.searchParams.get('error')).toBe('BANNED_USER');
  expect(url.searchParams.get('error_description')).toBe('You have been banned.');
});

test('createSignInRefusedRedirectHook redirects a missing membership', async () => {
  const url = await redirectLocation(
    createCtx({
      returned: new APIError('FORBIDDEN', {
        message: 'You have not been granted access to this application.',
        code: 'MEMBERSHIP_REQUIRED',
      }),
      query: { callbackURL: '/', errorCallbackURL: '/login' },
    })
  );
  expect(url.searchParams.get('error')).toBe('MEMBERSHIP_REQUIRED');
});

test('createSignInRefusedRedirectHook falls back to callbackURL, as the endpoint does', async () => {
  const url = await redirectLocation(
    createCtx({
      returned: new APIError('FORBIDDEN', { message: 'Banned.', code: 'BANNED_USER' }),
      query: { callbackURL: '/home' },
    })
  );
  expect(url.pathname).toBe('/home');
});

test('createSignInRefusedRedirectHook leaves other errors alone, origin check failures among them', async () => {
  const response = await createSignInRefusedRedirectHook()(
    createCtx({
      returned: new APIError('FORBIDDEN', {
        message: 'Invalid errorCallbackURL',
        code: 'INVALID_ERROR_CALLBACK_URL',
      }),
      query: { errorCallbackURL: 'https://evil.com' },
    })
  );
  expect(response).toBeUndefined();
});

test('createSignInRefusedRedirectHook leaves a successful sign-in alone', async () => {
  const response = await createSignInRefusedRedirectHook()(
    createCtx({ returned: { token: 'token', user: { id: 'user_1' } }, query: { callbackURL: '/' } })
  );
  expect(response).toBeUndefined();
});

// Against BetterAuth itself. The first test pins the upstream gap: without
// the hook, /magic-link/verify answers a session.create.before refusal with
// JSON. If upstream starts redirecting it, that test fails and this hook can go.
async function followMagicLinkAsBannedUser({ hooks }) {
  let sentUrl;
  const auth = betterAuth({
    baseURL: BASE_URL,
    secret: 'a-test-secret-that-is-at-least-32-characters-long',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    plugins: [
      magicLink({
        sendMagicLink: async ({ url }) => {
          sentUrl = url;
        },
      }),
      admin(),
    ],
    hooks,
  });
  const { user } = await auth.api.createUser({
    body: { email: 'banned@example.com', name: 'Banned', password: 'a-long-password-123' },
  });
  const authContext = await auth.$context;
  await authContext.internalAdapter.updateUser(user.id, { banned: true });
  await auth.api.signInMagicLink({
    body: { email: 'banned@example.com', callbackURL: '/home', errorCallbackURL: '/login' },
    headers: new Headers(),
  });
  return auth.handler(new Request(sentUrl));
}

test('BetterAuth answers a banned user following a magic link with JSON', async () => {
  const response = await followMagicLinkAsBannedUser({});
  expect(response.status).toBe(403);
  expect((await response.json()).code).toBe('BANNED_USER');
});

test('a banned user following a magic link is redirected to the error page by the hook', async () => {
  const response = await followMagicLinkAsBannedUser({
    hooks: {
      after: createAuthMiddleware(async (ctx) =>
        dispatchRequestHooks({
          ctx,
          registrations: [
            {
              id: 'magicLinkSignInRefused',
              matches: (path) => path === '/magic-link/verify',
              handler: createSignInRefusedRedirectHook(),
            },
          ],
        })
      ),
    },
  });
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location'));
  expect(location.origin + location.pathname).toBe(`${BASE_URL}/login`);
  expect(location.searchParams.get('error')).toBe('BANNED_USER');
});
