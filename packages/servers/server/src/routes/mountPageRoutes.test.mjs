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

import mountPageRoutes from './mountPageRoutes.js';

function request({ basePath, path }) {
  const app = basePath === '' ? new Hono() : new Hono().basePath(basePath);
  mountPageRoutes({
    app,
    renderPage: (c, { pageId, status = 200 }) => c.json({ pageId }, status),
  });
  return app.request(path);
}

test.each([
  ['', '/', ''],
  ['', '/invoices', 'invoices'],
  ['', '/404', '404'],
  ['/app', '/app', ''],
  ['/app', '/app/', ''],
  ['/app', '/app/invoices', 'invoices'],
  ['/app', '/app/404', '404'],
])('with basePath "%s", %s renders page "%s"', async (basePath, path, pageId) => {
  const res = await request({ basePath, path });
  expect(await res.json()).toEqual({ pageId });
});

test('a path outside the basePath is not a page', async () => {
  const res = await request({ basePath: '/app', path: '/other' });
  expect(res.status).toEqual(404);
});
