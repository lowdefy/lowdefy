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

import createBeforeAcceptInvitationHook from './createBeforeAcceptInvitationHook.js';

function createMockAuth({ userRow = { id: 'user_1' } } = {}) {
  const findOne = vi.fn(async () => userRow);
  const auth = { $context: Promise.resolve({ adapter: { findOne } }) };
  return { auth, findOne };
}

const organization = { id: 'org_1' };

test('beforeAcceptInvitationHook reads nothing when the invitation names no contact', async () => {
  const { auth, findOne } = createMockAuth({ userRow: { id: 'user_1', contactId: 'contact_1' } });
  const logger = { warn: vi.fn() };
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth, logger });

  await expect(
    hook({ invitation: { id: 'inv_1' }, user: { id: 'user_1' }, organization })
  ).resolves.toBeUndefined();
  expect(findOne).not.toHaveBeenCalled();
});

test('beforeAcceptInvitationHook allows a login with no link', async () => {
  const { auth, findOne } = createMockAuth();
  const logger = { warn: vi.fn() };
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth, logger });

  await expect(
    hook({
      invitation: { id: 'inv_1', contactId: 'contact_9' },
      user: { id: 'user_1' },
      organization,
    })
  ).resolves.toBeUndefined();
  expect(findOne).toHaveBeenCalledWith({
    model: 'user',
    where: [{ field: 'id', value: 'user_1' }],
  });
});

test('beforeAcceptInvitationHook allows a login already linked to the same contact', async () => {
  const { auth } = createMockAuth({ userRow: { id: 'user_1', contactId: 'contact_9' } });
  const logger = { warn: vi.fn() };
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth, logger });

  await expect(
    hook({
      invitation: { id: 'inv_1', contactId: 'contact_9' },
      user: { id: 'user_1' },
      organization,
    })
  ).resolves.toBeUndefined();
});

test('beforeAcceptInvitationHook refuses a login linked to a different contact with a message that carries no ids, and logs them', async () => {
  const { auth } = createMockAuth({ userRow: { id: 'user_1', contactId: 'contact_1' } });
  const logger = { warn: vi.fn() };
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth, logger });

  const error = await hook({
    invitation: { id: 'inv_1', contactId: 'contact_9' },
    user: { id: 'user_1' },
    organization,
  }).catch((caught) => caught);
  expect(error).toMatchObject({
    statusCode: 400,
    body: { code: 'CONTACT_LINK_MISMATCH' },
    message: 'This invitation can not be accepted by this account.',
  });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toEqual({
    event: 'invitation_contact_link_mismatch',
    userId: 'user_1',
    invitationId: 'inv_1',
    linkedContactId: 'contact_1',
    invitationContactId: 'contact_9',
  });
});

// The session user may be a cookie-cached copy from before the link was set.
test('beforeAcceptInvitationHook reads the link from the stored user row, not the session user', async () => {
  const { auth } = createMockAuth({ userRow: { id: 'user_1', contactId: 'contact_1' } });
  const logger = { warn: vi.fn() };
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth, logger });

  await expect(
    hook({
      invitation: { id: 'inv_1', contactId: 'contact_9' },
      user: { id: 'user_1', contactId: null },
      organization,
    })
  ).rejects.toMatchObject({ body: { code: 'CONTACT_LINK_MISMATCH' } });
});
