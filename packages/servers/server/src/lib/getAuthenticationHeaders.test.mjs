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

import { Hono } from 'hono';
import { expect, test } from 'vitest';

import getAuthenticationHeaders from './getAuthenticationHeaders.js';

const encoded = Buffer.from('view-token.signature', 'utf8').toString('base64url');
const viewProtocols = `lowdefy.view, lowdefy.view.bearer.${encoded}`;

async function resolve({ url, headers }) {
  const app = new Hono().basePath('/app');
  app.all('*', (c) => {
    const resolved = getAuthenticationHeaders(c);
    return c.json({
      authorization: resolved.get('authorization'),
      cookie: resolved.get('cookie'),
      same: resolved === c.req.raw.headers,
    });
  });
  const res = await app.request(url, { headers });
  return res.json();
}

test('a websocket handshake that offers a view token resolves its caller from the bearer', async () => {
  expect(
    await resolve({
      url: '/app/api/websocket',
      headers: { 'sec-websocket-protocol': viewProtocols, cookie: 'a=b' },
    })
  ).toEqual({ authorization: 'Bearer view-token.signature', cookie: 'a=b', same: false });
});

test('a websocket handshake without a view token keeps the request headers', async () => {
  expect(await resolve({ url: '/app/api/websocket', headers: { cookie: 'a=b' } })).toEqual({
    authorization: null,
    cookie: 'a=b',
    same: true,
  });
});

test('a phone shell handshake keeps its own Authorization header', async () => {
  expect(
    await resolve({
      url: '/app/api/websocket',
      headers: { authorization: 'Bearer phone', 'sec-websocket-protocol': viewProtocols },
    })
  ).toEqual({ authorization: 'Bearer phone', cookie: null, same: true });
});

test('a subprotocol header on any other route is not read as a token', async () => {
  expect(
    await resolve({
      url: '/app/api/request/home/get_data',
      headers: { 'sec-websocket-protocol': viewProtocols },
    })
  ).toEqual({ authorization: null, cookie: null, same: true });
});
