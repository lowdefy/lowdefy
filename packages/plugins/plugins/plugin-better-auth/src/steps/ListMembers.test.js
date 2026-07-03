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
const organization = { policy: 'pinned', pinned: { id: 'org_pinned', slug: 'org-a', name: 'org-a' } };

test('ListMembers passes properties through as query with headers to the org listMembers endpoint', async () => {
  const listMembers = jest.fn().mockResolvedValue({ members: [], total: 0 });
  const { auth } = createMockAuth({ organizationEndpoints: { listMembers } });
  const result = await ListMembers({
    acting,
    auth,
    organization,
    properties: {
      organizationId: 'org-1',
      organizationSlug: 'org-one',
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
    organizationSlug: 'org-one',
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

test('ListMembers does not default organizationId when organizationSlug is present', async () => {
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
        emailVerified: true,
        activeOrganizationId: 'org-1',
      },
    },
    auth,
    organization,
    properties: { organizationSlug: 'org-one' },
  });
  const input = listMembers.mock.calls[0][0];
  // An explicit organizationSlug is an explicit org selection - it is not
  // overridden by the pinned organization default.
  expect(input.query.organizationId).toBe(undefined);
  expect(input.query.organizationSlug).toBe('org-one');
  // The org handler falls back to session.session.activeOrganizationId.
  expect(input.context.session.session.activeOrganizationId).toEqual('org-1');
});

test('ListMembers defaults organizationId to the pinned organization when both organizationId and organizationSlug are omitted', async () => {
  const listMembers = jest.fn().mockResolvedValue({ members: [] });
  const { auth } = createMockAuth({ organizationEndpoints: { listMembers } });
  await ListMembers({ acting, auth, organization, properties: {} });
  const input = listMembers.mock.calls[0][0];
  expect(input.query.organizationId).toBe('org_pinned');
  expect(input.query.organizationSlug).toBe(undefined);
});

test('ListMembers throws under the tenant organizations policy when organizationId and organizationSlug are omitted', async () => {
  const { auth } = createMockAuth();
  await expect(
    ListMembers({
      acting,
      auth,
      organization: { policy: 'tenant', pinned: null },
      properties: {},
    })
  ).rejects.toThrow(
    'ListMembers requires an "organizationId" property under the "tenant" organizations policy - there is no pinned organization to default to. Set organizationId on the step properties.'
  );
});
