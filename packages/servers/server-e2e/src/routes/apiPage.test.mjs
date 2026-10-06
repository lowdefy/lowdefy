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
