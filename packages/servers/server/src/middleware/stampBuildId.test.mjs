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
import { HTTPException } from 'hono/http-exception';

import requestTimeout from './requestTimeout.js';
import stampBuildId from './stampBuildId.js';
import { expect, test } from 'vitest';

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

// The request timeout answers 504 while the handler runs on, on the same context, so
// the stamp sets its header on a 504 already sent (LDF-591): a magic-link send that
// stalls past the timeout. A rebuild of that 504 from its read body threw "Response
// body object should not be disturbed or locked".
test('stampBuildId reports no fault when the request times out', async () => {
  const faults = [];
  let lateChain;
  const app = new Hono();
  app.use('/api/*', requestTimeout({ timeoutMs: 20 }));
  app.use('/api/*', (c, next) => {
    lateChain = next();
    return lateChain;
  });
  app.use('/api/auth/*', stampBuildId({ buildId: 'build-2' }));
  app.post('/api/auth/sign-in/magic-link', async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return c.json({ status: true });
  });
  app.onError((error, c) => {
    if (error instanceof HTTPException) return error.getResponse();
    faults.push(error);
    return c.json({ message: error.message }, 500);
  });
  const res = await app.request('/api/auth/sign-in/magic-link', { method: 'POST' });
  expect(res.status).toBe(504);
  // Sending the 504 reads its body, as the Node server does.
  await res.text();
  await lateChain;
  expect(faults).toEqual([]);
});
