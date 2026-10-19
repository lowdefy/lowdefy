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

import stampBuildId from './stampBuildId.js';

function createApp() {
  const app = new Hono();
  app.use('/api/auth/*', stampBuildId({ buildId: 'build-2' }));
  app.get('/api/auth/ok', (c) => c.json({ ok: true }));
  app.get('/api/auth/raw', () => new Response('not found', { status: 404 }));
  app.get('/api/auth/throws', () => {
    throw new Error('Auth failed.');
  });
  app.onError((error, c) => c.json({ message: error.message }, 500));
  return app;
}

test.each([
  ['/api/auth/ok', 200],
  ['/api/auth/raw', 404],
  ['/api/auth/throws', 500],
])('stampBuildId sets x-lowdefy-build on %s (%i)', async (path, status) => {
  const res = await createApp().request(path);
  expect(res.status).toBe(status);
  expect(res.headers.get('x-lowdefy-build')).toBe('build-2');
});
