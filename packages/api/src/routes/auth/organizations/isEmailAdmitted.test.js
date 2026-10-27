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

import isEmailAdmitted from './isEmailAdmitted.js';

const future = new Date(Date.now() + 3600 * 1000).toISOString();
const past = new Date(Date.now() - 3600 * 1000).toISOString();

const pinnedOrg = { id: 'team-portal', slug: 'team-portal', name: 'team-portal' };

function createMocks({
  member = null,
  members = member ? [member] : [],
  invitations = [],
  organization = pinnedOrg,
  userById = { id: 'user_1', email: 'User@Example.com' },
  userByEmail = null,
} = {}) {
  const adapter = {
    findOne: vi.fn(async ({ model }) => {
      if (model === 'organization') {
        return organization;
      }
      throw new Error(`Unexpected findOne model ${model}.`);
    }),
    findMany: vi.fn(async ({ model }) => {
      if (model === 'member') {
        return members;
      }
      if (model === 'invitation') {
        return invitations;
      }
      throw new Error(`Unexpected findMany model ${model}.`);
    }),
    create: vi.fn(async ({ model, data }) => ({ id: `${model}_new`, ...data })),
  };
  const internalAdapter = {
    findUserById: vi.fn(async () => userById),
    findUserByEmail: vi.fn(async () => userByEmail),
  };
  const auth = { $context: Promise.resolve({ adapter, internalAdapter }) };
  return { auth, adapter, internalAdapter };
}

const pinned = { policy: 'pinned', org: 'team-portal', signup: 'invite-only' };
const tenant = { policy: 'tenant', signup: 'invite-only' };

test('isEmailAdmitted returns true under pinned open signup without touching the adapter', async () => {
  const { auth, adapter, internalAdapter } = createMocks();
  const admitted = await isEmailAdmitted({
    email: 'new@example.com',
    organizations: { policy: 'pinned', org: 'team-portal', signup: 'open' },
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('isEmailAdmitted returns true under the tenant policy without touching the adapter', async () => {
  const { auth, adapter, internalAdapter } = createMocks();
  const admitted = await isEmailAdmitted({
    email: 'new@example.com',
    organizations: { policy: 'tenant' },
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('isEmailAdmitted returns true when a member row exists for the given userId', async () => {
  const { auth, adapter, internalAdapter } = createMocks({ member: { id: 'member_1' } });
  const admitted = await isEmailAdmitted({
    userId: 'user_1',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'team-portal' },
    ],
    limit: 1000,
  });
});

test('isEmailAdmitted returns true when a member row exists for the user resolved from email', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: { id: 'member_1' },
    userByEmail: { user: { id: 'user_9', email: 'member@example.com' } },
  });
  const admitted = await isEmailAdmitted({
    email: 'Member@Example.com',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(internalAdapter.findUserByEmail).toHaveBeenCalledWith('member@example.com');
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_9' },
      { field: 'organizationId', value: 'team-portal' },
    ],
    limit: 1000,
  });
});

test('isEmailAdmitted refuses a suspended member with no invitation under pinned', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: { id: 'member_1', suspended: true },
  });
  const admitted = await isEmailAdmitted({
    userId: 'user_1',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(false);
});

test('isEmailAdmitted admits a user suspended in one org who is a member of another under tenant', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    members: [
      { id: 'member_1', organizationId: 'org_1', suspended: true },
      { id: 'member_2', organizationId: 'org_2' },
    ],
  });
  const admitted = await isEmailAdmitted({
    userId: 'user_1',
    organizations: tenant,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
});

test('isEmailAdmitted refuses a user suspended in every org under tenant', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    members: [{ id: 'member_1', organizationId: 'org_1', suspended: true }],
  });
  const admitted = await isEmailAdmitted({
    userId: 'user_1',
    organizations: tenant,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(false);
});

test('isEmailAdmitted returns true for an email with a pending unexpired invitation and no member', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: null,
    userByEmail: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const admitted = await isEmailAdmitted({
    email: 'invited@example.com',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
});

test('isEmailAdmitted returns false for an uninvited email with no member', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: null,
    userByEmail: null,
    invitations: [],
  });
  const admitted = await isEmailAdmitted({
    email: 'stranger@example.com',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(false);
});

test('isEmailAdmitted returns false when the only invitation is expired', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: null,
    userByEmail: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: past }],
  });
  const admitted = await isEmailAdmitted({
    email: 'lapsed@example.com',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(false);
});

test('isEmailAdmitted lowercases the email once at entry for the invitation lookup', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: null,
    userByEmail: null,
    invitations: [],
  });
  await isEmailAdmitted({
    email: 'Mixed@Example.com',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'email', value: 'mixed@example.com' },
      { field: 'status', value: 'pending' },
      { field: 'organizationId', value: 'team-portal' },
    ],
  });
});

test('isEmailAdmitted resolves the email from userId for the invitation lookup', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: null,
    userById: { id: 'user_1', email: 'Wall@Example.com' },
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const admitted = await isEmailAdmitted({
    userId: 'user_1',
    organizations: pinned,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(internalAdapter.findUserById).toHaveBeenCalledWith('user_1');
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'email', value: 'wall@example.com' },
      { field: 'status', value: 'pending' },
      { field: 'organizationId', value: 'team-portal' },
    ],
  });
});

test('isEmailAdmitted returns true under tenant open signup without touching the adapter', async () => {
  const { auth, adapter, internalAdapter } = createMocks();
  const admitted = await isEmailAdmitted({
    email: 'new@example.com',
    organizations: { policy: 'tenant', signup: 'open' },
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('isEmailAdmitted admits a member of any org under tenant with no organizationId clause', async () => {
  const { auth, adapter, internalAdapter } = createMocks({ member: { id: 'member_1' } });
  const admitted = await isEmailAdmitted({
    userId: 'user_1',
    organizations: tenant,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'userId', value: 'user_1' }],
    limit: 1000,
  });
  expect(adapter.findOne).not.toHaveBeenCalledWith(
    expect.objectContaining({ model: 'organization' })
  );
});

test('isEmailAdmitted admits an invitation in any org under tenant without an organizationId clause', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: null,
    userByEmail: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const admitted = await isEmailAdmitted({
    email: 'invited@example.com',
    organizations: tenant,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'email', value: 'invited@example.com' },
      { field: 'status', value: 'pending' },
    ],
  });
  expect(adapter.findOne).not.toHaveBeenCalledWith(
    expect.objectContaining({ model: 'organization' })
  );
});

test('isEmailAdmitted refuses under tenant when there is neither a member nor an invitation', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: null,
    userByEmail: null,
    invitations: [],
  });
  const admitted = await isEmailAdmitted({
    email: 'stranger@example.com',
    organizations: tenant,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(false);
});

test('isEmailAdmitted admits a member of org A under tenant even with an expired invitation to org B', async () => {
  const { auth, adapter, internalAdapter } = createMocks({
    member: { id: 'member_a' },
    invitations: [{ id: 'inv_b', status: 'pending', expiresAt: past }],
  });
  const admitted = await isEmailAdmitted({
    userId: 'user_1',
    organizations: tenant,
    auth,
    adapter,
    internalAdapter,
  });
  expect(admitted).toBe(true);
  // Membership-anywhere short-circuits before the invitation lookup, so the
  // expired invitation is never consulted.
  expect(adapter.findMany).not.toHaveBeenCalledWith(
    expect.objectContaining({ model: 'invitation' })
  );
});
