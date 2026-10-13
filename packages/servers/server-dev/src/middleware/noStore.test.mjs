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

import noStore from './noStore.js';

function createApp() {
  const app = new Hono();
  app.use('/api/page/*', noStore());
  app.get('/api/page/:pageId', (c) => c.json({ pageId: c.req.param('pageId') }));
  app.use('/api/fail/*', noStore());
  app.get('/api/fail/:id', () => {
    throw new Error('Request failed.');
  });
  app.get('/icon.svg', (c) => c.body('<svg></svg>'));
  app.onError((error, c) => c.json({ error: error.message }, 500));
  return app;
}

test('noStore sets Cache-Control private, no-store on the routes it is registered for', async () => {
  const res = await createApp().request('/api/page/home');
  expect(res.headers.get('cache-control')).toEqual('private, no-store');
});

test('noStore sets Cache-Control on an error response', async () => {
  const res = await createApp().request('/api/fail/1');
  expect(res.status).toEqual(500);
  expect(res.headers.get('cache-control')).toEqual('private, no-store');
});

test('noStore leaves other routes alone', async () => {
  const res = await createApp().request('/icon.svg');
  expect(res.headers.get('cache-control')).toBeNull();
});
