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

import { vi, expect, test } from 'vitest';

import createAuthFetchOptions from './createAuthFetchOptions.js';

// The hook contexts Better Auth's fetch (@better-fetch/fetch 1.3) passes: the
// request's headers are a Headers object, the response a Response.
function requestContext(headers = {}) {
  return { url: 'https://app.example.com/api/auth/x', headers: new Headers(headers) };
}

function createBearerHost(token = null) {
  let held = token;
  return {
    authTransport: 'bearer',
    onCallerChanged: vi.fn(),
    tokenStore: {
      get: vi.fn(() => held),
      set: vi.fn(async (value) => {
        held = value;
      }),
      clear: vi.fn(async () => {
        held = null;
      }),
    },
  };
}

test('createAuthFetchOptions gives a cookie host no fetch options', () => {
  expect(createAuthFetchOptions({ host: {} })).toEqual({});
  expect(createAuthFetchOptions({ host: { authTransport: 'cookie' } })).toEqual({});
});

test('createAuthFetchOptions sends the held token as Better Auth bearer auth, read per call', () => {
  const host = createBearerHost('first.sig');
  const { auth } = createAuthFetchOptions({ host });
  expect(auth.type).toBe('Bearer');
  expect(auth.token()).toBe('first.sig');
  host.tokenStore.set('second.sig');
  expect(auth.token()).toBe('second.sig');
});

test('createAuthFetchOptions keeps the token a response sets in set-auth-token', async () => {
  const host = createBearerHost();
  const { onSuccess } = createAuthFetchOptions({ host });
  await onSuccess({
    data: {},
    request: requestContext(),
    response: new Response('{}', { headers: { 'set-auth-token': 'session.sig' } }),
  });
  expect(host.tokenStore.set.mock.calls).toEqual([['session.sig']]);
});

test('createAuthFetchOptions leaves the token alone when a response sets none', async () => {
  const host = createBearerHost('session.sig');
  const { onSuccess } = createAuthFetchOptions({ host });
  await onSuccess({ data: {}, request: requestContext(), response: new Response('{}') });
  expect(host.tokenStore.set).not.toHaveBeenCalled();
});

test('createAuthFetchOptions ends the session on a 401 to a call that sent a token', async () => {
  const host = createBearerHost('session.sig');
  const { onError } = createAuthFetchOptions({ host });
  await onError({
    request: requestContext({ authorization: 'Bearer session.sig' }),
    response: new Response('{}', {
      status: 401,
      headers: { 'x-lowdefy-caller': '' },
    }),
  });
  expect(host.tokenStore.clear).toHaveBeenCalledTimes(1);
  expect(host.onCallerChanged.mock.calls).toEqual([
    [{ caller: '', session: null, roles: null, memberships: null }],
  ]);
});

test('createAuthFetchOptions clears the token before the host hears the session ended', async () => {
  const host = createBearerHost('session.sig');
  const order = [];
  host.tokenStore.clear = vi.fn(async () => order.push('clear'));
  host.onCallerChanged = vi.fn(() => order.push('onCallerChanged'));
  const { onError } = createAuthFetchOptions({ host });
  await onError({
    request: requestContext({ authorization: 'Bearer session.sig' }),
    response: new Response('{}', { status: 401 }),
  });
  expect(order).toEqual(['clear', 'onCallerChanged']);
});

test('createAuthFetchOptions keeps the session on a 401 to a call that sent no token', async () => {
  // A wrong password on a sign-in made while signed out.
  const host = createBearerHost(null);
  const { onError } = createAuthFetchOptions({ host });
  await onError({ request: requestContext(), response: new Response('{}', { status: 401 }) });
  expect(host.tokenStore.clear).not.toHaveBeenCalled();
  expect(host.onCallerChanged).not.toHaveBeenCalled();
});

test.each([400, 403, 429, 500])(
  'createAuthFetchOptions keeps the session on a %i to a call that sent a token',
  async (status) => {
    const host = createBearerHost('session.sig');
    const { onError } = createAuthFetchOptions({ host });
    await onError({
      request: requestContext({ authorization: 'Bearer session.sig' }),
      response: new Response('{}', { status }),
    });
    expect(host.tokenStore.clear).not.toHaveBeenCalled();
    expect(host.onCallerChanged).not.toHaveBeenCalled();
  }
);
