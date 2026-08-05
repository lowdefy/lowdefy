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
// The step floor resolves the target organization and passes the id in; the
// defaulting and tenant-policy rules are tested there, not here.
const organizationId = 'org-1';

test('InviteMember passes properties including profile through as body to createInvitation', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  const result = await InviteMember({
    acting,
    auth,
    organizationId,
    properties: {
      email: 'new@example.com',
      orgRole: 'member',
      resend: true,
      profile: { contactId: 'contact-1' },
    },
  });
  expect(result).toEqual({ id: 'invitation-1' });
  expect(createInvitation.mock.calls[0][0].body).toEqual({
    appRoles: undefined,
    attributes: undefined,
    email: 'new@example.com',
    role: 'member',
    organizationId: 'org-1',
    resend: true,
    profile: { contactId: 'contact-1' },
  });
});

test('InviteMember sends role "member" when orgRole is omitted', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organizationId,
    properties: { email: 'new@example.com', appRoles: ['branch-manager'] },
  });
  expect(createInvitation.mock.calls[0][0].body).toEqual({
    appRoles: ['branch-manager'],
    attributes: undefined,
    email: 'new@example.com',
    organizationId: 'org-1',
    profile: undefined,
    resend: undefined,
    role: 'member',
  });
});

test('InviteMember sends the authored orgRole as the invitation role', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organizationId,
    properties: { email: 'new@example.com', orgRole: 'admin' },
  });
  expect(createInvitation.mock.calls[0][0].body.role).toBe('admin');
});

test('InviteMember forwards appRoles in the createInvitation body', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organizationId,
    properties: { email: 'new@example.com', appRoles: ['branch-manager', 'no-such-role'] },
  });
  expect(createInvitation.mock.calls[0][0].body.appRoles).toEqual([
    'branch-manager',
    'no-such-role',
  ]);
});

test('InviteMember carries appRoles as undefined in the body when omitted', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organizationId,
    properties: { email: 'new@example.com' },
  });
  expect(createInvitation.mock.calls[0][0].body.appRoles).toBe(undefined);
});

test('InviteMember throws when appRoles is a comma-separated string', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({
      acting,
      auth,
      organizationId,
      properties: { email: 'new@example.com', appRoles: 'a,b' },
    })
  ).rejects.toThrow('InviteMember "appRoles" is not an array. Received "a,b".');
});

test('InviteMember throws when orgRole is not a string', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({
      acting,
      auth,
      organizationId,
      properties: { email: 'new@example.com', orgRole: ['admin'] },
    })
  ).rejects.toThrow('InviteMember "orgRole" is not a string. Received ["admin"].');
});

test('InviteMember scopes the invitation to the organizationId passed by the floor', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organizationId: 'org-explicit',
    properties: { email: 'new@example.com' },
  });
  expect(createInvitation.mock.calls[0][0].body.organizationId).toBe('org-explicit');
});

test('InviteMember throws when email property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({ acting, auth, organizationId, properties: { orgRole: 'member' } })
  ).rejects.toThrow('InviteMember requires an "email" property.');
});

test('InviteMember forwards attributes in the createInvitation body', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  await InviteMember({
    acting,
    auth,
    organizationId,
    properties: {
      email: 'new@example.com',
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
    organizationId,
    properties: { email: 'new@example.com' },
  });
  expect(createInvitation.mock.calls[0][0].body.attributes).toBe(undefined);
});

test('InviteMember throws when attributes is not a plain object', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({
      acting,
      auth,
      organizationId,
      properties: {
        email: 'new@example.com',
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
    organizationId,
    properties: { email: 'new@example.com' },
  });
  expect(createInvitation.mock.calls[0][0].body.profile).toBe(undefined);
});

test('InviteMember throws when profile is not a plain object', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({
      acting,
      auth,
      organizationId,
      properties: {
        email: 'new@example.com',
        profile: 'not-an-object',
      },
    })
  ).rejects.toThrow('InviteMember "profile" is not an object. Received "not-an-object".');
});
