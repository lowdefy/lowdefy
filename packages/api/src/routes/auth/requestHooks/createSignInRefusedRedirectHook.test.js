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

import { expect, test } from 'vitest';
import { APIError } from 'better-auth/api';

import createSignInRefusedRedirectHook from './createSignInRefusedRedirectHook.js';

// The hook's behaviour against BetterAuth itself - the endpoint's URL
// resolution, its origin checks and the engine's own refusals - is pinned in
// signInRefusedRedirectContract.test.js.

const BASE_URL = 'https://app.example.com';

function isTrustedOrigin(url) {
  return url.startsWith('/') || url.startsWith(BASE_URL);
}

function createCtx({ returned, query = {}, request = new Request(`${BASE_URL}/api/auth`) } = {}) {
  return {
    context: { baseURL: `${BASE_URL}/api/auth`, isTrustedOrigin, returned },
    query,
    request,
  };
}

const banned = () => new APIError('FORBIDDEN', { message: 'Banned.', code: 'BANNED_USER' });

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

test.each([
  ['FORBIDDEN', 'MEMBERSHIP_REQUIRED'],
  ['BAD_REQUEST', 'AUTH_HOOK_REJECTED'],
  ['SERVICE_UNAVAILABLE', 'ORGANIZATION_SETUP_UNAVAILABLE'],
])(
  'createSignInRefusedRedirectHook redirects any coded refusal, here a %s %s',
  async (status, code) => {
    const url = await redirectLocation(
      createCtx({
        returned: new APIError(status, { message: 'Refused.', code }),
        query: { callbackURL: '/', errorCallbackURL: '/login' },
      })
    );
    expect(url.searchParams.get('error')).toBe(code);
  }
);

test('createSignInRefusedRedirectHook leaves the description off when the refusal has no message', async () => {
  const url = await redirectLocation(
    createCtx({
      returned: new APIError('FORBIDDEN', { code: 'BANNED_USER' }),
      query: { errorCallbackURL: '/login' },
    })
  );
  expect(url.searchParams.has('error_description')).toBe(false);
});

test('createSignInRefusedRedirectHook falls back to callbackURL, as the endpoint does', async () => {
  const url = await redirectLocation(
    createCtx({ returned: banned(), query: { callbackURL: '/home' } })
  );
  expect(url.pathname).toBe('/home');
});

test('createSignInRefusedRedirectHook treats an empty errorCallbackURL as absent, as the endpoint does', async () => {
  const url = await redirectLocation(
    createCtx({ returned: banned(), query: { callbackURL: '/home', errorCallbackURL: '' } })
  );
  expect(url.pathname).toBe('/home');
});

test('createSignInRefusedRedirectHook falls back to / when callbackURL is empty', async () => {
  const url = await redirectLocation(createCtx({ returned: banned(), query: { callbackURL: '' } }));
  expect(url.pathname).toBe('/');
});

test('createSignInRefusedRedirectHook redirects an origin check failure when the error page is trusted', async () => {
  const url = await redirectLocation(
    createCtx({
      returned: new APIError('FORBIDDEN', {
        message: 'Invalid callbackURL',
        code: 'INVALID_CALLBACK_URL',
      }),
      query: { callbackURL: 'https://evil.com', errorCallbackURL: '/login' },
    })
  );
  expect(url.pathname).toBe('/login');
  expect(url.searchParams.get('error')).toBe('INVALID_CALLBACK_URL');
});

test('createSignInRefusedRedirectHook does not redirect to an untrusted error callback URL', async () => {
  const response = await createSignInRefusedRedirectHook()(
    createCtx({
      // Verify reports a failed errorCallbackURL check with this code too.
      returned: new APIError('FORBIDDEN', {
        message: 'Invalid callbackURL',
        code: 'INVALID_CALLBACK_URL',
      }),
      query: { errorCallbackURL: 'https%3A%2F%2Fevil.com%2Flogin' },
    })
  );
  expect(response).toBeUndefined();
});

test('createSignInRefusedRedirectHook does not redirect to an untrusted callbackURL it falls back to', async () => {
  const response = await createSignInRefusedRedirectHook()(
    createCtx({ returned: banned(), query: { callbackURL: 'https://evil.com' } })
  );
  expect(response).toBeUndefined();
});

test('createSignInRefusedRedirectHook leaves a server-side call without a request to throw', async () => {
  const response = await createSignInRefusedRedirectHook()(
    createCtx({ returned: banned(), query: { errorCallbackURL: '/login' }, request: null })
  );
  expect(response).toBeUndefined();
});

test('createSignInRefusedRedirectHook leaves an APIError without a code alone', async () => {
  const response = await createSignInRefusedRedirectHook()(
    createCtx({
      returned: new APIError('BAD_REQUEST', { message: 'Refused.' }),
      query: { errorCallbackURL: '/login' },
    })
  );
  expect(response).toBeUndefined();
});

test("createSignInRefusedRedirectHook leaves the endpoint's own redirects alone", async () => {
  const response = await createSignInRefusedRedirectHook()(
    createCtx({
      returned: new APIError('FOUND', undefined, { location: `${BASE_URL}/home` }),
      query: { callbackURL: '/home', errorCallbackURL: '/login' },
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
