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

import InviteMember from './InviteMember.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };
const organization = {
  policy: 'pinned',
  pinned: { id: 'org_pinned', slug: 'org-a', name: 'org-a' },
};

test('InviteMember passes properties including profile through as body to createInvitation', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  const result = await InviteMember({
    acting,
    auth,
    organization,
    properties: {
      email: 'new@example.com',
      role: 'member',
      organizationId: 'org-1',
      resend: true,
      profile: { contactId: 'contact-1' },
    },
  });
  expect(result).toEqual({ id: 'invitation-1' });
  expect(createInvitation.mock.calls[0][0].body).toEqual({
    attributes: undefined,
    email: 'new@example.com',
    role: 'member',
    organizationId: 'org-1',
    resend: true,
    profile: { contactId: 'contact-1' },
  });
});

test('InviteMember uses the explicit organizationId even when it differs from the pinned organization', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organization,
    properties: { email: 'new@example.com', role: 'member', organizationId: 'org-explicit' },
  });
  expect(createInvitation.mock.calls[0][0].body.organizationId).toBe('org-explicit');
});

test('InviteMember defaults organizationId to the pinned organization when omitted', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organization,
    properties: { email: 'new@example.com', role: 'member' },
  });
  expect(createInvitation.mock.calls[0][0].body.organizationId).toBe('org_pinned');
});

test('InviteMember throws under the tenant organizations policy when organizationId is omitted', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({
      acting,
      auth,
      organization: { policy: 'tenant', pinned: null },
      properties: { email: 'new@example.com', role: 'member' },
    })
  ).rejects.toThrow(
    'InviteMember requires an "organizationId" property under the "tenant" organizations policy - there is no pinned organization to default to. Set organizationId on the step properties.'
  );
});

test('InviteMember throws when email property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({ acting, auth, organization, properties: { role: 'member' } })
  ).rejects.toThrow('InviteMember requires an "email" property.');
});

test('InviteMember throws when role property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({ acting, auth, organization, properties: { email: 'new@example.com' } })
  ).rejects.toThrow('InviteMember requires a "role" property.');
});

test('InviteMember forwards attributes in the createInvitation body', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organization,
    properties: {
      email: 'new@example.com',
      role: 'member',
      organizationId: 'org-1',
      attributes: { region: 'eu' },
    },
  });
  expect(createInvitation.mock.calls[0][0].body.attributes).toEqual({ region: 'eu' });
});

test('InviteMember carries attributes as undefined in the body when omitted', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organization,
    properties: { email: 'new@example.com', role: 'member', organizationId: 'org-1' },
  });
  expect(createInvitation.mock.calls[0][0].body.attributes).toBe(undefined);
});

test('InviteMember throws when attributes is not a plain object', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({
      acting,
      auth,
      organization,
      properties: {
        email: 'new@example.com',
        role: 'member',
        organizationId: 'org-1',
        attributes: 'not-an-object',
      },
    })
  ).rejects.toThrow('InviteMember "attributes" is not an object. Received "not-an-object".');
});

test('InviteMember carries profile as undefined in the body when omitted', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organization,
    properties: { email: 'new@example.com', role: 'member', organizationId: 'org-1' },
  });
  expect(createInvitation.mock.calls[0][0].body.profile).toBe(undefined);
});

test('InviteMember throws when profile is not a plain object', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({
      acting,
      auth,
      organization,
      properties: {
        email: 'new@example.com',
        role: 'member',
        organizationId: 'org-1',
        profile: 'not-an-object',
      },
    })
  ).rejects.toThrow('InviteMember "profile" is not an object. Received "not-an-object".');
});
