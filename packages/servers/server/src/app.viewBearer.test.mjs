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
import { fileURLToPath } from 'node:url';

import { vi, afterAll, beforeAll, expect, test } from 'vitest';

// A view bearer through the app as production runs it: the real app wiring,
// apiContext, refuseViewSession, CORS, error handler and endpoint route, over
// the real @lowdefy/api. Only the session lookup is stubbed, since resolving a
// bearer needs the auth database: resolveAuthentication's view branch is
// covered in @lowdefy/api (viewSession.mongodb.test.js). The app's build
// artifacts are a fixture on disk.

const sessions = {
  'read-token': { clientId: 'client-1', grantedScopes: ['mcp:read'] },
  'write-token': { clientId: 'client-1', grantedScopes: ['mcp:read', 'mcp:write'] },
};

// What resolveAuthentication writes for a bearer that is a live view session,
// and for one that is not: no caller and no view session.
const mockResolveAuthentication = vi.fn(async (context, { headers }) => {
  const authorization = headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  const viewSession = sessions[token] ?? null;
  context.user = viewSession === null ? null : { id: 'user-1', roles: [] };
  context.authSession = null;
  context.viewSession = viewSession;
});

const api = await import('@lowdefy/api');
vi.doMock('@lowdefy/api', () => ({
  ...api,
  ensureMcpOauthResource: vi.fn(async () => {}),
  resolveAuthentication: mockResolveAuthentication,
  resolvePinnedOrganization: vi.fn(async () => {}),
  resolveTenantPreflight: vi.fn(async () => {}),
}));

function handler(c) {
  return c.json({ ok: true });
}

// Routes this test does not call: their modules read a built app at import.
vi.doMock('./routes/agent.js', () => ({ default: handler }));
vi.doMock('./routes/apiPage.js', () => ({ default: handler }));
vi.doMock('./routes/auth.js', () => ({ default: () => handler }));
vi.doMock('./routes/clientError.js', () => ({ default: handler }));
vi.doMock('./routes/cron.js', () => ({ default: handler }));
vi.doMock('./routes/cronForward.js', () => ({ default: handler }));
vi.doMock('./routes/detached.js', () => ({ default: handler }));
vi.doMock('./routes/mcp.js', () => ({ default: handler }));
vi.doMock('./routes/mobileRoot.js', () => ({ default: handler }));
vi.doMock('./routes/mountOauthDiscovery.js', () => ({ default: () => {} }));
vi.doMock('./routes/request.js', () => ({ default: handler }));
vi.doMock('./routes/usage.js', () => ({ default: handler }));
vi.doMock('./routes/viewBoot.js', () => ({ default: handler }));
vi.doMock('./routes/websocket.js', () => ({ default: handler }));
vi.doMock('./routes/wellKnownFallback.js', () => ({ default: handler }));
vi.doMock('./html/renderPage.js', () => ({ default: (c) => c.html('<html></html>') }));
vi.doMock('./middleware/sentry.js', () => ({ default: () => (c, next) => next() }));

vi.doMock('../lib/build/appMeta.js', () => ({ default: { buildId: 'build-1' } }));
vi.doMock('../lib/build/auth.js', () => ({ default: { configured: false } }));
vi.doMock('../lib/build/config.js', () => ({ default: {} }));
vi.doMock('../lib/build/i18n.js', () => ({ default: {} }));
vi.doMock('../lib/build/logger.js', () => ({ default: { sentry: {} } }));
vi.doMock('../lib/build/mcp.js', () => ({ default: { views: { configured: true } } }));
vi.doMock('../lib/build/mobileConfig.js', () => ({ default: {} }));
vi.doMock('../lib/build/theme.js', () => ({ default: {} }));
vi.doMock('../lib/server/auth/getAuth.js', () => ({ default: vi.fn(() => null) }));
vi.doMock('../lib/server/auth/getStrategies.js', () => ({ default: vi.fn(() => null) }));
const mockHandleError = vi.fn();
vi.doMock('../lib/server/log/createHandleError.js', () => ({
  default: vi.fn(() => mockHandleError),
}));
vi.doMock('../lib/server/log/createLogger.js', () => ({
  default: vi.fn(() => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));
vi.doMock('../lib/server/log/logRequest.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/sentry/captureSentryError.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/sentry/setSentryUser.js', () => ({ default: vi.fn() }));

// apiContext statically imports the app build's plugin artifacts, which only exist in a built app
// (build/** is gitignored). The same fixtures as middleware/apiContext.test.mjs.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsDir = path.resolve(dirname, '../build/plugins');
const fixtures = [
  'agents.js',
  'connections.js',
  'notifications.js',
  path.join('operators', 'server.js'),
  path.join('operators', 'serverJsMap.js'),
  'steps.js',
  'websockets.js',
].map((file) => path.join(pluginsDir, file));

const createdFixtures = [];
fixtures.forEach((absolutePath) => {
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(
      absolutePath,
      'export default {};\nexport const interpolateProperties = () => {};\nexport const renderEmail = () => {};\n'
    );
    createdFixtures.push(absolutePath);
  }
});
fixtures.forEach((absolutePath) => {
  vi.doMock(absolutePath, () => ({
    default: {},
    interpolateProperties: () => {},
    renderEmail: () => {},
  }));
});

// The view origin is computed from the app's pinned public URL.
const originalAuthUrl = process.env.BETTER_AUTH_URL;
process.env.BETTER_AUTH_URL = 'https://app.test';

const { default: createApp } = await import('./app.js');

const [{ origin: viewOrigin }] = api.getViewHosts({ config: {} });

// The build of an app with one view page that calls a read and a write endpoint.
const buildFiles = {
  'mcp.json': {
    views: {
      configured: true,
      pages: {
        task: {
          endpoints: [
            { id: 'list_tasks', scope: 'mcp:read' },
            { id: 'save_task', scope: 'mcp:write' },
          ],
          websockets: [],
          agents: [],
        },
      },
      sources: [],
    },
  },
  'api/list_tasks.json': {
    id: 'endpoint:list_tasks',
    endpointId: 'list_tasks',
    type: 'Api',
    auth: { public: true },
    routine: [],
  },
  'api/save_task.json': {
    id: 'endpoint:save_task',
    endpointId: 'save_task',
    type: 'Api',
    auth: { public: true },
    routine: [],
  },
  // An endpoint of the app that no view page calls.
  'api/delete_space.json': {
    id: 'endpoint:delete_space',
    endpointId: 'delete_space',
    type: 'Api',
    auth: { public: true },
    routine: [],
  },
};

const originalCwd = process.cwd();
let serverDirectory;

beforeAll(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-view-bearer-'));
  Object.entries(buildFiles).forEach(([file, content]) => {
    const filePath = path.join(serverDirectory, 'build', file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content));
  });
  process.chdir(serverDirectory);
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(serverDirectory, { recursive: true, force: true });
  createdFixtures.forEach((absolutePath) => fs.rmSync(absolutePath, { force: true }));
  if (originalAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalAuthUrl;
  }
});

