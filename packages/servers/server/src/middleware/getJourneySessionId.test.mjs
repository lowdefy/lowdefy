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

import getJourneySessionId from './getJourneySessionId.js';

async function read(headers) {
  const app = new Hono();
  app.get('/read', (c) => c.json({ sessionId: getJourneySessionId(c) }));
  const res = await app.request('/read', { headers });
  return res.json();
}

test('getJourneySessionId reads the session id the browser sent', async () => {
  expect(await read({ 'x-lowdefy-session': '8f14e45f-ea8d-4c6b-9f1a-2a4b6c8d0e1f' })).toEqual({
    sessionId: '8f14e45f-ea8d-4c6b-9f1a-2a4b6c8d0e1f',
  });
});

test('getJourneySessionId returns null when the browser sent no session', async () => {
  expect(await read({})).toEqual({ sessionId: null });
});

test.each([
  ['a space', 'sess 1'],
  ['characters that would forge a log field', 'sess=1|event=fake'],
  ['a quote', 'sess"1'],
  ['a path', '../../etc/passwd'],
  ['an empty value', ''],
  ['more than 64 characters', 'a'.repeat(65)],
])('getJourneySessionId drops a session id carrying %s', async (_, sessionId) => {
  expect(await read({ 'x-lowdefy-session': sessionId })).toEqual({ sessionId: null });
});
