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

import getShownPage from './getShownPage.js';

const pageConfig = { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}' };

test('getShownPage keeps the path the server matched', () => {
  expect(
    getShownPage({
      path: 'tickets/a%2Bb/1',
      response: {
        pageId: 'ticket',
        pathParams: { space: 'a+b', ticket_id: '1' },
        matchedPath: 'tickets/a%2Bb/1',
        pageConfig,
      },
    })
  ).toEqual({
    matchedPath: 'tickets/a%2Bb/1',
    pageConfig,
    pathParams: { space: 'a+b', ticket_id: '1' },
  });
});

test('getShownPage matches the home page fetched for the app root on the root', () => {
  const homeConfig = { pageId: 'users', path: 'admin/users' };
  expect(
    getShownPage({
      path: '',
      response: {
        pageId: 'users',
        pathParams: {},
        matchedPath: 'admin/users',
        pageConfig: homeConfig,
      },
    })
  ).toEqual({ matchedPath: '', pageConfig: homeConfig, pathParams: {} });
});
