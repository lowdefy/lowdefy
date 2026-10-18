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
import { etag } from 'hono/etag';
import { jest } from '@jest/globals';

// What a mobile shell and a browser each get from the dev server: the dev
// mobile root and JIT pages behind the surface gate, with the real
// @lowdefy/api and the middleware app.js puts on these routes. The JIT build
// itself is stubbed.

jest.unstable_mockModule('../../lib/docs/getBuildId.js', () => ({
  default: () => 'build-a',
}));

const mockBuildPageWithContext = jest.fn(async () => ({ result: true, buildContext: {} }));
jest.unstable_mockModule('../../lib/server/jitPageBuilder.js', () => ({
  buildPageWithContext: mockBuildPageWithContext,
  getPageJitEnrichment: ({ pageConfig }) =>
    pageConfig.target === 'mobile' ? { jsEntries: 'export default {};' } : {},
}));

jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: { authPages: { signIn: '/auth/login', twoFactorEnrol: '/two-factor-enrol' } },
}));

jest.unstable_mockModule('../../lib/build/config.js', () => ({
  default: { basePath: '' },
}));

const { default: jitPageHandler } = await import('./jitPage.js');
const { default: mobileRootHandler } = await import('./mobileRoot.js');
const { default: noStore } = await import('../middleware/noStore.js');
const { default: stampCaller } = await import('../middleware/stampCaller.js');

const routes = [
  { pageId: 'home', path: 'home', auth: { public: true } },
  { pageId: 'today', path: 'today', auth: { public: true } },
  { pageId: 'jobs', path: 'jobs/{job_id}', auth: { public: true } },
  { pageId: 'admin', path: 'admin', auth: { public: false, roles: ['admin'] } },
];

const pages = {
  home: { id: 'page:home', pageId: 'home', target: 'web', auth: { public: true } },
  today: { id: 'page:today', pageId: 'today', target: 'mobile', auth: { public: true } },
  jobs: { id: 'page:jobs', pageId: 'jobs', target: 'mobile', auth: { public: true } },
  admin: {
    id: 'page:admin',
    pageId: 'admin',
    target: 'mobile',
    auth: { public: false, roles: ['admin'] },
  },
};

// The dev build's mobile artifacts: paths only, no hashes or type sets.
const configFiles = {
  'routes.json': routes,
  'mobile/config.json': {
    homePageId: 'today',
    minShellVersion: null,
    menus: {
      tabs: [
        { pageId: 'today', title: 'Today' },
        { pageId: 'admin', title: 'Admin' },
      ],
    },
    shells: [],
  },
  'mobile/pageIndex.json': [
    { path: 'today', pageId: 'today' },
    { path: 'jobs/{job_id}', pageId: 'jobs' },
    { path: 'admin', pageId: 'admin' },
  ],
  'mobile/typeSets.json': {},
};

function authorizeOutcome(user) {
  return function outcome(config) {
    if (config.auth.public === true) return 'allow';
    if (!user) return 'deny';
    if (!config.auth.roles.some((role) => user.roles.includes(role))) return 'deny';
    return 'allow';
  };
}

function createApp() {
  const app = new Hono();
  app.use('/api/*', async (c, next) => {
    const user = c.req.header('x-test-roles')
      ? { id: 'u1', roles: c.req.header('x-test-roles').split(',') }
      : null;
    c.set('lowdefyContext', {
      user,
      authSession: null,
      authEnforcement: null,
      authorizeOutcome: authorizeOutcome(user),
      buildDirectory: '/build',
      configDirectory: '/config',
      handleError: jest.fn(),
      logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
      readConfigFile: async (file) => {
        if (file.startsWith('pages/')) return pages[file.slice(6, -5)] ?? null;
        return configFiles[file];
      },
    });
    await next();
  });
  ['/api/mobile/root', '/api/page/*'].forEach((route) => {
    app.use(route, noStore());
    app.use(route, stampCaller());
    app.use(route, etag());
  });
  app.get('/api/mobile/root', mobileRootHandler);
  app.get('/api/page/*', jitPageHandler);
  return app;
}

const shell = { 'x-lowdefy-shell': 'dev' };

test('the dev mobile root lists the paths of the pages the caller may open', async () => {
  const res = await createApp().request('/api/mobile/root', { headers: shell });
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({
    homePageId: 'today',
    lowdefyGlobal: {},
    minShellVersion: null,
    menus: { tabs: [{ pageId: 'today', title: 'Today' }] },
    pageIndex: [
      { path: 'today', pageId: 'today' },
      { path: 'jobs/{job_id}', pageId: 'jobs' },
    ],
    typeSets: {},
    theme: { light: {}, dark: {} },
  });
  const admin = await createApp().request('/api/mobile/root', {
    headers: { ...shell, 'x-test-roles': 'admin' },
  });
  expect((await admin.json()).pageIndex.map((entry) => entry.pageId)).toEqual([
    'today',
    'jobs',
    'admin',
  ]);
});

test('the dev mobile root answers 304 to a matching If-None-Match', async () => {
  const app = createApp();
  const first = await app.request('/api/mobile/root', { headers: shell });
  const etagValue = first.headers.get('etag');
  expect(etagValue).toMatch(/^"[^"]+"$/);
  const second = await app.request('/api/mobile/root', {
    headers: { ...shell, 'if-none-match': etagValue },
  });
  expect(second.status).toEqual(304);
  expect(second.headers.get('cache-control')).toEqual('private, no-store');
  expect(second.headers.get('x-lowdefy-caller')).not.toBeNull();
});

test('a shell gets a mobile page with its _jsEntries', async () => {
  const res = await createApp().request('/api/page/jobs/42', { headers: shell });
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body.pageId).toEqual('jobs');
  expect(body.pathParams).toEqual({ job_id: '42' });
  expect(body.pageConfig._jsEntries).toEqual('export default {};');
  expect(body.pageConfig.target).toEqual('mobile');
});

test('a browser asking for a mobile page gets 404 naming the mobile surface', async () => {
  const res = await createApp().request('/api/page/today');
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ pageConfig: null, surface: 'mobile' });
});

test('a shell asking for a web page gets 404 naming the web surface', async () => {
  const res = await createApp().request('/api/page/home', { headers: shell });
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ pageConfig: null, surface: 'web' });
  const browser = await createApp().request('/api/page/home');
  expect(browser.status).toEqual(200);
});

test('a dev page answers 304 to a matching If-None-Match', async () => {
  const app = createApp();
  const first = await app.request('/api/page/today', { headers: shell });
  const second = await app.request('/api/page/today', {
    headers: { ...shell, 'if-none-match': first.headers.get('etag') },
  });
  expect(second.status).toEqual(304);
});
