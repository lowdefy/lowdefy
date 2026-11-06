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
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth });

  await expect(
    hook({ invitation: { id: 'inv_1' }, user: { id: 'user_1' }, organization })
  ).resolves.toBeUndefined();
  expect(findOne).not.toHaveBeenCalled();
});

test('beforeAcceptInvitationHook allows a login with no link', async () => {
  const { auth, findOne } = createMockAuth();
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth });

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
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth });

  await expect(
    hook({
      invitation: { id: 'inv_1', contactId: 'contact_9' },
      user: { id: 'user_1' },
      organization,
    })
  ).resolves.toBeUndefined();
});

test('beforeAcceptInvitationHook refuses a login linked to a different contact, naming the login and both contacts', async () => {
  const { auth } = createMockAuth({ userRow: { id: 'user_1', contactId: 'contact_1' } });
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth });

  const result = hook({
    invitation: { id: 'inv_1', contactId: 'contact_9' },
    user: { id: 'user_1' },
    organization,
  });
  await expect(result).rejects.toMatchObject({
    statusCode: 400,
    body: { code: 'CONTACT_LINK_MISMATCH' },
  });
  await expect(result).rejects.toThrow(
    'Login "user_1" is linked to contact "contact_1", but the invitation names contact "contact_9". Correct the login\'s contact link in the data before the invitation can be accepted.'
  );
});

// The session user may be a cookie-cached copy from before the link was set.
test('beforeAcceptInvitationHook reads the link from the stored user row, not the session user', async () => {
  const { auth } = createMockAuth({ userRow: { id: 'user_1', contactId: 'contact_1' } });
  const hook = createBeforeAcceptInvitationHook({ getAuth: () => auth });

  await expect(
    hook({
      invitation: { id: 'inv_1', contactId: 'contact_9' },
      user: { id: 'user_1', contactId: null },
      organization,
    })
  ).rejects.toMatchObject({ body: { code: 'CONTACT_LINK_MISMATCH' } });
});
