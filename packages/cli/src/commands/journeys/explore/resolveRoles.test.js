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

import resolveRoles from './resolveRoles.js';

const dataSet = {
  users: {
    owner: { id: 'u1', roles: ['admin'] },
    member: { id: 'u2', roles: ['member'] },
    second_member: { id: 'u3', roles: ['member'] },
    support: { id: 'u4', roles: ['support', 'member'] },
  },
};

test('with a role matrix, the page role sets by sessions, each as the first user with those roles', () => {
  const coverage = {
    production: {
      roleMatrix: [
        { page: 'tickets', roles: ['admin'], sessions: 3 },
        { page: 'tickets', roles: ['member'], sessions: 40 },
        { page: 'tickets', roles: ['billing'], sessions: 2 },
        { page: 'settings', roles: ['admin'], sessions: 9 },
      ],
    },
  };
  expect(resolveRoles({ pageId: 'tickets', coverage, dataSet })).toEqual({
    targets: [
      { pageId: 'tickets', user: 'member', roles: ['member'], matrixListed: true },
      { pageId: 'tickets', user: 'owner', roles: ['admin'], matrixListed: true },
    ],
    notRun: [
      { pageId: 'tickets', roles: ['billing'], reason: 'no data set user has roles [billing]' },
    ],
  });
});

test('without a matrix, one target per distinct role set among the users, in file order', () => {
  expect(resolveRoles({ pageId: 'tickets', coverage: null, dataSet }).targets).toEqual([
    { pageId: 'tickets', user: 'owner', roles: ['admin'], matrixListed: false },
    { pageId: 'tickets', user: 'member', roles: ['member'], matrixListed: false },
    { pageId: 'tickets', user: 'support', roles: ['member', 'support'], matrixListed: false },
  ]);
});

test('a data set with no users, or no data set, walks as the default headless user', () => {
  expect(resolveRoles({ pageId: 'tickets', coverage: null, dataSet: { users: {} } })).toEqual({
    targets: [{ pageId: 'tickets', user: null, roles: [], matrixListed: false }],
    notRun: [],
  });
  expect(resolveRoles({ pageId: 'tickets', coverage: null, dataSet: null }).targets).toHaveLength(
    1
  );
});

test('--role keeps only the named data set users', () => {
  expect(
    resolveRoles({ pageId: 'tickets', coverage: null, dataSet, onlyUsers: ['support'] }).targets
  ).toEqual([
    { pageId: 'tickets', user: 'support', roles: ['member', 'support'], matrixListed: false },
  ]);
});
