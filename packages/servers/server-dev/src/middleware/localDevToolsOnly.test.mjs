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

function request({ headers, method = 'POST' }) {
  const app = new Hono();
  app.use('/lowdefy-docs/*', localDevToolsOnly());
  app.all('/lowdefy-docs/run-endpoint', (c) => c.json({ allowed: true }));
  return app.request('/lowdefy-docs/run-endpoint', { headers, method });
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
