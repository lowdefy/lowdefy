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

import createActiveOrgPolicyHook from './createActiveOrgPolicyHook.js';

const future = new Date(Date.now() + 3600 * 1000).toISOString();
const past = new Date(Date.now() - 3600 * 1000).toISOString();

// The pinned org row the mock adapter serves for the ensure-by-slug lookup.
const pinnedOrg = { id: 'org_pinned', slug: 'team-portal', name: 'team-portal' };

function createMockAuth({
  member = null,
  members = [],
  invitations = [],
  organization = pinnedOrg,
  user = { id: 'user_1', email: 'User@Example.com', name: 'User One' },
} = {}) {
  const adapter = {
    findOne: jest.fn(async ({ model, where }) => {
      if (model === 'organization') {
        return organization;
      }
      if (model === 'member') {
        return member;
      }
      throw new Error(`Unexpected findOne model ${model} ${JSON.stringify(where)}.`);
    }),
    findMany: jest.fn(async ({ model }) => {
      if (model === 'member') {
        return members;
      }
      if (model === 'invitation') {
        return invitations;
      }
      throw new Error(`Unexpected findMany model ${model}.`);
    }),
    create: jest.fn(async ({ model, data }) => ({ id: `${model}_new`, ...data })),
  };
  const internalAdapter = {
    findUserById: jest.fn(async () => user),
  };
  const auth = {
    $context: Promise.resolve({ adapter, internalAdapter }),
    api: {
      addMember: jest.fn(async () => ({ id: 'member_new' })),
    },
    options: { plugins: [{ id: 'organization', options: {} }] },
  };
  return { auth, adapter, internalAdapter };
}

const pinned = { policy: 'pinned', org: 'team-portal', signup: 'invite-only' };
const tenant = { policy: 'tenant' };

test('pinned: a member of the pinned org gets it as the active organization', async () => {
  const { auth } = createMockAuth({ member: { id: 'member_1', role: 'admin' } });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: pinned });
  const result = await hook({ userId: 'user_1', token: 'tok' });
  expect(result).toEqual({
    data: { userId: 'user_1', token: 'tok', activeOrganizationId: 'org_pinned' },
  });
});

test('pinned: a non-member with no invitation is rejected with a 403 MEMBERSHIP_REQUIRED APIError', async () => {
  const { auth } = createMockAuth({ member: null, invitations: [] });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: pinned });
  let thrown;
  try {
    await hook({ userId: 'user_1' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(APIError);
  expect(thrown.body.code).toBe('MEMBERSHIP_REQUIRED');
  expect(thrown.statusCode).toBe(403);
});

test('pinned: a non-member with a pending unexpired invitation is admitted without an active org', async () => {
  const { auth } = createMockAuth({
    member: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: pinned });
  const result = await hook({ userId: 'user_1' });
  expect(result).toBeUndefined();
});

test('pinned: an expired invitation gets the normal rejection', async () => {
  const { auth } = createMockAuth({
    member: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: past }],
  });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: pinned });
  await expect(hook({ userId: 'user_1' })).rejects.toThrow(APIError);
});

test('pinned: the invitation lookup uses the lowercased user email scoped to the pinned org', async () => {
  const { auth, adapter } = createMockAuth({ member: null, invitations: [] });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: pinned });
  await expect(hook({ userId: 'user_1' })).rejects.toThrow(APIError);
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'email', value: 'user@example.com' },
      { field: 'status', value: 'pending' },
      { field: 'organizationId', value: 'org_pinned' },
    ],
  });
});

test('tenant: the oldest membership becomes the active organization', async () => {
  const { auth, adapter } = createMockAuth({
    members: [{ id: 'member_1', organizationId: 'org_oldest' }],
  });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  const result = await hook({ userId: 'user_1' });
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: 'org_oldest' },
  });
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'userId', value: 'user_1' }],
    sortBy: { field: 'createdAt', direction: 'asc' },
    limit: 1,
  });
});

test('tenant: a pending invitation admits the session and mints nothing', async () => {
  const { auth, adapter } = createMockAuth({
    members: [],
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  const result = await hook({ userId: 'user_1' });
  expect(result).toBeUndefined();
  expect(adapter.create).not.toHaveBeenCalled();
});

test('tenant: a fresh signup lazily mints its own organization as owner and sets it active', async () => {
  const { auth, adapter } = createMockAuth({ members: [], invitations: [], organization: null });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  const result = await hook({ userId: 'user_1' });
  expect(adapter.create).toHaveBeenCalledWith({
    model: 'organization',
    data: expect.objectContaining({ name: 'User One', slug: 'org-user_1' }),
    forceAllowId: true,
  });
  expect(adapter.create).toHaveBeenCalledWith({
    model: 'member',
    data: expect.objectContaining({
      userId: 'user_1',
      organizationId: 'organization_new',
      role: 'owner',
    }),
  });
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: 'organization_new' },
  });
});

test('tenant: a retried mint reuses an orphan org row left by a failed member write', async () => {
  const orphan = { id: 'org_orphan', slug: 'org-user_1' };
  const { auth, adapter } = createMockAuth({ members: [], invitations: [], organization: orphan });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  const result = await hook({ userId: 'user_1' });
  expect(adapter.create).not.toHaveBeenCalledWith(
    expect.objectContaining({ model: 'organization' })
  );
  expect(adapter.create).toHaveBeenCalledWith({
    model: 'member',
    data: expect.objectContaining({
      userId: 'user_1',
      organizationId: 'org_orphan',
      role: 'owner',
    }),
  });
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: 'org_orphan' },
  });
});

test('tenant: a mint losing the unique slug race reads and uses the winning org row', async () => {
  const winner = { id: 'org_winner', slug: 'org-user_1' };
  const { auth, adapter } = createMockAuth({ members: [], invitations: [], organization: null });
  let organizationLookups = 0;
  adapter.findOne.mockImplementation(async ({ model }) => {
    if (model === 'organization') {
      organizationLookups += 1;
      return organizationLookups === 1 ? null : winner;
    }
    return null;
  });
  adapter.create.mockImplementation(async ({ model, data }) => {
    if (model === 'organization') {
      throw new Error('E11000 duplicate key error: slug');
    }
    return { id: `${model}_new`, ...data };
  });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  const result = await hook({ userId: 'user_1' });
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: 'org_winner' },
  });
  expect(adapter.create).toHaveBeenCalledWith({
    model: 'member',
    data: expect.objectContaining({ organizationId: 'org_winner', role: 'owner' }),
  });
});

test('pinned open signup: a session for a not-yet-joined user ensures membership and sets the org active', async () => {
  const { auth } = createMockAuth({ member: null, invitations: [] });
  const hook = createActiveOrgPolicyHook({
    getAuth: () => auth,
    organizations: { policy: 'pinned', org: 'team-portal', signup: 'open' },
  });
  const result = await hook({ userId: 'user_1' });
  expect(auth.api.addMember).toHaveBeenCalledWith({
    body: {
      userId: 'user_1',
      organizationId: 'org_pinned',
      role: 'member',
    },
    headers: undefined,
  });
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: 'org_pinned' },
  });
});
