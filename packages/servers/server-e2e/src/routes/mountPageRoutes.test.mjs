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
    basePath,
    renderPage: (c, { path: pagePath, matchedPath, status = 200 }) =>
      c.json({ path: pagePath, matchedPath }, status),
  });
  return app.request(path);
}

test.each([
  ['', '/', '', ''],
  ['/app', '/app', '', ''],
  ['/app', '/app/', '', ''],
  ['/app', '/app/invoices', 'invoices', 'invoices'],
  ['', '/support/tickets/1234/', 'support/tickets/1234/', 'support/tickets/1234'],
  ['', '/support/tickets/a%2Fb%20c', 'support/tickets/a%2Fb%20c', 'support/tickets/a%2Fb%20c'],
  ['/app', '/app/tickets//1', 'tickets//1', 'tickets//1'],
])(
  'with basePath "%s", %s renders path "%s" matched as "%s"',
  async (basePath, url, path, matchedPath) => {
    const res = await request({ basePath, path: url });
    expect(res.status).toEqual(200);
    expect(await res.json()).toEqual({ path, matchedPath });
  }
);

test.each([[''], ['/app']])(
  'with basePath "%s", /404 is a fixed route with status 404',
  async (basePath) => {
    const res = await request({ basePath, path: `${basePath}/404` });
    expect(res.status).toEqual(404);
    expect(await res.json()).toEqual({ path: '404', matchedPath: '404' });
  }
);
