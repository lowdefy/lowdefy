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
import { Hono } from 'hono';

import stampCaller from './stampCaller.js';

function createApp({ user }) {
  const app = new Hono();
  app.use('/api/*', async (c, next) => {
    c.set('lowdefyContext', { user });
    return next();
  });
  app.use('/api/request/*', stampCaller());
  app.post('/api/request/page/ok', (c) => c.json({ ok: true }));
  app.post('/api/request/page/throws', () => {
    throw new Error('Request failed.');
  });
  app.onError((error, c) => c.json({ message: error.message }, 500));
  return app;
}

test.each([
  ['/api/request/page/ok', 200],
  ['/api/request/page/throws', 500],
])('stampCaller sets x-lowdefy-caller on %s (%i)', async (path, status) => {
  const app = createApp({ user: { id: 'user_1', organization_id: 'org_1' } });
  const res = await app.request(path, { method: 'POST' });
  expect(res.status).toBe(status);
  expect(res.headers.get('x-lowdefy-caller')).toBe(
    createHash('sha256').update('user_1:org_1').digest('hex').slice(0, 16)
  );
});

test('stampCaller sends an empty x-lowdefy-caller for an anonymous caller', async () => {
  const app = createApp({ user: null });
  const res = await app.request('/api/request/page/ok', { method: 'POST' });
  expect(res.headers.get('x-lowdefy-caller')).toBe('');
});
