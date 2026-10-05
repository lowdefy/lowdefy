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
import { jest } from '@jest/globals';

const { default: getPageConfig } = await import('@lowdefy/api/routes/page/getPageConfig.js');

const mockGetRootConfig = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  getPageConfig,
  getRootConfig: mockGetRootConfig,
}));

jest.unstable_mockModule('../../lib/build/app.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: { authPages: { signIn: '/auth/login', twoFactorEnrol: '/two-factor-enrol' } },
}));
jest.unstable_mockModule('../../lib/build/config.js', () => ({ default: { basePath: '' } }));
jest.unstable_mockModule('../../lib/build/theme.js', () => ({ default: {} }));
jest.unstable_mockModule('./getAssets.js', () => ({ default: () => ({}) }));
jest.unstable_mockModule('./getPageAssets.js', () => ({ default: () => ({}) }));
jest.unstable_mockModule('./template.js', () => ({
  default: ({ config, title }) => JSON.stringify({ config, title }),
}));

const { default: renderPage } = await import('./renderPage.js');
const { default: mountPageRoutes } = await import('../routes/mountPageRoutes.js');

const routes = [
  { pageId: '404', path: '404' },
  { pageId: 'home', path: 'home' },
  { pageId: 'ticket', path: '{space}/tickets/{ticket_id}' },
  { pageId: 'section', path: '{section}' },
];

const pages = {
  404: { id: '404' },
  home: { id: 'home' },
  ticket: { id: 'ticket', properties: { title: 'Ticket' } },
  section: { id: 'section' },
};

function createApp({
  outcome = 'allow',
  pagesProtectedByDefault = false,
  routeTable = routes,
  user = { id: 'u1' },
} = {}) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      authEnforcement: { pagesProtectedByDefault },
      authorizeOutcome: () => outcome,
      logger: { info: jest.fn() },
      readConfigFile: async (file) => {
        if (file === 'routes.json') return routeTable;
        return pages[file.slice('pages/'.length, -'.json'.length)] ?? null;
      },
      user,
    });
    await next();
  });
  mountPageRoutes({ app, basePath: '', renderPage });
  return app;
}

beforeEach(() => {
  mockGetRootConfig.mockResolvedValue({
    home: { configured: true, pageId: 'home', pathParams: {} },
  });
});

async function readConfig(res) {
  return JSON.parse(await res.text()).config;
}

test('renderPage embeds pageId, pathParams and matchedPath for a patterned page', async () => {
  const res = await createApp().request('/support/tickets/1234');
  expect(res.status).toEqual(200);
  const config = await readConfig(res);
  expect(config.pageId).toEqual('ticket');
  expect(config.pathParams).toEqual({ space: 'support', ticket_id: '1234' });
  expect(config.matchedPath).toEqual('support/tickets/1234');
  expect(config.pageConfig).toEqual({ id: 'ticket', properties: { title: 'Ticket' } });
});

test('renderPage decodes an encoded "/" in a value once and keeps matchedPath encoded', async () => {
  const res = await createApp().request('/support/tickets/a%2Fb/');
  const config = await readConfig(res);
  expect(config.pathParams).toEqual({ space: 'support', ticket_id: 'a/b' });
  expect(config.matchedPath).toEqual('support/tickets/a%2Fb');
});

test('renderPage redirects an unmatched path to /404', async () => {
  const res = await createApp().request('/support/tickets');
  expect(res.status).toEqual(302);
  expect(res.headers.get('location')).toEqual('/404');
});

test('renderPage redirects an unmatched path to sign-in with the path and query under pagesProtectedByDefault', async () => {
  const res = await createApp({ pagesProtectedByDefault: true, user: null }).request(
    '/support/tickets?tab=2'
  );
  expect(res.status).toEqual(302);
  expect(res.headers.get('location')).toEqual(
    `/auth/login?callbackUrl=${encodeURIComponent('/support/tickets?tab=2')}`
  );
});

test('renderPage redirects a protected patterned page to sign-in with the path and query', async () => {
  const res = await createApp({ outcome: 'deny', user: null }).request(
    '/support/tickets/1234?tab=2'
  );
  expect(res.headers.get('location')).toEqual(
    `/auth/login?callbackUrl=${encodeURIComponent('/support/tickets/1234?tab=2')}`
  );
});

test('renderPage serves a page without path at its id', async () => {
  const res = await createApp().request('/home');
  const config = await readConfig(res);
  expect(config.pageId).toEqual('home');
  expect(config.pathParams).toEqual({});
  expect(config.matchedPath).toEqual('home');
});

test('renderPage serves the configured home page at /', async () => {
  const res = await createApp().request('/');
  expect(res.status).toEqual(200);
  const config = await readConfig(res);
  expect(config.pageId).toEqual('home');
  expect(config.matchedPath).toEqual('');
});

test('renderPage redirects / to the home menu link built from its pathParams', async () => {
  mockGetRootConfig.mockResolvedValue({
    home: {
      configured: false,
      pageId: 'ticket',
      pathParams: { space: 'support', ticket_id: '12 34' },
    },
  });
  const res = await createApp().request('/');
  expect(res.status).toEqual(302);
  expect(res.headers.get('location')).toEqual('/support/tickets/12%2034');
});

test('renderPage serves /404 as a fixed route with status 404', async () => {
  const res = await createApp().request('/404');
  expect(res.status).toEqual(404);
  const config = await readConfig(res);
  expect(config.pageId).toEqual('404');
});

test('renderPage returns a plain 404 when the build has no 404 page', async () => {
  const res = await createApp({ routeTable: [{ pageId: 'home', path: 'home' }] }).request('/404');
  expect(res.status).toEqual(404);
  expect(await res.text()).toEqual('Page not found.');
});
