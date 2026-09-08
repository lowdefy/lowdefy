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

jest.unstable_mockModule('../../lib/build/appMeta.js', () => ({
  default: { buildId: 'build-abc' },
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

test('apiPageHandler returns the pageConfig stamped with the build id', async () => {
  mockGetPageConfig.mockResolvedValue({ id: 'invoices' });
  const res = await createApp().request('/api/page/invoices');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ buildId: 'build-abc', pageConfig: { id: 'invoices' } });
});

test('apiPageHandler returns 404 when the page is not found', async () => {
  mockGetPageConfig.mockResolvedValue(null);
  const res = await createApp().request('/api/page/missing');
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ pageConfig: null });
});
