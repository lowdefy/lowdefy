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

import websocketHandler from './websocket.js';

// The dev upgrade listener (src/websocket/devWebSocket.js) runs this route
// through the app and opens the websocket only on a 200 that carries the
// context - so a refusal here is a refused upgrade.
async function upgrade({ headers }) {
  const app = new Hono().basePath('/app');
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { rid: 'request' });
    await next();
  });
  app.get('/api/websocket', websocketHandler);
  const websocketUpgrade = { context: null };
  const res = await app.request('/app/api/websocket', { headers }, { websocketUpgrade });
  return { status: res.status, context: websocketUpgrade.context };
}

test.each([
  ['the dev app page opens it', { host: 'localhost:4100', origin: 'http://localhost:4100' }],
  ['a client sends no origin', { host: 'localhost:4100' }],
  ['the page is on 127.0.0.1', { host: '127.0.0.1:4100', origin: 'http://127.0.0.1:4100' }],
  ['the page is on [::1]', { host: '[::1]:4100', origin: 'http://[::1]:4100' }],
  [
    'the page is on a .localhost name',
    { host: 'app.localhost:4100', origin: 'http://app.localhost:4100' },
  ],
])('the dev websocket route opens the upgrade when %s', async (_, headers) => {
  expect(await upgrade({ headers })).toEqual({ status: 200, context: { rid: 'request' } });
});

test.each([
  ['the origin is another site', { host: 'localhost:4100', origin: 'https://other.test' }],
  ['the origin is another local port', { host: 'localhost:4100', origin: 'http://localhost:5173' }],
  [
    'the browser marks it cross-site',
    { host: 'localhost:4100', origin: 'http://localhost:4100', 'sec-fetch-site': 'cross-site' },
  ],
  [
    'a rebound domain names itself in both host and origin',
    { host: 'rebound.test:4100', origin: 'http://rebound.test:4100' },
  ],
])('the dev websocket route refuses the upgrade when %s', async (_, headers) => {
  expect(await upgrade({ headers })).toEqual({ status: 403, context: null });
});
