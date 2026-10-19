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

jest.unstable_mockModule('../../lib/build/appMeta.js', () => ({
  default: { buildId: 'build-abc' },
}));

jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: { authPages: { signIn: '/auth/login', twoFactorEnrol: '/two-factor-enrol' } },
}));

jest.unstable_mockModule('../../lib/build/config.js', () => ({
  default: { basePath: '' },
}));

const { default: apiPageHandler } = await import('./apiPage.js');

const routes = [
  { pageId: 'home', path: 'home' },
  { pageId: 'ticket', path: '{space}/tickets/{ticket_id}' },
];

const pages = {
  home: { id: 'home' },
  ticket: { id: 'ticket' },
};

function createApp({
  outcome = 'allow',
  pagesProtectedByDefault = false,
  user = { id: 'u1' },
} = {}) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      authEnforcement: { pagesProtectedByDefault },
      authorizeOutcome: () => outcome,
      logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
      readConfigFile: async (file) => {
        if (file === 'routes.json') return routes;
        return pages[file.slice('pages/'.length, -'.json'.length)] ?? null;
      },
      user,
    });
    await next();
  });
  app.get('/api/page/*', apiPageHandler);
  return app;
}

test('apiPageHandler returns pageId, pathParams and matchedPath for a patterned page', async () => {
  const res = await createApp().request('/api/page/support/tickets/1234');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({
    buildId: 'build-abc',
    pageId: 'ticket',
    pathParams: { space: 'support', ticket_id: '1234' },
    matchedPath: 'support/tickets/1234',
    pageConfig: { id: 'ticket' },
  });
});

test('apiPageHandler decodes an encoded "/" in a value once and keeps matchedPath encoded', async () => {
  const res = await createApp().request('/api/page/support/tickets/a%2Fb/');
  const body = await res.json();
  expect(body.pathParams).toEqual({ space: 'support', ticket_id: 'a/b' });
  expect(body.matchedPath).toEqual('support/tickets/a%2Fb');
});

test('apiPageHandler serves a page without path at its id', async () => {
  const res = await createApp().request('/api/page/home');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({
    buildId: 'build-abc',
    pageId: 'home',
    pathParams: {},
    matchedPath: 'home',
    pageConfig: { id: 'home' },
  });
});

test('apiPageHandler returns 404 when no page matches the path', async () => {
  const res = await createApp().request('/api/page/support/tickets');
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ pageConfig: null });
});

test('apiPageHandler returns a 401 sign-in redirect with the path and query when no page matches under pagesProtectedByDefault', async () => {
  const res = await createApp({ pagesProtectedByDefault: true, user: null }).request(
    '/api/page/support/tickets?tab=2'
  );
  expect(res.status).toEqual(401);
  expect(await res.json()).toEqual({
    redirect: `/auth/login?callbackUrl=${encodeURIComponent('/support/tickets?tab=2')}`,
  });
});

test('apiPageHandler unauthenticated redirect carries the request path and query on callbackUrl', async () => {
  const res = await createApp({ outcome: 'deny', user: null }).request(
    '/api/page/support/tickets/1234?tab=2'
  );
  expect(res.status).toEqual(401);
  expect(await res.json()).toEqual({
    redirect: `/auth/login?callbackUrl=${encodeURIComponent('/support/tickets/1234?tab=2')}`,
  });
});

test('apiPageHandler enrol_required redirect carries the request query on callbackUrl', async () => {
  const res = await createApp({ outcome: 'enrol_required' }).request('/api/page/home?id=123&tab=2');
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({
    redirect: `/two-factor-enrol?callbackUrl=${encodeURIComponent('/home?id=123&tab=2')}`,
  });
});

test('apiPageHandler enrol_required redirect is path-only when the request has no query', async () => {
  const res = await createApp({ outcome: 'enrol_required' }).request('/api/page/home');
  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({
    redirect: `/two-factor-enrol?callbackUrl=${encodeURIComponent('/home')}`,
  });
});

test('apiPageHandler returns 404 for a signed-in caller without access', async () => {
  const res = await createApp({ outcome: 'deny' }).request('/api/page/home');
  expect(res.status).toEqual(404);
});