function call({ method = 'GET', url, token }) {
  return createApp({ serveStaticAssets: false }).request(url, {
    method,
    headers: {
      origin: viewOrigin,
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: method === 'POST' ? JSON.stringify({ payload: {} }) : undefined,
  });
}

const refusal = {
  name: 'AuthorizationError',
  message: 'A view session cannot call this route.',
};

test('a view bearer is answered on an admitted route, as its user and readable by the view', async () => {
  const res = await call({ url: '/api/user', token: 'read-token' });
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ user: { id: 'user-1', roles: [] } });
  expect(res.headers.get('access-control-allow-origin')).toEqual(viewOrigin);
  expect(res.headers.has('access-control-allow-credentials')).toBe(false);
  expect(mockResolveAuthentication).toHaveBeenCalled();
});

test.each([
  ['GET', '/api/mobile/root'],
  ['GET', '/api/cron/nightly'],
  ['POST', '/api/detached/save_task'],
  ['POST', '/api/mcp'],
])('a view bearer is refused on %s %s, which viewRoutes does not list', async (method, url) => {
  const res = await call({ method, url, token: 'write-token' });
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual(refusal);
  expect(res.headers.has('access-control-allow-origin')).toBe(false);
});

test.each([
  // An exact route does not match with a trailing slash, so it is not admitted.
  ['GET', '/api/user/'],
  ['GET', '/api/view/root/'],
  ['GET', '/api/mobile/root/'],
  ['POST', '/api/mcp/'],
  ['POST', '/api/usage/'],
])('a view bearer is refused on %s %s, a path with a trailing slash', async (method, url) => {
  const res = await call({ method, url, token: 'write-token' });
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual(refusal);
});

test('a trailing slash on an endpoint call reaches the same checks as the call without it', async () => {
  const res = await call({ method: 'POST', url: '/api/endpoints/save_task/', token: 'read-token' });
  expect(res.status).toEqual(403);
  expect((await res.json()).code).toEqual('view_write_required');
  const unlisted = await call({
    method: 'POST',
    url: '/api/endpoints/delete_space/',
    token: 'write-token',
  });
  expect(unlisted.status).toEqual(403);
});

test('a write on a read-only grant answers 403 with the view_write_required code', async () => {
  const res = await call({ method: 'POST', url: '/api/endpoints/save_task', token: 'read-token' });
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({
    name: 'AuthorizationError',
    message: 'This connection is read-only. Reconnect with write access to make changes.',
    code: 'view_write_required',
  });
  // The view reads the refusal across origins, and it is not reported as a fault.
  expect(res.headers.get('access-control-allow-origin')).toEqual(viewOrigin);
  expect(mockHandleError).not.toHaveBeenCalled();
});

test('a read on a read-only grant and a write on a write grant run the endpoint', async () => {
  const read = await call({
    method: 'POST',
    url: '/api/endpoints/list_tasks',
    token: 'read-token',
  });
  expect(read.status).toEqual(200);
  expect((await read.json()).success).toBe(true);
  const write = await call({
    method: 'POST',
    url: '/api/endpoints/save_task',
    token: 'write-token',
  });
  expect(write.status).toEqual(200);
  expect((await write.json()).success).toBe(true);
});

test('an endpoint no view page calls is refused to a view bearer, with no code', async () => {
  const res = await call({
    method: 'POST',
    url: '/api/endpoints/delete_space',
    token: 'write-token',
  });
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({
    name: 'AuthorizationError',
    message: 'API Endpoint "delete_space" does not exist.',
  });
});

test('a bearer that is no live view session reaches a view route as nobody', async () => {
  const res = await call({ url: '/api/view/root', token: 'expired-token' });
  expect(res.status).toEqual(401);
  expect(await res.json()).toEqual({
    name: 'AuthenticationError',
    message: 'A view session is required.',
  });
});
