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

import { vi, beforeEach, expect, test } from 'vitest';

import createMockAuth from '../../test/createMockAuth.js';

vi.doMock('better-auth/plugins', () => ({
  getOrgAdapter: vi.fn(),
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

const organizations = { policy: 'tenant', pinned: null, creatorAppRoles: [] };

beforeEach(() => {
  getOrgAdapter.mockReset();
});

function setup({ creatorAppRoles = [], existing = null, users = {} } = {}) {
  const orgAdapter = {
    createMember: vi.fn(async (data) => ({ id: 'member-1', ...data, createdAt: new Date() })),
    createOrganization: vi.fn(async ({ organization }) => ({ id: 'org-1', ...organization })),
    findOrganizationBySlug: vi.fn(async () => existing),
  };
  getOrgAdapter.mockReturnValue(orgAdapter);
  const { auth, authContext } = createMockAuth();
  authContext.internalAdapter = { findUserById: vi.fn(async (id) => users[id] ?? null) };
  return { auth, authContext, orgAdapter, organization: { ...organizations, creatorAppRoles } };
}

test('CreateOrganization writes the organization and its creator as owner, and returns the members', async () => {
  const { auth, authContext, orgAdapter, organization } = setup({
    users: { 'user-9': { id: 'user-9' } },
  });
  const result = await CreateOrganization({
    acting: systemCaller,
    auth,
    organization,
    properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
  });
  expect(getOrgAdapter).toHaveBeenCalledWith(authContext, {});
  const written = orgAdapter.createOrganization.mock.calls[0][0].organization;
  expect(written.name).toBe('Org One');
  expect(written.slug).toBe('org-one');
  expect(written.createdAt).toBeInstanceOf(Date);
  expect('userId' in written).toBe(false);
  expect(orgAdapter.createMember).toHaveBeenCalledWith({
    userId: 'user-9',
    organizationId: 'org-1',
    role: 'owner',
  });
  expect(result).toEqual(
    expect.objectContaining({
      id: 'org-1',
      members: [expect.objectContaining({ userId: 'user-9', role: 'owner' })],
    })
  );
});

test('CreateOrganization defaults the creator to the acting caller', async () => {
  const { auth, orgAdapter, organization } = setup({ users: { 'user-1': { id: 'user-1' } } });
  await CreateOrganization({
    acting: sessionCaller,
    auth,
    organization,
    properties: { name: 'Org One', slug: 'org-one' },
  });
  expect(orgAdapter.createMember.mock.calls[0][0].userId).toBe('user-1');
});

test('CreateOrganization writes creatorAppRoles on the owner row in the same write', async () => {
  const { auth, orgAdapter, organization } = setup({
    creatorAppRoles: ['workspace-admin', 'billing'],
    users: { 'user-9': { id: 'user-9' } },
  });
  await CreateOrganization({
    acting: systemCaller,
    auth,
    organization,
    properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
  });
  expect(orgAdapter.createMember).toHaveBeenCalledTimes(1);
  const memberData = orgAdapter.createMember.mock.calls[0][0];
  expect(memberData.appRoles).toEqual(['workspace-admin', 'billing']);
  // A copy, so the configured list is never shared with a step result.
  expect(memberData.appRoles).not.toBe(organization.creatorAppRoles);
});

test('CreateOrganization leaves the owner row without an appRoles field when creatorAppRoles is empty', async () => {
  const { auth, orgAdapter, organization } = setup({ users: { 'user-9': { id: 'user-9' } } });
  await CreateOrganization({
    acting: systemCaller,
    auth,
    organization,
    properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
  });
  expect('appRoles' in orgAdapter.createMember.mock.calls[0][0]).toBe(false);
});

test('CreateOrganization throws and writes nothing when the creator is not a user', async () => {
  const { auth, orgAdapter, organization } = setup();
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      organization,
      properties: { name: 'Org One', slug: 'org-one', userId: 'user-404' },
    })
  ).rejects.toThrow('CreateOrganization creator "user-404" is not a user.');
  expect(orgAdapter.createOrganization).not.toHaveBeenCalled();
});

test('CreateOrganization throws and writes nothing when the slug is taken', async () => {
  const { auth, orgAdapter, organization } = setup({
    existing: { id: 'org-0', slug: 'org-one' },
    users: { 'user-9': { id: 'user-9' } },
  });
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      organization,
      properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
    })
  ).rejects.toThrow(
    'CreateOrganization refused - an organization with slug "org-one" already exists.'
  );
  expect(orgAdapter.createOrganization).not.toHaveBeenCalled();
  expect(orgAdapter.createMember).not.toHaveBeenCalled();
});

