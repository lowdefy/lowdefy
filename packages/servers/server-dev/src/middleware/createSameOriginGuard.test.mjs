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

import createSameOriginGuard from './createSameOriginGuard.js';

function createApp({ allowNoOrigin } = {}) {
  const guardSameOrigin = createSameOriginGuard({ allowNoOrigin });
  const app = new Hono();
  app.all('/post', (c) => {
    const forbidden = guardSameOrigin(c);
    if (forbidden) {
      return forbidden;
    }
    return c.json({ allowed: true });
  });
  return app;
}

function post({ allowNoOrigin, headers }) {
  return createApp({ allowNoOrigin }).request('/post', { headers, method: 'POST' });
}

test.each([
  ['origin matches the host', { host: 'app.test', origin: 'https://app.test' }],
  [
    'sec-fetch-site says same-origin',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'same-origin' },
  ],
  [
    'sec-fetch-site says none',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'none' },
  ],
  [
    'the origin carries a port matching the host',
    { host: 'app.test:3000', origin: 'http://app.test:3000' },
  ],
])('the guard allows a post when %s', async (_, headers) => {
  const res = await post({ headers });

  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ allowed: true });
});

test.each([
  ['the origin is another site', { host: 'app.test', origin: 'https://evil.test' }],
  ['the origin is a sibling subdomain', { host: 'app.test', origin: 'https://other.app.test' }],
  ['the origin is not a url', { host: 'app.test', origin: 'not a url' }],
  [
    'sec-fetch-site says cross-site',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'cross-site' },
  ],
  [
    'sec-fetch-site says same-site',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'same-site' },
  ],
  ['there is no origin', { host: 'app.test' }],
])('the guard answers 403 when %s', async (_, headers) => {
  const res = await post({ headers });

  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({ error: 'Forbidden' });
});

test('the guard lets a caller that sends no origin through when the route allows it', async () => {
  const res = await post({ allowNoOrigin: true, headers: { host: 'app.test' } });

  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ allowed: true });
});

test('allowNoOrigin does not excuse a browser posting cross-site', async () => {
  const res = await post({
    allowNoOrigin: true,
    headers: { host: 'app.test', origin: 'https://evil.test' },
  });

  expect(res.status).toEqual(403);
});

test('allowNoOrigin does not excuse a cross-site sec-fetch-site with no origin', async () => {
  const res = await post({
    allowNoOrigin: true,
    headers: { host: 'app.test', 'sec-fetch-site': 'cross-site' },
  });

  expect(res.status).toEqual(403);
});
