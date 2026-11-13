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

import { vi, afterAll, beforeAll, beforeEach, expect, test } from 'vitest';

// The real app wiring with every handler stubbed, for an app with an MCP App
// view: which routes answer a view's origin with CORS headers, which routes a
// view session may call, and what the static files send.
function handler(c) {
  return c.json({ ok: true });
}
function passThrough() {
  return (c, next) => next();
}

// The caller apiContext would resolve: a view session when the test says so.
function apiContext() {
  return async (c, next) => {
    if (!c.get('lowdefyContext')) {
      c.set('lowdefyContext', {
        logger: { info: vi.fn(), warn: vi.fn() },
        user: { id: 'user-1' },
        viewSession:
          c.req.header('x-test-view-session') === 'true'
            ? { clientId: 'client-1', grantedScopes: ['mcp:read'] }
            : null,
      });
    }
    await next();
  };
}

const mcpJson = { views: { configured: true } };

vi.doMock('./routes/agent.js', () => ({ default: handler }));
vi.doMock('./routes/apiPage.js', () => ({ default: handler }));
vi.doMock('./routes/auth.js', () => ({ default: () => handler }));
vi.doMock('./routes/clientError.js', () => ({ default: handler }));
vi.doMock('./routes/cron.js', () => ({ default: handler }));
vi.doMock('./routes/cronForward.js', () => ({ default: handler }));
vi.doMock('./routes/detached.js', () => ({ default: handler }));
vi.doMock('./routes/endpoints.js', () => ({ default: handler }));
vi.doMock('./routes/mcp.js', () => ({ default: handler }));
vi.doMock('./routes/mobileRoot.js', () => ({ default: handler }));
vi.doMock('./routes/mountOauthDiscovery.js', () => ({ default: () => {} }));
vi.doMock('./routes/request.js', () => ({ default: handler }));
vi.doMock('./routes/usage.js', () => ({ default: handler }));
vi.doMock('./routes/user.js', () => ({ default: handler }));
vi.doMock('./routes/viewBoot.js', () => ({ default: handler }));
vi.doMock('./routes/viewRoot.js', () => ({ default: handler }));
vi.doMock('./routes/websocket.js', () => ({ default: handler }));
vi.doMock('./routes/wellKnownFallback.js', () => ({ default: handler }));
vi.doMock('./html/renderPage.js', () => ({
  default: (c) => c.html('<html></html>'),
}));
vi.doMock('./middleware/apiContext.js', () => ({ default: apiContext }));
vi.doMock('./middleware/sentry.js', () => ({ default: passThrough }));
vi.doMock('./middleware/errorHandler.js', () => ({
  default: () => (error, c) => c.json({ error: error.message }, 500),
}));
vi.doMock('../lib/build/appMeta.js', () => ({ default: { buildId: 'build-1' } }));
vi.doMock('../lib/build/auth.js', () => ({ default: { configured: false } }));
vi.doMock('../lib/build/theme.js', () => ({ default: {} }));
vi.doMock('../lib/build/config.js', () => ({ default: {} }));
vi.doMock('../lib/build/mcp.js', () => ({ default: mcpJson }));
vi.doMock('../lib/build/mobileConfig.js', () => ({ default: {} }));
vi.doMock('../lib/server/auth/getAuth.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/auth/getStrategies.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/log/createLogger.js', () => ({
  default: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

// The view origin is computed from the app's pinned public URL.
const originalAuthUrl = process.env.BETTER_AUTH_URL;
process.env.BETTER_AUTH_URL = 'https://app.test';

const { getViewHosts } = await import('@lowdefy/api');
const { default: createApp } = await import('./app.js');
const { default: viewRoutes } = await import('./lib/viewRoutes.js');

const [{ origin: viewOrigin }] = getViewHosts({ config: {} });

const originalCwd = process.cwd();
let serverDirectory;

beforeAll(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-app-view-'));
  fs.mkdirSync(path.join(serverDirectory, 'dist/client/assets'), { recursive: true });
  fs.writeFileSync(path.join(serverDirectory, 'dist/client/assets/main-abc.js'), 'export {};');
  fs.writeFileSync(path.join(serverDirectory, 'dist/client/icon.svg'), '<svg></svg>');
  process.chdir(serverDirectory);
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(serverDirectory, { recursive: true, force: true });
  if (originalAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalAuthUrl;
  }
});

beforeEach(() => {
  mcpJson.views.configured = true;
});

function corsHeaders(res) {
  return [...res.headers.keys()].filter((name) => name.startsWith('access-control-'));
}

const corsRequests = [
  ['GET', '/api/view/boot'],
  ['GET', '/api/view/root'],
  ['GET', '/api/page/home'],
  ['POST', '/api/request/home/get_data'],
  ['POST', '/api/endpoints/my_endpoint'],
  ['POST', '/api/agent/home/my_agent'],
  ['GET', '/api/user'],
  ['POST', '/api/client-error'],
  ['POST', '/api/usage'],
];

const otherRequests = [
  ['GET', '/api/auth/get-session'],
  ['POST', '/api/mcp'],
  ['GET', '/api/websocket'],
  ['GET', '/api/mobile/root'],
  ['GET', '/api/cron/nightly'],
  ['POST', '/api/detached/my_endpoint'],
  ['GET', '/api/lowdefy-health'],
  ['GET', '/home'],
];

test('the view routes that answer with CORS headers are the nine a view calls', () => {
  expect(viewRoutes.cors).toEqual([
    '/api/view/boot',
    '/api/view/root',
    '/api/page/*',
    '/api/request/*',
    '/api/endpoints/*',
    '/api/agent/*',
    '/api/user',
    '/api/client-error',
    '/api/usage',
  ]);
});

test.each(corsRequests)(
  'CORS: %s %s echoes the view origin, exposes the caller stamp and never allows credentials',
  async (method, url) => {
    const res = await createApp().request(url, { method, headers: { origin: viewOrigin } });
    expect(res.headers.get('access-control-allow-origin')).toEqual(viewOrigin);
    expect(res.headers.get('access-control-allow-origin')).not.toEqual('*');
    expect(res.headers.get('access-control-expose-headers')).toEqual('x-lowdefy-caller');
    expect(res.headers.has('access-control-allow-credentials')).toBe(false);
    expect(res.headers.get('vary')).toMatch(/\bOrigin\b/);
  }
);

test.each(corsRequests)('CORS: the preflight for %s %s is answered', async (method, url) => {
  const res = await createApp().request(url, {
    method: 'OPTIONS',
    headers: {
      origin: viewOrigin,
      'access-control-request-method': method,
      'access-control-request-headers': 'authorization,content-type,x-lowdefy-build',
    },
  });
  expect(res.status).toEqual(204);
  expect(res.headers.get('access-control-allow-origin')).toEqual(viewOrigin);
  expect(res.headers.get('access-control-allow-headers')).toEqual(
    'authorization, content-type, x-lowdefy-build'
  );
  expect(res.headers.get('access-control-allow-methods')).toContain(method);
  expect(res.headers.has('access-control-allow-credentials')).toBe(false);
  expect(res.headers.get('vary')).toMatch(/\bOrigin\b/);
});

test.each([
  ['another site', 'https://other.test'],
  ['the view domain over http', viewOrigin.replace('https://', 'http://')],
  ['a subdomain of the view origin', viewOrigin.replace('https://', 'https://x.')],
  ['the view origin with a port', `${viewOrigin}:8443`],
  ['the null origin', 'null'],
])('CORS: a request from %s gets no CORS header', async (_, origin) => {
  const app = createApp();
  for (const [method, url] of corsRequests) {
    const res = await app.request(url, { method, headers: { origin } });
    expect(corsHeaders(res)).toEqual([]);
    const preflight = await app.request(url, {
      method: 'OPTIONS',
      headers: { origin, 'access-control-request-method': method },
    });
    expect(corsHeaders(preflight)).toEqual([]);
  }
});

test.each(otherRequests)(
  'CORS: %s %s is not a view route and sends no CORS header to the view origin',
  async (method, url) => {
    const app = createApp();
    const res = await app.request(url, { method, headers: { origin: viewOrigin } });
    expect(corsHeaders(res)).toEqual([]);
    const preflight = await app.request(url, {
      method: 'OPTIONS',
      headers: { origin: viewOrigin, 'access-control-request-method': method },
    });
    expect(corsHeaders(preflight)).toEqual([]);
  }
);

test('CORS: an app without a view sends no CORS header on any route or file', async () => {
  mcpJson.views.configured = false;
  const app = createApp();
  const requests = [...corsRequests, ...otherRequests, ['GET', '/assets/main-abc.js']];
  for (const [method, url] of requests) {
    const res = await app.request(url, { method, headers: { origin: viewOrigin } });
    expect(corsHeaders(res)).toEqual([]);
    expect(res.headers.get('vary') ?? '').not.toMatch(/\bOrigin\b/);
  }
});

test('CORS: an app whose public URL is not pinned has no view origin and sends none', async () => {
  delete process.env.BETTER_AUTH_URL;
  const app = createApp();
  process.env.BETTER_AUTH_URL = 'https://app.test';
  const res = await app.request('/api/user', { headers: { origin: viewOrigin } });
  expect(corsHeaders(res)).toEqual([]);
});

test('refuseOtherBuild answers a view on an old build with a 409 the view can read', async () => {
  const res = await createApp().request('/api/request/home/get_data', {
    method: 'POST',
    headers: { origin: viewOrigin, 'x-lowdefy-build': 'build-0', 'x-test-view-session': 'true' },
  });
  expect(res.status).toEqual(409);
  expect(res.headers.get('access-control-allow-origin')).toEqual(viewOrigin);
  expect(await res.json()).toEqual(expect.objectContaining({ buildId: 'build-1' }));
});

// Every /api route the app registers, as a request that reaches it. app.use
// registers middleware under ALL: a path with a handler for one method is
// requested with that method, and a path with none of its own with POST.
function getApiRequests(app) {
  const methods = new Map();
  app.routes
    .filter((route) => route.path.startsWith('/api/') && route.path !== '/api/*')
    .forEach((route) => {
      const known = methods.get(route.path) ?? new Set();
      known.add(route.method);
      methods.set(route.path, known);
    });
  return [...methods.entries()].map(([routePath, known]) => {
    const own = [...known].filter((method) => method !== 'ALL');
    return { method: own[0] ?? 'POST', path: routePath, url: routePath.replace('*', 'x') };
  });
}

// Registered before the middleware that resolves a caller: it answers every
// caller alike and reads nothing of theirs.
const callerlessRoutes = ['/api/lowdefy-health'];

test('a view session is refused on every /api route that has not opted in', async () => {
  const app = createApp();
  const refused = [];
  const admitted = [];
  for (const { method, path: routePath, url } of getApiRequests(app)) {
    const res = await app.request(url, { method, headers: { 'x-test-view-session': 'true' } });
    if (res.status === 403) {
      expect(await res.json()).toEqual({
        name: 'AuthorizationError',
        message: 'A view session cannot call this route.',
      });
      refused.push(routePath);
    } else {
      admitted.push(routePath);
    }
  }
  // A route that answers a view session is one viewRoutes lists, and nothing else.
  expect([...new Set(admitted)].sort()).toEqual(
    [...viewRoutes.session, ...callerlessRoutes].sort()
  );
  expect(refused).toEqual(
    expect.arrayContaining([
      '/api/auth/*',
      '/api/mcp',
      '/api/mobile/root',
      '/api/cron/*',
      '/api/cron-forward/*',
      '/api/detached/*',
    ])
  );
});

test('the routes a view session may call are the view routes and the websocket', () => {
  expect(viewRoutes.session).toEqual([...viewRoutes.cors, '/api/websocket']);
});

test('a view session is refused on a route added later, which has not opted in', async () => {
  const app = createApp();
  app.post('/api/added-later', handler);
  const viewRes = await app.request('/api/added-later', {
    method: 'POST',
    headers: { 'x-test-view-session': 'true' },
  });
  expect(viewRes.status).toEqual(403);
  const browserRes = await app.request('/api/added-later', { method: 'POST' });
  expect(browserRes.status).toEqual(200);
});

test('a caller without a view session is not refused on any /api route', async () => {
  const app = createApp();
  for (const { method, url } of getApiRequests(app)) {
    const res = await app.request(url, { method });
    expect(res.status).toEqual(200);
  }
});

test('an app without a view refuses a view session on every /api route', async () => {
  mcpJson.views.configured = false;
  const app = createApp();
  for (const { method, path: routePath, url } of getApiRequests(app)) {
    if (!callerlessRoutes.includes(routePath)) {
      const res = await app.request(url, { method, headers: { 'x-test-view-session': 'true' } });
      expect(res.status).toEqual(403);
    }
  }
});

test('hashed assets allow any origin and keep their immutable caching', async () => {
  const res = await createApp().request('/assets/main-abc.js');
  expect(res.status).toEqual(200);
  expect(res.headers.get('access-control-allow-origin')).toEqual('*');
  expect(res.headers.get('cache-control')).toEqual('public, max-age=31536000, immutable');
});

test('public files allow any origin', async () => {
  const res = await createApp().request('/icon.svg');
  expect(res.status).toEqual(200);
  expect(res.headers.get('access-control-allow-origin')).toEqual('*');
});

test('a page, which no static file answers, allows no origin', async () => {
  const res = await createApp().request('/home', { headers: { origin: viewOrigin } });
  expect(res.status).toEqual(200);
  expect(corsHeaders(res)).toEqual([]);
});

test('a view session is refused on the page routes, which embed the caller', async () => {
  const app = createApp();
  const viewRes = await app.request('/home', { headers: { 'x-test-view-session': 'true' } });
  expect(viewRes.status).toEqual(403);
  expect(await viewRes.json()).toEqual({
    name: 'AuthorizationError',
    message: 'A view session cannot call this route.',
  });
  const browserRes = await app.request('/home');
  expect(browserRes.status).toEqual(200);
});

test('a view session still reads the static files', async () => {
  const res = await createApp().request('/icon.svg', {
    headers: { 'x-test-view-session': 'true' },
  });
  expect(res.status).toEqual(200);
});

test('an app without a view sends no Access-Control-Allow-Origin on its files', async () => {
  mcpJson.views.configured = false;
  const app = createApp();
  for (const url of ['/assets/main-abc.js', '/icon.svg']) {
    const res = await app.request(url);
    expect(res.status).toEqual(200);
    expect(corsHeaders(res)).toEqual([]);
  }
});

function hasRoute(app, routePath) {
  return app.routes.some((route) => route.method === 'GET' && route.path === routePath);
}

test('the view routes are routes of an app with a view only', () => {
  const withView = createApp();
  expect(hasRoute(withView, '/api/view/boot')).toBe(true);
  expect(hasRoute(withView, '/api/view/root')).toBe(true);
  mcpJson.views.configured = false;
  const withoutView = createApp();
  expect(hasRoute(withoutView, '/api/view/boot')).toBe(false);
  expect(hasRoute(withoutView, '/api/view/root')).toBe(false);
});
