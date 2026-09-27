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

import mountDevPageRoutes from './mountDevPageRoutes.js';

test.each([
  ['', '/'],
  ['', '/invoices'],
  ['/app', '/app'],
  ['/app', '/app/'],
  ['/app', '/app/invoices'],
])('with basePath "%s", %s renders the dev shell', async (basePath, path) => {
  const app = basePath === '' ? new Hono() : new Hono().basePath(basePath);
  mountDevPageRoutes({ app, renderPage: (c) => c.text('shell') });
  const res = await app.request(path);
  expect(await res.text()).toEqual('shell');
});
