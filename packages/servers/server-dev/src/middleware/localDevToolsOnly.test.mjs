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

import localDevToolsOnly from './localDevToolsOnly.js';
import { expect, test } from 'vitest';

function request({ headers, method = 'POST' }) {
  const app = new Hono();
  app.use('/lowdefy-docs/*', localDevToolsOnly());
  app.all('/lowdefy-docs/journey', (c) => c.json({ allowed: true }));
  return app.request('/lowdefy-docs/journey', { headers, method });
}

test.each([
  ['an agent or curl calls with no origin', { host: 'localhost:4102' }],
  [
    'the dev app page calls its own server',
    { host: 'localhost:4102', origin: 'http://localhost:4102', 'sec-fetch-site': 'same-origin' },
  ],
])('localDevToolsOnly allows the request when %s', async (_, headers) => {
  const res = await request({ headers });
  expect(res.status).toEqual(200);
});

test.each([
  [
    'a page on another site posts text/plain to localhost',
    {
      host: 'localhost:4102',
      origin: 'https://attacker.example',
      'sec-fetch-site': 'cross-site',
      'content-type': 'text/plain',
    },
  ],
  [
    'a page on another site loads a GET with no origin',
    { host: 'localhost:4102', 'sec-fetch-site': 'cross-site' },
  ],
  [
    'a page on another localhost port calls in',
    { host: 'localhost:4102', origin: 'http://localhost:3000', 'sec-fetch-site': 'same-site' },
  ],
  ['the origin is opaque', { host: 'localhost:4102', origin: 'null' }],
])('localDevToolsOnly refuses the request when %s', async (_, headers) => {
  const res = await request({ headers });
  expect(res.status).toEqual(403);
});

test.each([
  ['with no origin', { host: '192.168.1.20:4102', 'x-lowdefy-dev-remote': '1' }],
  [
    'from its own page',
    {
      host: '192.168.1.20:4102',
      origin: 'http://192.168.1.20:4102',
      'sec-fetch-site': 'same-origin',
      'x-lowdefy-dev-remote': '1',
    },
  ],
])(
  'localDevToolsOnly refuses a paired phone (the proxy marked it remote) %s',
  async (_, headers) => {
    const res = await request({ headers });
    expect(res.status).toEqual(403);
    expect((await res.json()).error).toEqual(
      'The dev tools answer only on the computer running lowdefy dev.'
    );
  }
);

test('localDevToolsOnly lets a paired phone through only where allowPaired says so', async () => {
  const app = new Hono();
  app.use('/api/dev-recording', localDevToolsOnly({ allowPaired: (c) => c.req.method === 'POST' }));
  app.all('/api/dev-recording', (c) => c.json({ allowed: true }));
  const headers = { host: '192.168.1.20:4102', 'x-lowdefy-dev-remote': '1' };
  const posted = await app.request('/api/dev-recording', { headers, method: 'POST' });
  const read = await app.request('/api/dev-recording', { headers, method: 'GET' });
  expect(posted.status).toEqual(200);
  expect(read.status).toEqual(403);
});
