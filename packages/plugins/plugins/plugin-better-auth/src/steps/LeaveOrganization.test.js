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

import LeaveOrganization from './LeaveOrganization.js';
import createMockAuth from '../../test/createMockAuth.js';

const acting = {
  system: false,
  user: {
    id: 'user_1',
    email: 'ana@example.com',
    name: 'Ana',
    image: null,
    email_verified: true,
    role: undefined,
    active_organization_id: 'org-1',
  },
};

test('LeaveOrganization calls the org leaveOrganization endpoint with the named organization', async () => {
  const leaveOrganization = jest
    .fn()
    .mockResolvedValue({ id: 'member-1', userId: 'user_1', organizationId: 'org-2' });
  const { auth } = createMockAuth({ organizationEndpoints: { leaveOrganization } });
  const result = await LeaveOrganization({
    acting,
    auth,
    organizationId: null,
    properties: { organizationId: 'org-2' },
  });
  expect(result).toEqual({ id: 'member-1', userId: 'user_1', organizationId: 'org-2' });
  const input = leaveOrganization.mock.calls[0][0];
  expect(input.body).toEqual({ organizationId: 'org-2' });
  expect(input.context.session.user.id).toBe('user_1');
});

test('LeaveOrganization throws when the organizationId property is missing', async () => {
  const leaveOrganization = jest.fn();
  const { auth } = createMockAuth({ organizationEndpoints: { leaveOrganization } });
  await expect(
    LeaveOrganization({ acting, auth, organizationId: null, properties: {} })
  ).rejects.toThrow('LeaveOrganization requires an "organizationId" property.');
  expect(leaveOrganization).not.toHaveBeenCalled();
});

test('LeaveOrganization throws the engine refusal message for the only owner', async () => {
  const refusal = Object.assign(new Error('BAD_REQUEST'), {
    status: 'BAD_REQUEST',
    statusCode: 400,
    body: {
      code: 'YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER',
      message: 'You cannot leave the organization as the only owner',
    },
  });
  const leaveOrganization = jest.fn().mockRejectedValue(refusal);
  const { auth } = createMockAuth({ organizationEndpoints: { leaveOrganization } });
  await expect(
    LeaveOrganization({
      acting,
      auth,
      organizationId: null,
      properties: { organizationId: 'org-1' },
    })
  ).rejects.toThrow('You cannot leave the organization as the only owner');
});
