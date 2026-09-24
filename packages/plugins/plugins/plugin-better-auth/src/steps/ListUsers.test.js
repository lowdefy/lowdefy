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

import { jest } from '@jest/globals';

import ListUsers from './ListUsers.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

test('ListUsers passes properties through as query with headers to the admin listUsers endpoint', async () => {
  const listUsers = jest.fn().mockResolvedValue({ users: [], total: 0 });
  const { auth } = createMockAuth({ adminEndpoints: { listUsers } });
  const result = await ListUsers({
    acting,
    auth,
    properties: {
      searchValue: 'ann',
      searchField: 'name',
      searchOperator: 'contains',
      limit: 10,
      offset: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      filterField: 'role',
      filterValue: 'admin',
      filterOperator: 'eq',
    },
  });
  expect(result).toEqual({ users: [], total: 0 });
  const input = listUsers.mock.calls[0][0];
  expect(input.query).toEqual({
    searchValue: 'ann',
    searchField: 'name',
    searchOperator: 'contains',
    limit: 10,
    offset: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    filterField: 'role',
    filterValue: 'admin',
    filterOperator: 'eq',
  });
  expect(input.headers).toBeInstanceOf(Headers);
});

test('ListUsers works with no properties set', async () => {
  const listUsers = jest.fn().mockResolvedValue({ users: [] });
  const { auth } = createMockAuth({ adminEndpoints: { listUsers } });
  await ListUsers({ acting, auth, properties: {} });
  expect(listUsers).toHaveBeenCalledTimes(1);
});
