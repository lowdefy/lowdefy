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

import createEmailSendGate from './createEmailSendGate.js';

const future = new Date(Date.now() + 3600 * 1000).toISOString();
const pinnedOrg = { id: 'team-portal', slug: 'team-portal', name: 'team-portal' };

function createMockAuth({ member = null, invitations = [] } = {}) {
  const adapter = {
    findOne: jest.fn(async ({ model }) => (model === 'organization' ? pinnedOrg : member)),
    findMany: jest.fn(async () => invitations),
    create: jest.fn(async ({ model, data }) => ({ id: `${model}_new`, ...data })),
  };
  const internalAdapter = {
    findUserById: jest.fn(async () => null),
    findUserByEmail: jest.fn(async () => null),
  };
  const auth = { $context: Promise.resolve({ adapter, internalAdapter }) };
  return { auth, adapter, internalAdapter };
}

const pinned = { policy: 'pinned', org: 'team-portal', signup: 'invite-only' };

test('createEmailSendGate falls through when the body has no email', async () => {
  const getAuth = jest.fn();
  const gate = createEmailSendGate({
    getAuth,
    organizations: pinned,
    successBody: { status: true },
  });
  const result = await gate({ body: {} });
  expect(result).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('createEmailSendGate falls through so the send proceeds for an admitted email', async () => {
  const { auth } = createMockAuth({
    member: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const gate = createEmailSendGate({
    getAuth: () => auth,
    organizations: pinned,
    successBody: { status: true },
  });
  const result = await gate({ body: { email: 'invited@example.com' } });
  expect(result).toBeUndefined();
});

test('createEmailSendGate suppresses the magic-link send with its { status: true } body for an unadmitted email', async () => {
  const { auth } = createMockAuth({ member: null, invitations: [] });
  const gate = createEmailSendGate({
    getAuth: () => auth,
    organizations: pinned,
    successBody: { status: true },
  });
  const result = await gate({ body: { email: 'stranger@example.com' } });
  expect(result).toEqual({ status: true });
});

// The OTP send route answers { success: true }, not { status: true } - a
// suppressed send has to be indistinguishable from a real one on the wire.
test('createEmailSendGate suppresses the OTP send with its { success: true } body for an unadmitted email', async () => {
  const { auth } = createMockAuth({ member: null, invitations: [] });
  const gate = createEmailSendGate({
    getAuth: () => auth,
    organizations: pinned,
    successBody: { success: true },
  });
  const result = await gate({ body: { email: 'stranger@example.com' } });
  expect(result).toEqual({ success: true });
});
