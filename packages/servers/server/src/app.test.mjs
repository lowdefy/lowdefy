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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { vi, afterAll, beforeAll, expect, test } from 'vitest';

// The real app wiring with every handler stubbed, to check which routes carry which
// Cache-Control header.
function handler(c) {
  return c.json({ ok: true });
}
function throwingHandler() {
  throw new Error('Request failed.');
}
function passThrough() {
  return (c, next) => next();
}

vi.doMock('./routes/agent.js', () => ({ default: handler }));
vi.doMock('./routes/apiPage.js', () => ({ default: handler }));
vi.doMock('./routes/auth.js', () => ({ default: () => handler }));
vi.doMock('./routes/clientError.js', () => ({ default: handler }));
vi.doMock('./routes/cron.js', () => ({ default: handler }));
vi.doMock('./routes/cronForward.js', () => ({ default: handler }));
vi.doMock('./routes/detached.js', () => ({ default: handler }));
vi.doMock('./routes/endpoints.js', () => ({ default: throwingHandler }));
vi.doMock('./routes/mcp.js', () => ({ default: handler }));
vi.doMock('./routes/mobileRoot.js', () => ({ default: handler }));
vi.doMock('./routes/mountOauthDiscovery.js', () => ({ default: () => {} }));
vi.doMock('./routes/request.js', () => ({ default: handler }));
vi.doMock('./routes/usage.js', () => ({ default: handler }));
vi.doMock('./routes/user.js', () => ({ default: handler }));
vi.doMock('./routes/websocket.js', () => ({ default: handler }));
vi.doMock('./routes/wellKnownFallback.js', () => ({ default: handler }));
vi.doMock('./html/renderPage.js', () => ({
  default: (c) => c.html('<html></html>'),
}));
vi.doMock('./middleware/apiContext.js', () => ({ default: passThrough }));
vi.doMock('./middleware/sentry.js', () => ({ default: passThrough }));
vi.doMock('./middleware/errorHandler.js', () => ({
  default: () => (error, c) => c.json({ error: error.message }, 500),
}));
vi.doMock('../lib/build/appMeta.js', () => ({ default: { buildId: 'build-1' } }));
vi.doMock('../lib/build/auth.js', () => ({ default: { configured: false } }));
vi.doMock('../lib/build/theme.js', () => ({ default: {} }));
vi.doMock('../lib/build/config.js', () => ({ default: {} }));
vi.doMock('../lib/build/mobileConfig.js', () => ({ default: {} }));
vi.doMock('../lib/server/auth/getAuth.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/auth/getStrategies.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/log/createLogger.js', () => ({
  default: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const { default: createApp } = await import('./app.js');

const originalCwd = process.cwd();
let serverDirectory;

beforeAll(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-app-'));
  fs.mkdirSync(path.join(serverDirectory, 'dist/client/assets'), { recursive: true });
  fs.writeFileSync(path.join(serverDirectory, 'dist/client/assets/main-abc.js'), 'export {};');
  fs.writeFileSync(path.join(serverDirectory, 'dist/client/icon.svg'), '<svg></svg>');
  process.chdir(serverDirectory);
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

test.each([
  ['GET', '/home'],
  ['GET', '/'],
  ['GET', '/404'],
  ['GET', '/api/page/home'],
  ['GET', '/api/mobile/root'],
  ['GET', '/api/user'],
  ['POST', '/api/request/home/get_data'],
  ['POST', '/api/endpoints/my_endpoint'],
])('%s %s responds with Cache-Control private, no-store', async (method, url) => {
  const res = await createApp().request(url, { method });
  expect(res.headers.get('cache-control')).toEqual('private, no-store');
});

test('an endpoint that throws still responds with Cache-Control private, no-store', async () => {
  const res = await createApp().request('/api/endpoints/my_endpoint', { method: 'POST' });
  expect(res.status).toEqual(500);
  expect(res.headers.get('cache-control')).toEqual('private, no-store');
});

test('hashed assets keep their long-lived immutable caching', async () => {
  const res = await createApp().request('/assets/main-abc.js');
  expect(res.status).toEqual(200);
  expect(res.headers.get('cache-control')).toEqual('public, max-age=31536000, immutable');
});

test.each([
  ['GET', '/icon.svg'],
  ['GET', '/api/cron/nightly'],
  ['POST', '/api/client-error'],
  ['GET', '/api/lowdefy-health'],
])('%s %s gets no no-store header', async (method, url) => {
  const res = await createApp().request(url, { method });
  expect(res.headers.get('cache-control')).not.toEqual('private, no-store');
});
