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

// No JIT build work in these tests — the route's build branch is exercised
// elsewhere; here we only drive the getPageConfig status fork.
const mockGetPageJitEnrichment = jest.fn(() => ({}));
jest.unstable_mockModule('../../lib/server/jitPageBuilder.js', () => ({
  default: jest.fn(async () => undefined),
  getPageJitEnrichment: mockGetPageJitEnrichment,
}));

jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: { authPages: { signIn: '/auth/login', twoFactorEnrol: '/two-factor-enrol' } },
}));

jest.unstable_mockModule('../../lib/build/config.js', () => ({
  default: { basePath: '' },
}));

const { default: jitPageHandler } = await import('./jitPage.js');

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      buildDirectory: '/build',
      configDirectory: '/config',
      logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
      handleError: jest.fn(),
    });
    await next();
  });
  app.all('/api/page/*', jitPageHandler);
  return app;
}

afterEach(() => {
  mockGetPageConfig.mockReset();
});

test('jitPageHandler redirects to the two-factor enrolment page with a 403 when enrol_required', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'enrol_required' });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(403);
  const body = await res.json();
  expect(body).toEqual({ redirect: '/two-factor-enrol?callbackUrl=%2Fdashboard' });
});

test('jitPageHandler still returns a 401 sign-in redirect when unauthenticated', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'unauthenticated' });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(401);
  const body = await res.json();
  expect(body).toEqual({ redirect: '/auth/login?callbackUrl=%2Fdashboard' });
});

test('jitPageHandler still returns a 404 when the page is not found', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'not_found' });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(404);
  expect(await res.text()).toEqual('Page not found.');
});

test('jitPageHandler returns the pageConfig when status is ok', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'ok', pageConfig: { id: 'dashboard' } });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body).toEqual({ id: 'dashboard' });
});

test('jitPageHandler folds _jsEntries and _dynamicIcons onto the ok response', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'ok', pageConfig: { id: 'dashboard' } });
  mockGetPageJitEnrichment.mockReturnValueOnce({
    jsEntries: 'export default {};',
    dynamicIcons: { FiZap: { tag: 'svg' } },
  });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body).toEqual({
    id: 'dashboard',
    _jsEntries: 'export default {};',
    _dynamicIcons: { FiZap: { tag: 'svg' } },
  });
});
