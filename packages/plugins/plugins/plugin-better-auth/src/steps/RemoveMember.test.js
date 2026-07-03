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

import RemoveMember from './RemoveMember.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = { system: true, user: null };
const organization = { policy: 'pinned', pinned: { id: 'org_pinned', slug: 'org-a', name: 'org-a' } };

test('RemoveMember passes properties through as body to the org removeMember endpoint', async () => {
  const removeMember = jest.fn().mockResolvedValue({ member: { id: 'member-1' } });
  const { auth } = createMockAuth({ organizationEndpoints: { removeMember } });
  const result = await RemoveMember({
    acting,
    auth,
    organization,
    properties: { memberIdOrEmail: 'member-1', organizationId: 'org-1' },
  });
  expect(result).toEqual({ member: { id: 'member-1' } });
  expect(removeMember.mock.calls[0][0].body).toEqual({
    memberIdOrEmail: 'member-1',
    organizationId: 'org-1',
  });
});

test('RemoveMember defaults organizationId to the pinned organization when omitted', async () => {
  const removeMember = jest.fn().mockResolvedValue({ member: { id: 'member-1' } });
  const { auth } = createMockAuth({ organizationEndpoints: { removeMember } });
  await RemoveMember({
    acting,
    auth,
    organization,
    properties: { memberIdOrEmail: 'member-1' },
  });
  expect(removeMember.mock.calls[0][0].body.organizationId).toBe('org_pinned');
});

test('RemoveMember throws under the tenant organizations policy when organizationId is omitted', async () => {
  const { auth } = createMockAuth();
  await expect(
    RemoveMember({
      acting,
      auth,
      organization: { policy: 'tenant', pinned: null },
      properties: { memberIdOrEmail: 'member-1' },
    })
  ).rejects.toThrow(
    'RemoveMember requires an "organizationId" property under the "tenant" organizations policy - there is no pinned organization to default to. Set organizationId on the step properties.'
  );
});

test('RemoveMember throws when memberIdOrEmail property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(RemoveMember({ acting, auth, organization, properties: {} })).rejects.toThrow(
    'RemoveMember requires a "memberIdOrEmail" property.'
  );
});
