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

import CreateOrganization from './CreateOrganization.js';
import createMockAuth from '../../test/createMockAuth.js';

const sessionCaller = {
  system: false,
  user: {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
    image: null,
    email_verified: true,
    active_organization_id: null,
  },
};

const systemCaller = { system: true, user: null };

test('CreateOrganization invokes the endpoint as a system action with no session and no headers', async () => {
  const createOrganization = jest.fn().mockResolvedValue({ id: 'org-1', name: 'Org One' });
  const { auth } = createMockAuth({ organizationEndpoints: { createOrganization } });
  const result = await CreateOrganization({
    acting: systemCaller,
    auth,
    properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
  });
  expect(result).toEqual({ id: 'org-1', name: 'Org One' });
  const input = createOrganization.mock.calls[0][0];
  expect(input.body).toEqual({ name: 'Org One', slug: 'org-one', userId: 'user-9' });
  // A system action must present NO session and NO headers key at all - the
  // endpoint 401s any headers-bearing call without a session.
  expect('headers' in input).toBe(false);
  expect(input.context.session).toBe(undefined);
});

test('CreateOrganization defaults body.userId to the acting caller id', async () => {
  const createOrganization = jest.fn().mockResolvedValue({ id: 'org-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createOrganization } });
  await CreateOrganization({
    acting: sessionCaller,
    auth,
    properties: { name: 'Org One', slug: 'org-one' },
  });
  expect(createOrganization.mock.calls[0][0].body).toEqual({
    name: 'Org One',
    slug: 'org-one',
    userId: 'user-1',
  });
});

test('CreateOrganization requires userId when run by the system', async () => {
  const { auth } = createMockAuth();
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      properties: { name: 'Org One', slug: 'org-one' },
    })
  ).rejects.toThrow('CreateOrganization requires a "userId" property when run by the system.');
});

test('CreateOrganization rethrows APIError-shaped failures with the rail message', async () => {
  const apiError = new Error('generic');
  apiError.status = 'BAD_REQUEST';
  apiError.body = { code: 'ORGANIZATION_ALREADY_EXISTS', message: 'Organization already exists' };
  const createOrganization = jest.fn().mockRejectedValue(apiError);
  const { auth } = createMockAuth({ organizationEndpoints: { createOrganization } });
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
    })
  ).rejects.toThrow('Organization already exists');
});
