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
import { APIError } from 'better-auth/api';

import createAdmissionGateHook from './createAdmissionGateHook.js';

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

test('createAdmissionGateHook throws a 403 MEMBERSHIP_REQUIRED APIError for an uninvited email', async () => {
  const { auth } = createMockAuth({ member: null, invitations: [] });
  const hook = createAdmissionGateHook({ getAuth: () => auth, organizations: pinned });
  let thrown;
  try {
    await hook({ email: 'stranger@example.com' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(APIError);
  expect(thrown.statusCode).toBe(403);
  expect(thrown.body.code).toBe('MEMBERSHIP_REQUIRED');
  // The message equals the code so the OAuth error-callback (which surfaces the
  // message, not the code) still lands ?error=MEMBERSHIP_REQUIRED.
  expect(thrown.body.message).toBe('MEMBERSHIP_REQUIRED');
});

test('createAdmissionGateHook admits an invited email without throwing or mutating the record', async () => {
  const { auth } = createMockAuth({
    member: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const hook = createAdmissionGateHook({ getAuth: () => auth, organizations: pinned });
  const result = await hook({ email: 'invited@example.com' });
  expect(result).toBeUndefined();
});

test('createAdmissionGateHook is a no-op under open signup', async () => {
  const { auth, adapter } = createMockAuth({ member: null, invitations: [] });
  const hook = createAdmissionGateHook({
    getAuth: () => auth,
    organizations: { policy: 'pinned', org: 'team-portal', signup: 'open' },
  });
  const result = await hook({ email: 'anyone@example.com' });
  expect(result).toBeUndefined();
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('createAdmissionGateHook is a no-op under the tenant policy', async () => {
  const { auth, adapter } = createMockAuth({ member: null, invitations: [] });
  const hook = createAdmissionGateHook({
    getAuth: () => auth,
    organizations: { policy: 'tenant' },
  });
  const result = await hook({ email: 'anyone@example.com' });
  expect(result).toBeUndefined();
  expect(adapter.findOne).not.toHaveBeenCalled();
});
