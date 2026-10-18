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

import { createHash } from 'node:crypto';
import { jest } from '@jest/globals';

import parseQuery from './parseQuery.js';
import signInWithSheet from './signInWithSheet.js';

jest.mock('expo-crypto', () => {
  const nodeCrypto = jest.requireActual('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: jest.fn(async (algorithm, data) =>
      nodeCrypto.createHash('sha256').update(data).digest()
    ),
    getRandomBytes: jest.fn((count) => new Uint8Array(nodeCrypto.randomBytes(count))),
    randomUUID: jest.fn(() => 'state-1'),
  };
});

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));

const WebBrowser = jest.requireMock('expo-web-browser');

const apiBase = 'https://field.example.com';
const shell = { id: 'field', scheme: 'com.example.field' };

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function createAuthApi() {
  return { exchangeToken: jest.fn(async () => ({ status: 'signedIn' })) };
}

test('the sheet opens /auth/mobile ephemeral, with the shell, a state and an S256 challenge', async () => {
  WebBrowser.openAuthSessionAsync.mockResolvedValue({
    type: 'success',
    url: 'com.example.field://auth?token=ott-1&state=state-1',
  });
  const authApi = createAuthApi();
  expect(await signInWithSheet({ apiBase, authApi, shell })).toEqual({ status: 'signedIn' });
  const [url, redirectUrl, options] = WebBrowser.openAuthSessionAsync.mock.calls[0];
  expect(url.startsWith(`${apiBase}/auth/mobile?`)).toBe(true);
  const query = parseQuery(url);
  expect(query.shell).toBe('field');
  expect(query.state).toBe('state-1');
  expect(query.code_challenge_method).toBe('S256');
  expect(query.code_challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(redirectUrl).toBe('com.example.field://auth');
  expect(options).toEqual({ preferEphemeralSession: true });

  // The verifier goes only to the exchange, and it is the one the challenge was made from.
  const { token, codeVerifier } = authApi.exchangeToken.mock.calls[0][0];
  expect(token).toBe('ott-1');
  expect(codeVerifier).toHaveLength(86);
  expect(base64Url(createHash('sha256').update(codeVerifier).digest())).toBe(query.code_challenge);
  expect(url).not.toContain(codeVerifier);
});

test('each sign-in makes a new verifier, which stays in the call that made it', async () => {
  WebBrowser.openAuthSessionAsync.mockResolvedValue({
    type: 'success',
    url: 'com.example.field://auth?token=ott-1&state=state-1',
  });
  const authApi = createAuthApi();
  await signInWithSheet({ apiBase, authApi, shell });
  await signInWithSheet({ apiBase, authApi, shell });
  const [first, second] = authApi.exchangeToken.mock.calls.map(([params]) => params.codeVerifier);
  expect(first).not.toBe(second);
  // No call out of the sign-in but the exchange carries the verifier: not the sheet, not storage.
  const Crypto = jest.requireMock('expo-crypto');
  const otherCalls = JSON.stringify([
    WebBrowser.openAuthSessionAsync.mock.calls,
    Crypto.randomUUID.mock.calls,
    Crypto.getRandomBytes.mock.calls,
  ]);
  expect(otherCalls).not.toContain(first);
  expect(otherCalls).not.toContain(second);
});

test('a redirect with another state is refused and the token is not exchanged', async () => {
  WebBrowser.openAuthSessionAsync.mockResolvedValue({
    type: 'success',
    url: 'com.example.field://auth?token=ott-1&state=someone-else',
  });
  const authApi = createAuthApi();
  expect(await signInWithSheet({ apiBase, authApi, shell })).toEqual({ status: 'failed' });
  expect(authApi.exchangeToken).not.toHaveBeenCalled();
});

test('a redirect without a token fails', async () => {
  WebBrowser.openAuthSessionAsync.mockResolvedValue({
    type: 'success',
    url: 'com.example.field://auth?state=state-1',
  });
  const authApi = createAuthApi();
  expect(await signInWithSheet({ apiBase, authApi, shell })).toEqual({ status: 'failed' });
  expect(authApi.exchangeToken).not.toHaveBeenCalled();
});

test('closing the sheet cancels the sign-in', async () => {
  WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
  const authApi = createAuthApi();
  expect(await signInWithSheet({ apiBase, authApi, shell })).toEqual({ status: 'cancelled' });
  expect(authApi.exchangeToken).not.toHaveBeenCalled();
});

test('parseQuery reads a custom-scheme URL query, decoding each value', () => {
  expect(parseQuery('com.example.field://auth?token=a%2Bb&state=x+y&empty#frag')).toEqual({
    token: 'a+b',
    state: 'x y',
    empty: '',
  });
  expect(parseQuery('com.example.field://auth')).toEqual({});
});
