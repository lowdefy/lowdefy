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

import createBeforeCreateInvitationHook from './createBeforeCreateInvitationHook.js';

function createMockAuth({ openInvitations }) {
  const count = vi.fn(async () => openInvitations);
  const auth = { $context: Promise.resolve({ adapter: { count } }) };
  return { auth, count };
}

const hookArgs = {
  invitation: { email: 'invitee@example.com', organizationId: 'org_1' },
  inviter: { id: 'user_1' },
  organization: { id: 'org_1' },
};

test('beforeCreateInvitationHook counts the pending, unexpired invitations of the organization', async () => {
  vi.useFakeTimers({ now: new Date('2026-10-26T12:00:00.000Z') });
  const { auth, count } = createMockAuth({ openInvitations: 0 });
  const hook = createBeforeCreateInvitationHook({ getAuth: () => auth, invitationLimit: 2 });

  await hook(hookArgs);

  expect(count).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'organizationId', value: 'org_1' },
      { field: 'status', value: 'pending' },
      { field: 'expiresAt', operator: 'gt', value: new Date('2026-10-26T12:00:00.000Z') },
    ],
  });
  vi.useRealTimers();
});

test('beforeCreateInvitationHook allows an invitation while the organization is under its limit', async () => {
  const { auth } = createMockAuth({ openInvitations: 1 });
  const hook = createBeforeCreateInvitationHook({ getAuth: () => auth, invitationLimit: 2 });

  await expect(hook(hookArgs)).resolves.toBeUndefined();
});

test('beforeCreateInvitationHook refuses with INVITATION_LIMIT_REACHED once the organization is at its limit', async () => {
  const { auth } = createMockAuth({ openInvitations: 2 });
  const hook = createBeforeCreateInvitationHook({ getAuth: () => auth, invitationLimit: 2 });

  await expect(hook(hookArgs)).rejects.toMatchObject({
    status: 'FORBIDDEN',
    statusCode: 403,
    body: {
      code: 'INVITATION_LIMIT_REACHED',
      message: 'This organization has reached its limit of open invitations.',
    },
  });
});

test('beforeCreateInvitationHook allows an invitation past 100 open ones under a higher limit', async () => {
  const { auth } = createMockAuth({ openInvitations: 100 });
  const hook = createBeforeCreateInvitationHook({ getAuth: () => auth, invitationLimit: 1000000 });

  await expect(hook(hookArgs)).resolves.toBeUndefined();
});
