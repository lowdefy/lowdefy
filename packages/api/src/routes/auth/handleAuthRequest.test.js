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

const echoAuth = {
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
function createStandIn({ method, body, headers }) {
  const request = new Request('https://app.example.com/api/auth/sign-in/email', {
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
