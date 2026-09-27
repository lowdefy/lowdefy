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
import { jest } from '@jest/globals';

jest.unstable_mockModule('../build/config.js', () => ({ default: {} }));

const { default: getClientAddress } = await import('./getClientAddress.js');
const { JOURNEY_ACTOR_COOKIE, journeyActorToken } = await import('./auth/journeyActor.js');

async function resolve(headers) {
  const app = new Hono();
  app.get('/', (c) => c.json({ clientAddress: getClientAddress(c) }));
  const env = { incoming: { socket: { remoteAddress: '127.0.0.1' } } };
  const response = await app.request('/', { headers }, env);
  return (await response.json()).clientAddress;
}

test.each([
  [
    'the actor address from its headless journey cookie',
    `${journeyActorToken}.203.0.113.7`,
    '203.0.113.7',
  ],
  ['the peer when the cookie carries another token', `${'0'.repeat(64)}.203.0.113.7`, '127.0.0.1'],
  ['the peer when the cookie carries a shorter token', 'abc.203.0.113.7', '127.0.0.1'],
  ['the peer when the cookie has no address', `${journeyActorToken}`, '127.0.0.1'],
  [
    'the peer when the cookie address is not an IP',
    `${journeyActorToken}.example.com`,
    '127.0.0.1',
  ],
])('the dev getClientAddress resolves %s', async (_, value, expected) => {
  expect(await resolve({ cookie: `session=abc; ${JOURNEY_ACTOR_COOKIE}=${value}` })).toBe(expected);
});

test('the dev getClientAddress ignores X-Forwarded-For without trusted proxies', async () => {
  expect(await resolve({ 'x-forwarded-for': '203.0.113.9' })).toBe('127.0.0.1');
});
