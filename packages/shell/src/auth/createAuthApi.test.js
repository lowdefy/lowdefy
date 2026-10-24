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

import createAuthApi from './createAuthApi.js';
import withoutCookies from './withoutCookies.js';

const apiBase = 'https://field.example.com';

function response({ body = {}, headers = {}, status = 200 }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name] ?? null },
    json: async () => body,
  };
}

function setup(answer) {
  const fetch = jest.fn(async () => response(answer));
  const tokenStore = { set: jest.fn(async () => undefined) };
  return { api: createAuthApi({ apiBase, fetch, tokenStore }), fetch, tokenStore };
}

function sent(fetch) {
  const [url, init] = fetch.mock.calls[0];
  return { path: url.slice(apiBase.length), body: JSON.parse(init.body), headers: init.headers };
}

test('sendCode asks Better Auth for a sign-in code', async () => {
  const { api, fetch } = setup({ body: { success: true } });
  expect(await api.sendCode({ email: 'ana@example.com' })).toEqual({ status: 'sent' });
  expect(sent(fetch)).toEqual({
    path: '/api/auth/email-otp/send-verification-otp',
    body: { email: 'ana@example.com', type: 'sign-in' },
    headers: { 'Content-Type': 'application/json' },
  });
});

test('sendCode tells an app without email codes, and a rate limit, from a sent code', async () => {
  expect(await setup({ status: 404 }).api.sendCode({ email: 'a@b.c' })).toEqual({
    status: 'unavailable',
  });
  expect(await setup({ status: 429 }).api.sendCode({ email: 'a@b.c' })).toEqual({
    status: 'rateLimited',
  });
  await expect(setup({ status: 500 }).api.sendCode({ email: 'a@b.c' })).rejects.toThrow(
    "The app's server answered 500 to the sign-in code request."
  );
});

test('signInWithCode keeps the session token from set-auth-token', async () => {
  const { api, fetch, tokenStore } = setup({ headers: { 'set-auth-token': 'token-1' } });
  expect(await api.signInWithCode({ email: 'ana@example.com', otp: '123456' })).toEqual({
    status: 'signedIn',
  });
  expect(sent(fetch).path).toBe('/api/auth/sign-in/email-otp');
  expect(tokenStore.set).toHaveBeenCalledWith('token-1');
});

test('signInWithCode hands a second factor to the sheet and keeps no token', async () => {
  const { api, tokenStore } = setup({ body: { twoFactorRedirect: true } });
  expect(await api.signInWithCode({ email: 'a@b.c', otp: '123456' })).toEqual({
    status: 'twoFactor',
  });
  expect(tokenStore.set).not.toHaveBeenCalled();
});

test('signInWithCode reads a refused code as invalid', async () => {
  const { api, tokenStore } = setup({ status: 400, body: { code: 'INVALID_OTP' } });
  expect(await api.signInWithCode({ email: 'a@b.c', otp: '000000' })).toEqual({
    status: 'invalid',
  });
  expect(tokenStore.set).not.toHaveBeenCalled();
});

test('a sign-in answered without a session token fails', async () => {
  const { api } = setup({ body: {} });
  await expect(api.signInWithCode({ email: 'a@b.c', otp: '123456' })).rejects.toThrow(
    "The app's server signed you in but sent no session token."
  );
});

test('exchangeToken sends the one-time token with the code verifier', async () => {
  const { api, fetch, tokenStore } = setup({ headers: { 'set-auth-token': 'token-1' } });
  expect(await api.exchangeToken({ token: 'ott-1', codeVerifier: 'verifier' })).toEqual({
    status: 'signedIn',
  });
  expect(sent(fetch)).toMatchObject({
    path: '/api/auth/one-time-token/verify',
    body: { token: 'ott-1', code_verifier: 'verifier' },
  });
  expect(tokenStore.set).toHaveBeenCalledWith('token-1');
});

test('exchangeToken fails when the server refuses the token', async () => {
  const { api, tokenStore } = setup({ status: 400, body: { message: 'Invalid token' } });
  expect(await api.exchangeToken({ token: 'ott-1', codeVerifier: 'wrong' })).toEqual({
    status: 'failed',
  });
  expect(tokenStore.set).not.toHaveBeenCalled();
});

test('signOut ends the session the token names', async () => {
  const { api, fetch } = setup({ body: { success: true } });
  await api.signOut({ token: 'token-1' });
  expect(sent(fetch)).toEqual({
    path: '/api/auth/sign-out',
    body: {},
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-1' },
  });
});

test('every shell call omits cookies', async () => {
  const fetch = jest.fn(async () => response({}));
  await withoutCookies(fetch)('https://field.example.com/api/user', { method: 'GET' });
  expect(fetch).toHaveBeenCalledWith('https://field.example.com/api/user', {
    method: 'GET',
    credentials: 'omit',
  });
});
