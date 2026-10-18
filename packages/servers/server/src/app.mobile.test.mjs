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

// The real app wiring with the real page, mobile root and well-known routes,
// over a fake caller context: what a mobile shell and a browser each get.
function handler(c) {
  return c.json({ ok: true });
}
function passThrough() {
  return (c, next) => next();
}

const routes = [
  { pageId: 'home', path: 'home', auth: { public: true } },
  { pageId: 'today', path: 'today', auth: { public: true } },
  { pageId: 'shared', path: 'shared', auth: { public: true } },
  { pageId: 'admin', path: 'admin', auth: { public: false, roles: ['admin'] } },
];

const pages = {
  home: { id: 'page:home', pageId: 'home', target: 'web', auth: { public: true } },
  today: {
    id: 'page:today',
    pageId: 'today',
    target: 'mobile',
    auth: { public: true },
    properties: { notes: 'x'.repeat(4000) },
  },
  shared: { id: 'page:shared', pageId: 'shared', target: 'both', auth: { public: true } },
  admin: {
    id: 'page:admin',
    pageId: 'admin',
    target: 'mobile',
    auth: { public: false, roles: ['admin'] },
  },
};

const mobileConfig = {
  homePageId: 'today',
  minShellVersion: '7.4.0',
  menus: {
    tabs: [
      { pageId: 'today', title: 'Today' },
      { pageId: 'admin', title: 'Admin' },
    ],
  },
  shells: [
    {
      id: 'field',
      ios: { bundleId: 'com.example.field', teamId: 'TEAM1' },
      android: { package: 'com.example.field', sha256: ['AA:BB'] },
    },
  ],
};

const configFiles = {
  'routes.json': routes,
  'mobile/config.json': mobileConfig,
  'mobile/pageIndex.json': [
    { path: 'today', pageId: 'today', hash: 'h-today', typesKey: 't1' },
    { path: 'shared', pageId: 'shared', hash: 'h-shared', typesKey: 't1' },
    { path: 'admin', pageId: 'admin', hash: 'h-admin', typesKey: 't2' },
  ],
  'mobile/typeSets.json': { t1: { blocks: [] }, t2: { blocks: [] } },
  'mobile/theme.json': {
    darkMode: 'system',
    light: { colorPrimary: '#1677ff' },
    dark: { colorPrimary: '#1668dc' },
  },
  'mobile/classMap.json': { 'p-4': { paddingTop: 16 } },
  'mobile/appJs.json': { jsEntries: null },
};

function authorizeOutcome(user) {
  return function outcome(config) {
    const roles = config.auth.roles;
    if (config.auth.public === true) return 'allow';
    if (!user) return 'deny';
    if (roles && !roles.some((role) => user.roles.includes(role))) return 'deny';
    return 'allow';
  };
}

