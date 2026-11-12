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

import { vi, expect, test } from 'vitest';

// The dev app's own wiring with every handler stubbed. The dev server serves
// no MCP App views, so a view session must be refused on every /api route
// that resolves a caller.
function handler(c) {
  return c.json({ ok: true });
}
function passThrough() {
  return (c, next) => next();
}

// The caller createLowdefyContext would resolve: a view session when the test
// says so.
function apiContext() {
  return async (c, next) => {
    if (!c.get('lowdefyContext')) {
      c.set('lowdefyContext', {
        logger: { info: vi.fn(), warn: vi.fn() },
        user: { id: 'user-1' },
        viewSession:
          c.req.header('x-test-view-session') === 'true'
            ? { clientId: 'client-1', grantedScopes: ['mcp:read', 'mcp:write'] }
            : null,
      });
    }
    await next();
  };
}

[
  'agent',
  'clientError',
  'cron',
  'cronForward',
  'detached',
  'devInspect',
  'devRecording',
  'devTools',
  'endpoints',
  'jitPage',
  'mcp',
  'mobileRoot',
  'ping',
  'reload',
  'request',
  'root',
  'usage',
  'user',
  'websocket',
  'wellKnownFallback',
].forEach((route) => {
  vi.doMock(`./routes/${route}.js`, () => ({ default: handler }));
});
vi.doMock('./routes/auth.js', () => ({ default: () => handler }));
vi.doMock('./routes/docs/loadDocsRoutes.js', () => ({ default: async () => ({}) }));
vi.doMock('./routes/mountDevPageRoutes.js', () => ({ default: () => {} }));
vi.doMock('./routes/mountMobileWellKnown.js', () => ({ default: () => {} }));
vi.doMock('./routes/mountOauthDiscovery.js', () => ({ default: () => {} }));
vi.doMock('./html/renderDevPage.js', () => ({ default: (c) => c.html('<html></html>') }));
vi.doMock('./middleware/apiContext.js', () => ({ default: apiContext }));
vi.doMock('./middleware/localDevToolsOnly.js', () => ({ default: passThrough }));
vi.doMock('./middleware/staleFlag.js', () => ({ default: passThrough }));
vi.doMock('./middleware/errorHandler.js', () => ({
  default: () => (error, c) => c.json({ error: error.message }, 500),
}));
vi.doMock('../lib/build/auth.js', () => ({ default: { configured: false } }));
vi.doMock('../lib/build/config.js', () => ({ default: {} }));
vi.doMock('../lib/build/mobileConfig.js', () => ({ default: {} }));
vi.doMock('../lib/server/auth/getAuth.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/auth/getMockUser.js', () => ({ default: () => null }));
vi.doMock('../lib/server/auth/getStrategies.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/log/createLogger.js', () => ({
  default: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));
vi.doMock('../lib/server/startIdleGc.js', () => ({ default: () => {} }));

const { default: app } = await import('./app.js');

// The routes registered before apiContext: dev tooling that resolves no
// caller, so there is no view session to refuse.
const callerlessRoutes = [
  '/api/reload',
  '/api/ping',
  '/api/dev-tools',
  '/api/dev-inspect',
  '/api/dev-inspect/*',
  '/api/dev-recording',
];

// Every /api route the app registers, as a request that reaches it. app.use
// registers middleware under ALL: a path with a handler for one method is
// requested with that method, and a path with none of its own with POST.
function getApiRequests() {
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

test('the dev server refuses a view session on every /api route that resolves a caller', async () => {
  const admitted = [];
  const refused = [];
  for (const { method, path, url } of getApiRequests()) {
    const res = await app.request(url, { method, headers: { 'x-test-view-session': 'true' } });
    if (res.status === 403) {
      expect(await res.json()).toEqual({
        name: 'AuthorizationError',
        message: 'A view session cannot call this route.',
      });
      refused.push(path);
    } else {
      admitted.push(path);
    }
  }
  expect(admitted.sort()).toEqual([...callerlessRoutes].sort());
  expect(refused).toEqual(
    expect.arrayContaining([
      '/api/root',
      '/api/page/*',
      '/api/request/*',
      '/api/endpoints/*',
      '/api/agent/*',
      '/api/user',
      '/api/usage',
      '/api/client-error',
      '/api/websocket',
      '/api/mobile/root',
      '/api/mcp',
    ])
  );
});

test('the dev server answers a caller without a view session on every /api route', async () => {
  for (const { method, url } of getApiRequests()) {
    const res = await app.request(url, { method });
    expect(res.status).toEqual(200);
  }
});
