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

import { vi, expect, test } from 'vitest';

import createMockAuth from '../../test/createMockAuth.js';
import CreateOrganization from './CreateOrganization.js';

const provisioned = {
  organization: { id: 'org-1', name: 'Org One', slug: 'org-one', createdAt: new Date() },
  member: null,
};

function setup({ result = provisioned, users = {} } = {}) {
  const { auth, authContext } = createMockAuth();
  authContext.internalAdapter = { findUserById: vi.fn(async (id) => users[id] ?? null) };
  const provisionOrganization = vi.fn(async () => result);
  return { auth, authContext, provisionOrganization };
}

test('CreateOrganization provisions the organization with its creator and returns the owner under members', async () => {
  const member = { id: 'member-1', userId: 'user-9', organizationId: 'org-1', role: 'owner' };
  const { auth, provisionOrganization } = setup({
    result: { ...provisioned, member },
    users: { 'user-9': { id: 'user-9' } },
  });
  const result = await CreateOrganization({
    auth,
    properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
    provisionOrganization,
  });
  expect(provisionOrganization).toHaveBeenCalledWith({
    organization: { name: 'Org One', slug: 'org-one' },
    userId: 'user-9',
  });
  expect(result).toEqual({ ...provisioned.organization, members: [member] });
});

test('CreateOrganization creator-less provisions with no userId and returns the organization alone', async () => {
  const { auth, authContext, provisionOrganization } = setup();
  const result = await CreateOrganization({
    auth,
    properties: { name: 'Org One', slug: 'org-one' },
    provisionOrganization,
  });
  expect(provisionOrganization).toHaveBeenCalledWith({
    organization: { name: 'Org One', slug: 'org-one' },
    userId: undefined,
  });
  expect(authContext.internalAdapter.findUserById).not.toHaveBeenCalled();
  expect(result).toEqual(provisioned.organization);
});

test('CreateOrganization passes logo and metadata through to the organization row', async () => {
  const { auth, provisionOrganization } = setup();
  await CreateOrganization({
    auth,
    properties: { name: 'Org One', slug: 'org-one', logo: 'logo.png', metadata: { tier: 'gold' } },
    provisionOrganization,
  });
  expect(provisionOrganization.mock.calls[0][0].organization).toEqual({
    name: 'Org One',
    slug: 'org-one',
    logo: 'logo.png',
    metadata: { tier: 'gold' },
  });
});

test('CreateOrganization throws and provisions nothing when the creator is not a user', async () => {
  const { auth, provisionOrganization } = setup();
  await expect(
    CreateOrganization({
      auth,
      properties: { name: 'Org One', slug: 'org-one', userId: 'user-404' },
      provisionOrganization,
    })
  ).rejects.toThrow('CreateOrganization creator "user-404" is not a user.');
  expect(provisionOrganization).not.toHaveBeenCalled();
});

test('CreateOrganization throws when the slug belongs to another organization', async () => {
  const { auth, provisionOrganization } = setup({
    result: null,
    users: { 'user-9': { id: 'user-9' } },
  });
  await expect(
    CreateOrganization({
      auth,
      properties: { name: 'Org One', slug: 'org-one', userId: 'user-9' },
      provisionOrganization,
    })
  ).rejects.toThrow(
    'CreateOrganization refused - an organization with slug "org-one" already exists.'
  );
});

test('CreateOrganization surfaces a provisioning failure', async () => {
  const { auth, provisionOrganization } = setup();
  provisionOrganization.mockRejectedValue(new Error('index missing'));
  await expect(
    CreateOrganization({
      auth,
      properties: { name: 'Org One', slug: 'org-one' },
      provisionOrganization,
    })
  ).rejects.toThrow('index missing');
});

test('CreateOrganization ignores a null optional property', async () => {
  const { auth, provisionOrganization } = setup();
  await CreateOrganization({
    auth,
    properties: { name: 'Org One', slug: 'org-one', logo: null, userId: null },
    provisionOrganization,
  });
  expect(provisionOrganization).toHaveBeenCalledWith({
    organization: { name: 'Org One', slug: 'org-one' },
    userId: null,
  });
});

test.each([
  [
    'an endpoint option',
    { name: 'Org One', slug: 'org-one', keepCurrentActiveOrganization: true },
    'CreateOrganization does not take "keepCurrentActiveOrganization". It takes "name", "slug", "logo", "metadata" and "userId".',
  ],
  [
    'server-only fields',
    { name: 'Org One', slug: 'org-one', id: 'chosen-id', mintPending: true },
    'CreateOrganization does not take "id", "mintPending". It takes "name", "slug", "logo", "metadata" and "userId".',
  ],
  ['a missing name', { slug: 'org-one' }, 'CreateOrganization requires a "name" string property.'],
  [
    'a number name',
    { name: 123, slug: 'org-one' },
    'CreateOrganization requires a "name" string property.',
  ],
  [
    'a missing slug',
    { name: 'Org One', userId: 'user-9' },
    'CreateOrganization requires a "slug" string property.',
  ],
  [
    'an empty slug',
    { name: 'Org One', slug: '' },
    'CreateOrganization requires a "slug" string property.',
  ],
  [
    'a number logo',
    { name: 'Org One', slug: 'org-one', logo: 7 },
    'CreateOrganization requires a "logo" string property.',
  ],
  [
    'a string metadata',
    { name: 'Org One', slug: 'org-one', metadata: '{"tier":"gold"}' },
    'CreateOrganization requires a "metadata" object property.',
  ],
  [
    'a number userId',
    { name: 'Org One', slug: 'org-one', userId: 9 },
    'CreateOrganization requires "userId" to be a user id string.',
  ],
])('CreateOrganization refuses %s and provisions nothing', async (_label, properties, message) => {
  const { auth, authContext, provisionOrganization } = setup({
    users: { 'user-9': { id: 'user-9' } },
  });
  await expect(CreateOrganization({ auth, properties, provisionOrganization })).rejects.toThrow(
    message
  );
  expect(authContext.internalAdapter.findUserById).not.toHaveBeenCalled();
  expect(provisionOrganization).not.toHaveBeenCalled();
});
