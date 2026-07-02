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

test('InviteMember passes properties including contactId through as body to createInvitation', async () => {
  const createInvitation = jest.fn().mockResolvedValue({ id: 'invitation-1' });
  const { auth } = createMockAuth({ organizationEndpoints: { createInvitation } });
  const result = await InviteMember({
    acting,
    auth,
    properties: {
      email: 'new@example.com',
      role: 'member',
      organizationId: 'org-1',
      resend: true,
      contactId: 'contact-1',
    },
  });
  expect(result).toEqual({ id: 'invitation-1' });
  expect(createInvitation.mock.calls[0][0].body).toEqual({
    email: 'new@example.com',
    role: 'member',
    organizationId: 'org-1',
    resend: true,
    contactId: 'contact-1',
  });
});

test('InviteMember throws when email property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(InviteMember({ acting, auth, properties: { role: 'member' } })).rejects.toThrow(
    'InviteMember requires an "email" property.'
  );
});

test('InviteMember throws when role property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    InviteMember({ acting, auth, properties: { email: 'new@example.com' } })
  ).rejects.toThrow('InviteMember requires a "role" property.');
});
