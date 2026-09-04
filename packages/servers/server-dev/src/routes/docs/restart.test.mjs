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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { Hono } from 'hono';

const originalCwd = process.cwd();
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-restart-route-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
process.chdir(fixtureDir);

const { default: docsRestartHandler } = await import('./restart.js');

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

function createApp() {
  const app = new Hono();
  app.post('/lowdefy-docs/restart', docsRestartHandler);
  return app;
}

test('POST /lowdefy-docs/restart writes the sentinel and answers with the polling note', async () => {
  const res = await createApp().request('/lowdefy-docs/restart', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason: 'stale cache' }),
  });

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    requested: true,
    reason: 'stale cache',
    note:
      'The dev server is restarting. Wait ~2s, then poll GET /lowdefy-docs/build-status before ' +
      'your next call. The restart discards the serverErrors and devNotices collected this ' +
      'session — they live in the server process only.',
  });
  const sentinel = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'build', '.restart'), 'utf8'));
  expect(sentinel.reason).toBe('stale cache');
});

test('POST /lowdefy-docs/restart accepts an empty body', async () => {
  const res = await createApp().request('/lowdefy-docs/restart', { method: 'POST' });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.requested).toBe(true);
  expect(body).not.toHaveProperty('reason');
});