test('CreateOrganization surfaces the unique-index error when a create races the slug check', async () => {
  const { auth, orgAdapter, organization } = setup();
  orgAdapter.createOrganization.mockRejectedValue(new Error('E11000 duplicate key error: slug'));
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      organization,
      properties: { name: 'Org One', slug: 'org-one' },
    })
  ).rejects.toThrow('E11000 duplicate key error: slug');
});

test('CreateOrganization creator-less writes the organization and mints no member', async () => {
  const { auth, authContext, orgAdapter, organization } = setup({
    creatorAppRoles: ['workspace-admin'],
  });
  const result = await CreateOrganization({
    acting: systemCaller,
    auth,
    organization,
    properties: { name: 'Org One', slug: 'org-one' },
  });
  expect(result).toEqual(expect.objectContaining({ id: 'org-1', name: 'Org One' }));
  expect('members' in result).toBe(false);
  expect(authContext.internalAdapter.findUserById).not.toHaveBeenCalled();
  expect(orgAdapter.createMember).not.toHaveBeenCalled();
});

test('CreateOrganization forwards a caller id and metadata to the adapter', async () => {
  const { auth, orgAdapter, organization } = setup();
  await CreateOrganization({
    acting: systemCaller,
    auth,
    organization,
    properties: {
      id: 'chosen-id',
      name: 'Org One',
      slug: 'org-one',
      metadata: { tier: 'gold' },
    },
  });
  const written = orgAdapter.createOrganization.mock.calls[0][0].organization;
  expect(written.id).toBe('chosen-id');
  expect(written.metadata).toEqual({ tier: 'gold' });
});

test('CreateOrganization throws naming the required fields when name is missing', async () => {
  const { auth, orgAdapter, organization } = setup();
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      organization,
      properties: { slug: 'org-one' },
    })
  ).rejects.toThrow('CreateOrganization requires "name" and "slug".');
  expect(orgAdapter.createOrganization).not.toHaveBeenCalled();
});

test('CreateOrganization throws naming the required fields when slug is missing', async () => {
  const { auth, orgAdapter, organization } = setup({ users: { 'user-9': { id: 'user-9' } } });
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      organization,
      properties: { name: 'Org One', userId: 'user-9' },
    })
  ).rejects.toThrow('CreateOrganization requires "name" and "slug".');
  expect(orgAdapter.createOrganization).not.toHaveBeenCalled();
});

test('CreateOrganization invokes the org plugin afterCreateOrganization hook with the endpoint payload shape', async () => {
  const user = { id: 'user-9' };
  const { auth, organization } = setup({ users: { 'user-9': user } });
  const afterCreateOrganization = vi.fn();
  auth.options.plugins.find((plugin) => plugin.id === 'organization').options.organizationHooks = {
    afterCreateOrganization,
  };
  await CreateOrganization({
    acting: systemCaller,
    auth,
    organization,
    properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
  });
  expect(afterCreateOrganization).toHaveBeenCalledWith({
    organization: expect.objectContaining({ id: 'org-1' }),
    member: expect.objectContaining({ userId: 'user-9', role: 'owner' }),
    user,
  });
});

test('CreateOrganization creator-less passes a null member and user to the afterCreateOrganization hook', async () => {
  const { auth, organization } = setup();
  const afterCreateOrganization = vi.fn();
  auth.options.plugins.find((plugin) => plugin.id === 'organization').options.organizationHooks = {
    afterCreateOrganization,
  };
  await CreateOrganization({
    acting: systemCaller,
    auth,
    organization,
    properties: { name: 'Org One', slug: 'org-one' },
  });
  expect(afterCreateOrganization).toHaveBeenCalledWith({
    organization: expect.objectContaining({ id: 'org-1' }),
    member: null,
    user: null,
  });
});

test('CreateOrganization surfaces an afterCreateOrganization hook failure', async () => {
  const { auth, organization } = setup();
  auth.options.plugins.find((plugin) => plugin.id === 'organization').options.organizationHooks = {
    afterCreateOrganization: vi.fn().mockRejectedValue(new Error('hook failed')),
  };
  await expect(
    CreateOrganization({
      acting: systemCaller,
      auth,
      organization,
      properties: { name: 'Org One', slug: 'org-one' },
    })
  ).rejects.toThrow('hook failed');
});
