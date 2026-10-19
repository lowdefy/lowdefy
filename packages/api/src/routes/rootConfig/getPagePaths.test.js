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

import getPagePaths from './getPagePaths.js';
import testContext from '../../test/testContext.js';

const routes = [
  { pageId: 'home', path: 'home', auth: { public: true } },
  { pageId: 'users', path: 'admin/users', auth: { public: true } },
  { pageId: 'ticket', path: '{space}/tickets/{ticket_id}', auth: { public: true } },
  {
    pageId: 'admin-ticket',
    path: 'admin/tickets/{ticket_id}',
    auth: { public: false, roles: ['admin'] },
  },
  { pageId: 'account', path: 'me/account', auth: { public: false } },
];

function readConfigFile(path) {
  if (path === 'routes.json') return routes;
  return null;
}

test('getPagePaths lists every page with a path, with or without placeholders', async () => {
  const context = testContext({ readConfigFile });
  expect(await getPagePaths(context)).toEqual({
    users: 'admin/users',
    ticket: '{space}/tickets/{ticket_id}',
  });
});

test('getPagePaths omits a page without a path', async () => {
  const context = testContext({ readConfigFile });
  expect(Object.keys(await getPagePaths(context))).not.toContain('home');
});

test('getPagePaths omits a protected patterned page for a caller without its role', async () => {
  const context = testContext({ readConfigFile, user: { sub: 'sub', roles: ['staff'] } });
  expect(await getPagePaths(context)).toEqual({
    users: 'admin/users',
    ticket: '{space}/tickets/{ticket_id}',
    account: 'me/account',
  });
});

test('getPagePaths includes a protected patterned page for a caller with its role', async () => {
  const context = testContext({ readConfigFile, user: { sub: 'sub', roles: ['admin'] } });
  expect(await getPagePaths(context)).toEqual({
    users: 'admin/users',
    ticket: '{space}/tickets/{ticket_id}',
    'admin-ticket': 'admin/tickets/{ticket_id}',
    account: 'me/account',
  });
});

test('getPagePaths keeps a page an unenrolled caller is let into pending enrolment', async () => {
  const context = testContext({
    readConfigFile,
    authEnforcement: { twoFactorRequired: true, twoFactorEnrolPageId: 'enrol' },
    user: { sub: 'sub', roles: [], two_factor_enrolled: false },
  });
  expect(await getPagePaths(context)).toEqual({
    users: 'admin/users',
    ticket: '{space}/tickets/{ticket_id}',
    account: 'me/account',
  });
});
