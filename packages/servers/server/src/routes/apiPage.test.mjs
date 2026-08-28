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

const mockGetPageConfig = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  getPageConfig: mockGetPageConfig,
}));

jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: { authPages: { signIn: '/auth/login', twoFactorEnrol: '/two-factor-enrol' } },
}));

jest.unstable_mockModule('../../lib/build/config.js', () => ({
  default: { basePath: '' },
}));

const { default: apiPageHandler } = await import('./apiPage.js');

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
    });
    await next();
  });
  app.get('/api/page/*', apiPageHandler);
  return app;
}

afterEach(() => {
  mockGetPageConfig.mockReset();
});

test('apiPageHandler enrol_required redirect carries the request query on callbackUrl', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'enrol_required' });
  const res = await createApp().request('/api/page/invoices?id=123&tab=2');
  expect(res.status).toEqual(403);
  const body = await res.json();
  expect(body).toEqual({
    redirect: `/two-factor-enrol?callbackUrl=${encodeURIComponent('/invoices?id=123&tab=2')}`,
  });
});

test('apiPageHandler enrol_required redirect is path-only when the request has no query', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'enrol_required' });
  const res = await createApp().request('/api/page/invoices');
  expect(res.status).toEqual(403);
  const body = await res.json();
  expect(body).toEqual({
    redirect: `/two-factor-enrol?callbackUrl=${encodeURIComponent('/invoices')}`,
  });
});

test('apiPageHandler still returns a 401 sign-in redirect when unauthenticated', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'unauthenticated' });
  const res = await createApp().request('/api/page/invoices');
  expect(res.status).toEqual(401);
  const body = await res.json();
  expect(body).toEqual({
    redirect: `/auth/login?callbackUrl=${encodeURIComponent('/invoices')}`,
  });
});

test('apiPageHandler returns the pageConfig when status is ok', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'ok', pageConfig: { id: 'invoices' } });
  const res = await createApp().request('/api/page/invoices');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ pageConfig: { id: 'invoices' } });
});

test('apiPageHandler returns 404 when the page is not found', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'not_found' });
  const res = await createApp().request('/api/page/invoices');
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ pageConfig: null });
});
