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

import handleAuthRequest, { CLIENT_ADDRESS_HEADER } from './handleAuthRequest.js';
import { expect, test } from 'vitest';

const echoAuth = {
  options: { basePath: '/api/auth', baseURL: 'https://app.example.com' },
  handler: async (request) => ({
    url: request.url,
    method: request.method,
    clientAddress: request.headers.get(CLIENT_ADDRESS_HEADER),
    cookie: request.headers.get('cookie'),
    body: await request.text(),
  }),
};

// A stand-in with a Request's fields but not a Request, as @hono/node-server's
// lightweight request is to a Request constructor from another copy of it.
function createStandIn({
  method,
  body,
  headers,
  url = 'https://app.example.com/api/auth/sign-in/email',
}) {
  const request = new Request(url, {
    method,
    headers,
    body,
  });
  return {
    url: request.url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  };
}

test('handleAuthRequest passes the resolved client address in place of a client-sent one', async () => {
  const result = await handleAuthRequest({
    auth: echoAuth,
    clientAddress: '198.51.100.4',
    request: createStandIn({
      method: 'POST',
      headers: { [CLIENT_ADDRESS_HEADER]: '203.0.113.9', cookie: 'session=abc' },
      body: '{"email":"user@example.com"}',
    }),
  });
  expect(result).toEqual({
    url: 'https://app.example.com/api/auth/sign-in/email',
    method: 'POST',
    clientAddress: '198.51.100.4',
    cookie: 'session=abc',
    body: '{"email":"user@example.com"}',
  });
});

test('handleAuthRequest drops a client-sent address when the address is unknown', async () => {
  const result = await handleAuthRequest({
    auth: echoAuth,
    clientAddress: null,
    request: createStandIn({ method: 'GET', headers: { [CLIENT_ADDRESS_HEADER]: '203.0.113.9' } }),
  });
  expect(result.clientAddress).toBe(null);
  expect(result.body).toBe('');
});

const VERIFY_URL = 'https://app.example.com/api/auth/magic-link/verify';
const VERIFY_FORM =
  'token=tok123&callbackURL=%2Fdashboard&newUserCallbackURL=%2Fwelcome&errorCallbackURL=%2Fauth%2Ferror';

function createVerifyPost({ headers = {}, body = VERIFY_FORM } = {}) {
  return createStandIn({
    method: 'POST',
    url: VERIFY_URL,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      host: 'app.example.com',
      ...headers,
    },
    body,
  });
}

function createCountingAuth() {
  const calls = [];
  return {
    calls,
    options: echoAuth.options,
    handler: async (request) => {
      calls.push(request);
      return echoAuth.handler(request);
    },
  };
}

test('handleAuthRequest turns a same-origin magic-link post into the GET verify request', async () => {
  const auth = createCountingAuth();
  const result = await handleAuthRequest({
    auth,
    clientAddress: '198.51.100.4',
    request: createVerifyPost({
      headers: { origin: 'https://app.example.com', 'sec-fetch-site': 'same-origin' },
    }),
  });
  expect(auth.calls).toHaveLength(1);
  expect(auth.calls[0]).toBeInstanceOf(Request);
  expect(auth.calls[0].headers.get('content-type')).toBe(null);
  expect(result).toEqual({
    url: `${VERIFY_URL}?token=tok123&callbackURL=%2Fdashboard&newUserCallbackURL=%2Fwelcome&errorCallbackURL=%2Fauth%2Ferror`,
    method: 'GET',
    clientAddress: '198.51.100.4',
    cookie: null,
    body: '',
  });
});

test('handleAuthRequest carries only the verify fields of a magic-link post', async () => {
  const result = await handleAuthRequest({
    auth: echoAuth,
    clientAddress: null,
    request: createVerifyPost({
      headers: { origin: 'https://app.example.com' },
      body: 'token=tok123&extra=x',
    }),
  });
  expect(result.url).toBe(`${VERIFY_URL}?token=tok123`);
});

test('handleAuthRequest accepts a magic-link post from the pinned base URL behind a proxy', async () => {
  const result = await handleAuthRequest({
    auth: echoAuth,
    clientAddress: null,
    request: createVerifyPost({
      headers: { origin: 'https://app.example.com', host: 'internal:3000' },
    }),
  });
  expect(result.method).toBe('GET');
});

test('handleAuthRequest accepts a magic-link post from a configured trusted origin', async () => {
  const auth = {
    ...echoAuth,
    options: { ...echoAuth.options, trustedOrigins: ['https://other.example.com'] },
  };
  const result = await handleAuthRequest({
    auth,
    clientAddress: null,
    request: createVerifyPost({
      headers: { origin: 'https://other.example.com', host: 'internal:3000' },
    }),
  });
  expect(result.method).toBe('GET');
});

test.each([
  ['a foreign Origin', { origin: 'https://evil.example.com' }],
  ['no Origin', {}],
  ['a null Origin', { origin: 'null' }],
  ['a cross-site fetch', { origin: 'https://app.example.com', 'sec-fetch-site': 'cross-site' }],
])('handleAuthRequest refuses a magic-link post with %s and spends no token', async (_, headers) => {
  const auth = createCountingAuth();
  const response = await handleAuthRequest({
    auth,
    clientAddress: null,
    request: createVerifyPost({ headers }),
  });
  expect(response.status).toBe(403);
  expect(auth.calls).toHaveLength(0);
});

test('handleAuthRequest refuses an oversized magic-link post', async () => {
  const auth = createCountingAuth();
  const response = await handleAuthRequest({
    auth,
    clientAddress: null,
    request: createVerifyPost({
      headers: { origin: 'https://app.example.com' },
      body: `token=${'a'.repeat(9000)}`,
    }),
  });
  expect(response.status).toBe(413);
  expect(auth.calls).toHaveLength(0);
});

test('handleAuthRequest passes a GET verify request through unchanged', async () => {
  const result = await handleAuthRequest({
    auth: echoAuth,
    clientAddress: null,
    request: createStandIn({ method: 'GET', url: `${VERIFY_URL}?token=tok123` }),
  });
  expect(result).toMatchObject({ url: `${VERIFY_URL}?token=tok123`, method: 'GET' });
});

test('handleAuthRequest matches the magic-link post under a basePath', async () => {
  const auth = { ...echoAuth, options: { ...echoAuth.options, basePath: '/base/api/auth' } };
  const result = await handleAuthRequest({
    auth,
    clientAddress: null,
    request: createStandIn({
      method: 'POST',
      url: 'https://app.example.com/base/api/auth/magic-link/verify',
      headers: { origin: 'https://app.example.com', host: 'app.example.com' },
      body: 'token=tok123',
    }),
  });
  expect(result).toMatchObject({
    url: 'https://app.example.com/base/api/auth/magic-link/verify?token=tok123',
    method: 'GET',
  });
});
