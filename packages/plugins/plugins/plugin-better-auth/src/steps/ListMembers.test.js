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

import ListMembers from './ListMembers.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };

test('ListMembers passes properties through as query with headers to the org listMembers endpoint', async () => {
  const listMembers = jest.fn().mockResolvedValue({ members: [], total: 0 });
  const { auth } = createMockAuth({ organizationEndpoints: { listMembers } });
  const result = await ListMembers({
    acting,
    auth,
    organizationId: 'org-1',
    properties: {
      limit: 5,
      offset: 0,
      sortBy: 'createdAt',
      sortDirection: 'asc',
      filterField: 'role',
      filterValue: 'member',
      filterOperator: 'eq',
    },
  });
  expect(result).toEqual({ members: [], total: 0 });
  const input = listMembers.mock.calls[0][0];
  expect(input.query).toEqual({
    organizationId: 'org-1',
    limit: 5,
    offset: 0,
    sortBy: 'createdAt',
    sortDirection: 'asc',
    filterField: 'role',
    filterValue: 'member',
    filterOperator: 'eq',
  });
  expect(input.headers).toBeInstanceOf(Headers);
});

test('ListMembers lists the organizationId the floor resolved and forwards no slug', async () => {
  const listMembers = jest.fn().mockResolvedValue({ members: [] });
  const { auth } = createMockAuth({ organizationEndpoints: { listMembers } });
  await ListMembers({
    acting: {
      system: false,
      user: {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        image: null,
        email_verified: true,
        active_organization_id: 'org-1',
      },
    },
    auth,
    organizationId: 'org-slug-resolved',
    // The floor resolved this slug to an id already - forwarding it too would
    // let the endpoint read a different organization from the authorized one.
    properties: { organizationSlug: 'org-one' },
  });
  const input = listMembers.mock.calls[0][0];
  expect(input.query.organizationId).toBe('org-slug-resolved');
  expect('organizationSlug' in input.query).toBe(false);
  // The org handler falls back to session.session.activeOrganizationId.
  expect(input.context.session.session.activeOrganizationId).toEqual('org-1');
});
