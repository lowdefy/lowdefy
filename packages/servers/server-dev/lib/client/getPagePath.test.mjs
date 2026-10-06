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

import getPagePath from './getPagePath.js';

const rootConfig = {
  home: { configured: true, pageId: 'users', pathParams: {} },
  pagePaths: { users: 'admin/users' },
};

test('getPagePath fetches a non-root path as it is', () => {
  expect(getPagePath({ path: 'tickets/a%2Bb/1' }, rootConfig)).toEqual({
    redirect: false,
    path: 'tickets/a%2Bb/1',
  });
});

test('getPagePath fetches the configured home page at its own path from the root', () => {
  expect(getPagePath({ path: '' }, rootConfig)).toEqual({ redirect: false, path: 'admin/users' });
});

test('getPagePath redirects the root to the first menu link, built with its path values', () => {
  expect(
    getPagePath(
      { path: '' },
      {
        home: { configured: false, pageId: 'ticket', pathParams: { space: 'support', id: '1' } },
        pagePaths: { ticket: 'tickets/{space}/{id}' },
      }
    )
  ).toEqual({ redirect: true, path: 'tickets/support/1' });
});

test('getPagePath reads a home page without a path at its id', () => {
  expect(
    getPagePath({ path: '' }, { home: { configured: false, pageId: 'home' }, pagePaths: {} })
  ).toEqual({ redirect: true, path: 'home' });
});
