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

import { jest } from '@jest/globals';

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

jest.unstable_mockModule('./routes/agent.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/apiPage.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/auth.js', () => ({ default: () => handler }));
jest.unstable_mockModule('./routes/clientError.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/cron.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/cronForward.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/detached.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/endpoints.js', () => ({ default: throwingHandler }));
jest.unstable_mockModule('./routes/mcp.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/mountOauthDiscovery.js', () => ({ default: () => {} }));
jest.unstable_mockModule('./routes/request.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/usage.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/user.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/websocket.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/wellKnownFallback.js', () => ({ default: handler }));
jest.unstable_mockModule('./html/renderPage.js', () => ({
  default: (c) => c.html('<html></html>'),
}));
jest.unstable_mockModule('./middleware/apiContext.js', () => ({ default: passThrough }));
jest.unstable_mockModule('./middleware/sentry.js', () => ({ default: passThrough }));
jest.unstable_mockModule('./middleware/errorHandler.js', () => ({
  default: () => (error, c) => c.json({ error: error.message }, 500),
}));
jest.unstable_mockModule('../lib/build/appMeta.js', () => ({ default: { buildId: 'build-1' } }));
jest.unstable_mockModule('../lib/build/auth.js', () => ({ default: { configured: false } }));
jest.unstable_mockModule('../lib/build/config.js', () => ({ default: {} }));
jest.unstable_mockModule('../lib/server/auth/getAuth.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../lib/server/auth/getStrategies.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../lib/server/log/createLogger.js', () => ({
  default: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
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