jest.unstable_mockModule('./middleware/apiContext.js', () => ({
  default: () => async (c, next) => {
    const user = c.req.header('x-test-roles')
      ? { id: 'u1', roles: c.req.header('x-test-roles').split(',') }
      : null;
    c.set('lowdefyContext', {
      user,
      authSession: null,
      authEnforcement: null,
      authorizeOutcome: authorizeOutcome(user),
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      readConfigFile: async (file) => {
        if (file.startsWith('pages/')) return pages[file.slice(6, -5)] ?? null;
        return configFiles[file];
      },
    });
    await next();
  },
}));
jest.unstable_mockModule('./routes/agent.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/auth.js', () => ({ default: () => handler }));
jest.unstable_mockModule('./routes/clientError.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/cron.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/cronForward.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/detached.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/endpoints.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/mcp.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/mountOauthDiscovery.js', () => ({ default: () => {} }));
jest.unstable_mockModule('./routes/request.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/usage.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/user.js', () => ({ default: handler }));
jest.unstable_mockModule('./routes/websocket.js', () => ({ default: handler }));
jest.unstable_mockModule('./html/renderPage.js', () => ({
  default: (c) => c.html('<html></html>'),
}));
jest.unstable_mockModule('./middleware/sentry.js', () => ({ default: passThrough }));
jest.unstable_mockModule('./middleware/errorHandler.js', () => ({
  default: () => (error, c) => c.json({ error: error.message }, 500),
}));
jest.unstable_mockModule('../lib/build/appMeta.js', () => ({ default: { buildId: 'build-1' } }));
jest.unstable_mockModule('../lib/build/auth.js', () => ({
  default: { configured: false, authPages: { signIn: '/auth/login' } },
}));
jest.unstable_mockModule('../lib/build/config.js', () => ({ default: {} }));
jest.unstable_mockModule('../lib/build/mobileConfig.js', () => ({ default: mobileConfig }));
jest.unstable_mockModule('../lib/server/auth/getAuth.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../lib/server/auth/getStrategies.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../lib/server/log/createLogger.js', () => ({
  default: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

const { default: createApp } = await import('./app.js');

const originalCwd = process.cwd();
let serverDirectory;
let app;

beforeAll(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-mobile-'));
  fs.mkdirSync(path.join(serverDirectory, 'dist/client'), { recursive: true });
  process.chdir(serverDirectory);
  app = createApp();
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

const shell = { 'x-lowdefy-shell': '7.4.0' };

describe('GET /api/mobile/root', () => {
  test('filters the page index, menus and type sets by the caller roles', async () => {
    const signedOut = await app.request('/api/mobile/root', { headers: shell });
    expect(signedOut.status).toEqual(200);
    const signedOutBody = await signedOut.json();
    expect(signedOutBody.pageIndex.map((entry) => entry.pageId)).toEqual(['today', 'shared']);
    expect(signedOutBody.menus.tabs.map((item) => item.pageId)).toEqual(['today']);
    expect(Object.keys(signedOutBody.typeSets)).toEqual(['t1']);

    const admin = await app.request('/api/mobile/root', {
      headers: { ...shell, 'x-test-roles': 'admin' },
    });
    const adminBody = await admin.json();
    expect(adminBody.pageIndex.map((entry) => entry.pageId)).toEqual(['today', 'shared', 'admin']);
    expect(adminBody.menus.tabs.map((item) => item.pageId)).toEqual(['today', 'admin']);
    expect(adminBody.minShellVersion).toEqual('7.4.0');
  });

  test('sends the theme and class map the build wrote', async () => {
    const res = await app.request('/api/mobile/root', { headers: shell });
    const body = await res.json();
    expect(body.theme).toEqual(configFiles['mobile/theme.json']);
    expect(body.classMap).toEqual(configFiles['mobile/classMap.json']);
  });

  test('sends a strong ETag, no-store and the caller stamp', async () => {
    const res = await app.request('/api/mobile/root', { headers: shell });
    expect(res.headers.get('etag')).toMatch(/^"[^"]+"$/);
    expect(res.headers.get('cache-control')).toEqual('private, no-store');
    expect(res.headers.get('x-lowdefy-caller')).not.toBeNull();
  });

  test('answers 304 with the caller stamp to a matching If-None-Match', async () => {
    const first = await app.request('/api/mobile/root', { headers: shell });
    const etag = first.headers.get('etag');
    const second = await app.request('/api/mobile/root', {
      headers: { ...shell, 'if-none-match': etag },
    });
    expect(second.status).toEqual(304);
    expect(await second.text()).toEqual('');
    expect(second.headers.get('etag')).toEqual(etag);
    expect(second.headers.get('cache-control')).toEqual('private, no-store');
    expect(second.headers.get('x-lowdefy-caller')).not.toBeNull();
  });

  test('answers 200 when the roles changed what the caller sees', async () => {
    const first = await app.request('/api/mobile/root', { headers: shell });
    const res = await app.request('/api/mobile/root', {
      headers: { ...shell, 'x-test-roles': 'admin', 'if-none-match': first.headers.get('etag') },
    });
    expect(res.status).toEqual(200);
  });
});

describe('GET /api/page/* surface gate', () => {
  test('serves a mobile page to a shell and refuses it to a browser', async () => {
    const toShell = await app.request('/api/page/today', { headers: shell });
    expect(toShell.status).toEqual(200);
    expect((await toShell.json()).pageId).toEqual('today');

    const toBrowser = await app.request('/api/page/today');
    expect(toBrowser.status).toEqual(404);
    expect(await toBrowser.json()).toEqual({ pageConfig: null, surface: 'mobile' });
  });

  test('serves a web page to a browser and refuses it to a shell', async () => {
    const toBrowser = await app.request('/api/page/home');
    expect(toBrowser.status).toEqual(200);

    const toShell = await app.request('/api/page/home', { headers: shell });
    expect(toShell.status).toEqual(404);
    expect(await toShell.json()).toEqual({ pageConfig: null, surface: 'web' });
  });

  test('serves a shared page to both', async () => {
    expect((await app.request('/api/page/shared')).status).toEqual(200);
    expect((await app.request('/api/page/shared', { headers: shell })).status).toEqual(200);
  });

  test('keeps page access with auth: a signed-out shell gets the sign-in redirect', async () => {
    const res = await app.request('/api/page/admin', { headers: shell });
    expect(res.status).toEqual(401);
  });
});

describe('GET /api/page/* ETag', () => {
  test('answers 304 to a matching If-None-Match', async () => {
    const first = await app.request('/api/page/shared');
    const etag = first.headers.get('etag');
    expect(etag).toMatch(/^"[^"]+"$/);
    const second = await app.request('/api/page/shared', { headers: { 'if-none-match': etag } });
    expect(second.status).toEqual(304);
    expect(second.headers.get('x-lowdefy-caller')).not.toBeNull();
  });

  test('a compressed page carries a weak ETag that still revalidates', async () => {
    const first = await app.request('/api/page/today', {
      headers: { ...shell, 'accept-encoding': 'gzip' },
    });
    expect(first.headers.get('content-encoding')).toEqual('gzip');
    const etag = first.headers.get('etag');
    expect(etag).toMatch(/^W\/"[^"]+"$/);
    const second = await app.request('/api/page/today', {
      headers: { ...shell, 'accept-encoding': 'gzip', 'if-none-match': etag },
    });
    expect(second.status).toEqual(304);
  });

  test('an error answer carries no ETag', async () => {
    const res = await app.request('/api/page/missing');
    expect(res.status).toEqual(404);
    expect(res.headers.get('etag')).toBeNull();
  });
});

describe('/.well-known', () => {
  test('serves apple-app-site-association from mobile.shells', async () => {
    const res = await app.request('/.well-known/apple-app-site-association');
    expect(res.status).toEqual(200);
    expect(res.headers.get('content-type')).toMatch(/^application\/json/);
    expect(await res.json()).toEqual({
      applinks: {
        details: [
          {
            appIDs: ['TEAM1.com.example.field'],
            components: [{ '/': '/api/*', exclude: true }, { '/': '/*' }],
          },
        ],
      },
    });
  });

  test('serves assetlinks.json from mobile.shells', async () => {
    const res = await app.request('/.well-known/assetlinks.json');
    expect(res.status).toEqual(200);
    expect(await res.json()).toEqual([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.example.field',
          sha256_cert_fingerprints: ['AA:BB'],
        },
      },
    ]);
  });

  test('the catch-all still answers 404 for other well-known paths', async () => {
    const res = await app.request('/.well-known/security.txt');
    expect(res.status).toEqual(404);
    expect((await res.json()).name).toEqual('NotFoundError');
  });
});

describe('endpoint calls and the build stamp', () => {
  test('an endpoint call without x-lowdefy-build runs, as a shell sends it', async () => {
    const res = await app.request('/api/endpoints/my_endpoint', { method: 'POST' });
    expect(res.status).toEqual(200);
  });

  test('an endpoint call from another build is refused with 409', async () => {
    const res = await app.request('/api/endpoints/my_endpoint', {
      method: 'POST',
      headers: { 'x-lowdefy-build': 'build-0' },
    });
    expect(res.status).toEqual(409);
    expect((await res.json()).buildId).toEqual('build-1');
  });
});
