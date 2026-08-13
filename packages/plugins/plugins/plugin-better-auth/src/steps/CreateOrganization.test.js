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

import createMockAuth from '../../test/createMockAuth.js';

jest.unstable_mockModule('better-auth/plugins', () => ({
  getOrgAdapter: jest.fn(),
}));

const { getOrgAdapter } = await import('better-auth/plugins');
const { default: CreateOrganization } = await import('./CreateOrganization.js');

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

beforeEach(() => {
  getOrgAdapter.mockReset();
});

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
  // A resolvable creator takes the endpoint path, never the adapter-direct write.
  expect(getOrgAdapter).not.toHaveBeenCalled();
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
  expect(getOrgAdapter).not.toHaveBeenCalled();
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

test('CreateOrganization writes the organization row adapter-direct and mints no member when creator-less', async () => {
  const createOrganization = jest
    .fn()
    .mockResolvedValue({ id: 'org-1', name: 'Org One', slug: 'org-one' });
  const createMember = jest.fn();
  getOrgAdapter.mockReturnValue({ createOrganization, createMember });
  const { auth, authContext } = createMockAuth();
  const result = await CreateOrganization({
    acting: systemCaller,
    auth,
    properties: { name: 'Org One', slug: 'org-one' },
  });
  expect(result).toEqual({ id: 'org-1', name: 'Org One', slug: 'org-one' });
  // The adapter is obtained from the resolved auth context and the org plugin options.
  expect(getOrgAdapter).toHaveBeenCalledWith(authContext, {});
  expect(createOrganization).toHaveBeenCalledTimes(1);
  const { organization } = createOrganization.mock.calls[0][0];
  expect(organization.name).toBe('Org One');
  expect(organization.slug).toBe('org-one');
  expect(organization.createdAt).toBeInstanceOf(Date);
  // No userId reaches the adapter, and no member row is minted.
  expect('userId' in organization).toBe(false);
  expect(createMember).not.toHaveBeenCalled();
});

test('CreateOrganization creator-less forwards a caller id and metadata to the adapter', async () => {
  const createOrganization = jest.fn().mockResolvedValue({ id: 'chosen-id' });
  getOrgAdapter.mockReturnValue({ createOrganization });
  const { auth } = createMockAuth();
  const result = await CreateOrganization({
    acting: systemCaller,
    auth,
    properties: {
      id: 'chosen-id',
      name: 'Org One',
      slug: 'org-one',
      metadata: { tier: 'gold' },
    },
  });
  expect(result).toEqual({ id: 'chosen-id' });
  const { organization } = createOrganization.mock.calls[0][0];
  expect(organization.id).toBe('chosen-id');
  expect(organization.metadata).toEqual({ tier: 'gold' });
  expect(organization.name).toBe('Org One');
  expect(organization.slug).toBe('org-one');
});

test('CreateOrganization creator-less throws naming the required fields when name is missing', async () => {
  const createOrganization = jest.fn();
  getOrgAdapter.mockReturnValue({ createOrganization });
  const { auth } = createMockAuth();
  await expect(
    CreateOrganization({ acting: systemCaller, auth, properties: { slug: 'org-one' } })
  ).rejects.toThrow(
    'CreateOrganization requires "name" and "slug" when run without a userId (creator-less provisioning).'
  );
  expect(createOrganization).not.toHaveBeenCalled();
});

test('CreateOrganization creator-less throws naming the required fields when slug is missing', async () => {
  const createOrganization = jest.fn();
  getOrgAdapter.mockReturnValue({ createOrganization });
  const { auth } = createMockAuth();
  await expect(
    CreateOrganization({ acting: systemCaller, auth, properties: { name: 'Org One' } })
  ).rejects.toThrow(
    'CreateOrganization requires "name" and "slug" when run without a userId (creator-less provisioning).'
  );
  expect(createOrganization).not.toHaveBeenCalled();
});

test('CreateOrganization creator-less surfaces the unique-index error on a duplicate slug', async () => {
  const createOrganization = jest
    .fn()
    .mockRejectedValue(new Error('E11000 duplicate key error: slug'));
  getOrgAdapter.mockReturnValue({ createOrganization });
  const { auth } = createMockAuth();
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      properties: { name: 'Org One', slug: 'org-one' },
    })
  ).rejects.toThrow('E11000 duplicate key error: slug');
});
