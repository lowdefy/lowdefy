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

import UpdateOrganization from './UpdateOrganization.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = {
  system: false,
  user: {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
    image: null,
    emailVerified: true,
    activeOrganizationId: 'org-1',
    role: 'admin',
  },
};
// The step floor resolves the target organization and passes the id in; the
// defaulting and tenant-policy rules are tested there, not here.
const organizationId = 'org-1';

test('UpdateOrganization calls updateOrganization with the name nested under data', async () => {
  const updateOrganization = jest.fn().mockResolvedValue({ id: 'org-1', name: 'Acme Inc' });
  const { auth } = createMockAuth({ organizationEndpoints: { updateOrganization } });
  const result = await UpdateOrganization({
    acting,
    auth,
    organizationId,
    properties: { name: 'Acme Inc' },
  });
  expect(result).toEqual({ id: 'org-1', name: 'Acme Inc' });
  expect(updateOrganization.mock.calls[0][0].body).toEqual({
    data: { name: 'Acme Inc' },
    organizationId: 'org-1',
  });
});

test('UpdateOrganization passes logo and metadata through under data', async () => {
  const updateOrganization = jest.fn().mockResolvedValue({ id: 'org-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { updateOrganization } });
  await UpdateOrganization({
    acting,
    auth,
    organizationId,
    properties: {
      logo: 'https://cdn.example.com/logo.png',
      metadata: { tier: 'enterprise' },
      name: 'Acme Inc',
    },
  });
  expect(updateOrganization.mock.calls[0][0].body).toEqual({
    data: {
      logo: 'https://cdn.example.com/logo.png',
      metadata: { tier: 'enterprise' },
      name: 'Acme Inc',
    },
    organizationId: 'org-1',
  });
});

test('UpdateOrganization sends only the fields the caller named', async () => {
  const updateOrganization = jest.fn().mockResolvedValue({ id: 'org-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { updateOrganization } });
  await UpdateOrganization({
    acting,
    auth,
    organizationId,
    properties: { metadata: { tier: 'free' } },
  });
  // An omitted key must stay out of data - the endpoint applies whatever data
  // carries, so a key sent as undefined would clear a field nobody asked to
  // change.
  expect(updateOrganization.mock.calls[0][0].body.data).toEqual({ metadata: { tier: 'free' } });
});

test('UpdateOrganization scopes the write to the organizationId passed by the floor', async () => {
  const updateOrganization = jest.fn().mockResolvedValue({ id: 'org-explicit' });
  const { auth } = createMockAuth({ organizationEndpoints: { updateOrganization } });
  await UpdateOrganization({
    acting,
    auth,
    organizationId: 'org-explicit',
    properties: { name: 'Acme Inc' },
  });
  expect(updateOrganization.mock.calls[0][0].body.organizationId).toBe('org-explicit');
});

test('UpdateOrganization carries the real caller so the endpoint own member check runs', async () => {
  const updateOrganization = jest.fn().mockResolvedValue({ id: 'org-1' });
  const { auth, authContext } = createMockAuth({
    adapter: { findOne: jest.fn() },
    organizationEndpoints: { updateOrganization },
  });
  await UpdateOrganization({ acting, auth, organizationId, properties: { name: 'Acme Inc' } });
  const { context } = updateOrganization.mock.calls[0][0];
  expect(context.session.user.id).toEqual('user-1');
  expect(context.session.user.role).toEqual('admin');
  // The real adapter, so the endpoint resolves the caller's real member row
  // rather than a fabricated one.
  expect(context.adapter).toBe(authContext.adapter);
});

test('UpdateOrganization throws when none of name, logo or metadata are given', async () => {
  const updateOrganization = jest.fn();
  const { auth } = createMockAuth({ organizationEndpoints: { updateOrganization } });
  await expect(
    UpdateOrganization({ acting, auth, organizationId, properties: {} })
  ).rejects.toThrow(
    'UpdateOrganization requires at least one of the "name", "logo" or "metadata" properties.'
  );
  expect(updateOrganization).not.toHaveBeenCalled();
});

test('UpdateOrganization throws naming the id-is-the-slug reason when slug is given', async () => {
  const updateOrganization = jest.fn();
  const { auth } = createMockAuth({ organizationEndpoints: { updateOrganization } });
  await expect(
    UpdateOrganization({
      acting,
      auth,
      organizationId,
      properties: { name: 'Acme Inc', slug: 'acme' },
    })
  ).rejects.toThrow(
    'UpdateOrganization refuses a "slug" property - under the "pinned" organizations policy the ' +
      'organization id is its slug, so changing it strands every member row and invitation ' +
      'pointing at the old value. Received "acme".'
  );
  expect(updateOrganization).not.toHaveBeenCalled();
});

test('UpdateOrganization throws naming the value when name is not a string', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateOrganization({ acting, auth, organizationId, properties: { name: { first: 'Acme' } } })
  ).rejects.toThrow(
    'UpdateOrganization requires a "name" string property. Received {"first":"Acme"}.'
  );
});

test('UpdateOrganization throws naming the value when logo is not a string', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateOrganization({ acting, auth, organizationId, properties: { logo: 12 } })
  ).rejects.toThrow('UpdateOrganization requires a "logo" string property. Received 12.');
});

test('UpdateOrganization throws naming the value when metadata is not an object', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateOrganization({ acting, auth, organizationId, properties: { metadata: 'tier=free' } })
  ).rejects.toThrow(
    'UpdateOrganization requires a "metadata" object property. Received "tier=free".'
  );
});

test('UpdateOrganization declares organization:update authority and no targetUser', () => {
  expect(UpdateOrganization.meta).toEqual({
    authority: { scope: 'org', permissions: { organization: ['update'] } },
  });
});
