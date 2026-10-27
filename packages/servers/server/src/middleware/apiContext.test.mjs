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
import path from 'path';
import { fileURLToPath } from 'url';

import { Hono } from 'hono';
import { vi, afterAll, expect, test } from 'vitest';

const secret = 'planted-apicontext-secret';
process.env.LOWDEFY_SECRET_TEST = secret;

vi.doMock('@lowdefy/api', () => ({
  createApiContext: vi.fn(),
  createRequestSignal: vi.fn(({ clientSignal, timeoutSignal }) =>
    AbortSignal.any([clientSignal, timeoutSignal].filter(Boolean))
  ),
  // Returns what the server passes, so the test reads the auth-hook system context inputs.
  createSystemContext: vi.fn((options) => options),
  ensureMcpOauthResource: vi.fn(async () => {}),
  resolveAuthentication: vi.fn(async () => {}),
  resolvePinnedOrganization: vi.fn(async () => {}),
  resolveTenantPreflight: vi.fn(async () => {}),
}));
vi.doMock('../../lib/build/appMeta.js', () => ({ default: {} }));
vi.doMock('../../lib/build/config.js', () => ({ default: {} }));
vi.doMock('../../lib/build/i18n.js', () => ({ default: {} }));
vi.doMock('../../lib/build/logger.js', () => ({ default: { sentry: {} } }));
vi.doMock('../../lib/server/log/createHandleError.js', () => ({
  default: vi.fn(() => vi.fn()),
}));
vi.doMock('../../lib/server/log/createLogger.js', () => ({
  default: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));
vi.doMock('../../lib/server/fileCache.js', () => ({ default: {} }));
vi.doMock('../../lib/server/auth/getAuth.js', () => ({
  default: vi.fn(() => null),
}));
vi.doMock('../../lib/server/auth/getStrategies.js', () => ({
  default: vi.fn(() => null),
}));
vi.doMock('../../lib/server/log/logRequest.js', () => ({ default: vi.fn() }));
vi.doMock('../../lib/server/sentry/setSentryUser.js', () => ({
  default: vi.fn(),
}));

// apiContext statically imports the app build's plugin artifacts, which only
// exist in a built app (build/** is gitignored). Materialize the minimal set
// it needs so the import resolves; clean up only what this test created.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(dirname, '../../build/plugins');
const fixtures = [
  { file: 'agents.js', content: 'export default {};\n' },
  { file: 'connections.js', content: 'export default {};\n' },
  {
    file: 'notifications.js',
    content:
      'export default {};\nexport const interpolateProperties = () => {};\nexport const renderEmail = () => {};\n',
  },
  { file: path.join('operators', 'server.js'), content: 'export default {};\n' },
  { file: path.join('operators', 'serverJsMap.js'), content: 'export default {};\n' },
  { file: 'steps.js', content: 'export default {};\n' },
  { file: 'websockets.js', content: 'export default {};\n' },
].map(({ file, content }) => ({ absolutePath: path.join(pluginsDir, file), content }));

const createdFixtures = [];
fixtures.forEach(({ absolutePath, content }) => {
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
    createdFixtures.push(absolutePath);
  }
});

// A checkout that has built an app already holds real artifacts here, which import plugins this
// package does not depend on, so the stubs are also mocked over whatever is on disk.
fixtures.forEach(({ absolutePath }) => {
  vi.doMock(absolutePath, () => ({
    default: {},
    interpolateProperties: () => {},
    renderEmail: () => {},
  }));
});

afterAll(() => {
  createdFixtures.forEach((absolutePath) => fs.rmSync(absolutePath, { force: true }));
});

const { default: apiContext } = await import('./apiContext.js');
const { default: requestTimeout } = await import('./requestTimeout.js');
const { default: createSystemContext } = await import(
  '../../lib/server/auth/createSystemContext.js'
);

function createApp() {
  const app = new Hono();
  app.use('*', apiContext());
  app.get('/api/ping', (c) => {
    const context = c.get('lowdefyContext');
    return c.json({
      mode: context.mode,
      scrubbed: context.scrubSecrets(`token ${secret} end`),
    });
  });
  return app;
}

test('apiContext sets mode to prod', async () => {
  const res = await createApp().request('/api/ping');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body.mode).toEqual('prod');
});

test('apiContext scrubSecrets redacts a planted secret', async () => {
  const res = await createApp().request('/api/ping');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body.scrubbed).toEqual('token [REDACTED] end');
});

test('the auth-hook system context is built with mode prod and a scrubSecrets that redacts', () => {
  const context = createSystemContext({ auth: null });
  expect(context.mode).toEqual('prod');
  expect(context.scrubSecrets(`token ${secret} end`)).toEqual('token [REDACTED] end');
});

test('the request timeout answers 504 and cancels the work the request left running', async () => {
  const app = new Hono();
  app.use('*', requestTimeout({ timeoutMs: 20 }));
  app.use('*', apiContext());
  let reason;
  app.get('/api/slow', async (c) => {
    const { signal } = c.get('lowdefyContext');
    reason = await new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve(signal.reason), { once: true });
    });
    return c.json({ finished: true });
  });
  const res = await app.request('/api/slow');
  expect(res.status).toEqual(504);
  expect(reason.name).toEqual('TimeoutError');
  expect(reason.message).toEqual('The request timeout of 20ms was exceeded.');
});

test('a request that answers within the timeout leaves its signal unaborted', async () => {
  const app = new Hono();
  app.use('*', requestTimeout({ timeoutMs: 20 }));
  app.use('*', apiContext());
  let signal;
  app.get('/api/fast', (c) => {
    signal = c.get('lowdefyContext').signal;
    return c.json({ finished: true });
  });
  const res = await app.request('/api/fast');
  expect(res.status).toEqual(200);
  await new Promise((resolve) => setTimeout(resolve, 40));
  expect(signal.aborted).toBe(false);
});

test('a fault in authentication reaches the error handler with the request context', async () => {
  const { resolveAuthentication } = await import('@lowdefy/api');
  resolveAuthentication.mockRejectedValueOnce(new Error('Session store is down.'));
  const app = new Hono();
  let seen;
  app.onError((error, c) => {
    seen = c.get('lowdefyContext');
    return c.text('failed', 500);
  });
  app.use('*', apiContext());
  app.get('/api/ping', (c) => c.text('ok'));
  const response = await app.request('/api/ping', { headers: { 'x-request-id': 'rid-1' } });
  expect(response.status).toBe(500);
  expect(seen?.rid).toBe('rid-1');
  expect(seen?.handleError).toBeInstanceOf(Function);
  expect(response.headers.get('x-request-id')).toBe('rid-1');
});
