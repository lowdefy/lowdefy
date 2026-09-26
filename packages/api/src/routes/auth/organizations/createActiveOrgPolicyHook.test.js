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
const pinnedOrg = { id: 'team-portal', slug: 'team-portal', name: 'team-portal' };

function createMockAuth({
  member = null,
  members = [],
  invitations = [],
  organization = pinnedOrg,
  organizationMemberCounts = {},
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
    count: jest.fn(async ({ model, where }) => {
      if (model === 'member') {
        return organizationMemberCounts[where[0].value] ?? 0;
      }
      throw new Error(`Unexpected count model ${model}.`);
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
const tenant = { policy: 'tenant', signup: 'open', create: 'auto' };

test('pinned: a member of the pinned org gets it as the active organization', async () => {
  const { auth } = createMockAuth({ member: { id: 'member_1', role: 'admin' } });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: pinned });
  const result = await hook({ userId: 'user_1', token: 'tok' });
  expect(result).toEqual({
    data: { userId: 'user_1', token: 'tok', activeOrganizationId: 'team-portal' },
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
      { field: 'organizationId', value: 'team-portal' },
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

test('tenant: the org slugged from the user id is reused only after checking it has no members', async () => {
  const orphan = { id: 'org_orphan', slug: 'org-user_1' };
  const { auth, adapter } = createMockAuth({ members: [], invitations: [], organization: orphan });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  await hook({ userId: 'user_1' });
  expect(adapter.count).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'organizationId', value: 'org_orphan' }],
  });
});

test('tenant: when the org slugged from the user id has members, a fresh org is minted on the next slug', async () => {
  const handedOver = { id: 'org_handed_over', slug: 'org-user_1' };
  const { auth, adapter } = createMockAuth({
    members: [],
    invitations: [],
    organizationMemberCounts: { org_handed_over: 2 },
  });
  adapter.findOne.mockImplementation(async ({ model, where }) => {
    if (model === 'organization' && where[0].value === 'org-user_1') {
      return handedOver;
    }
    return null;
  });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  const result = await hook({ userId: 'user_1' });
  expect(adapter.create).toHaveBeenCalledWith({
    model: 'organization',
    data: expect.objectContaining({ name: 'User One', slug: 'org-user_1-2' }),
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

test('tenant: the user is never added to an org that has members', async () => {
  const orgs = {
    'org-user_1': { id: 'org_first', slug: 'org-user_1' },
    'org-user_1-2': { id: 'org_second', slug: 'org-user_1-2' },
    'org-user_1-3': { id: 'org_third', slug: 'org-user_1-3' },
  };
  const { auth, adapter } = createMockAuth({
    members: [],
    invitations: [],
    organizationMemberCounts: { org_first: 3, org_second: 1 },
  });
  adapter.findOne.mockImplementation(async ({ model, where }) => {
    if (model === 'organization') {
      return orgs[where[0].value] ?? null;
    }
    return null;
  });
  const hook = createActiveOrgPolicyHook({ getAuth: () => auth, organizations: tenant });
  const result = await hook({ userId: 'user_1' });
  // org-user_1-3 has no members: the half-finished mint of an earlier fresh org.
  expect(adapter.create).not.toHaveBeenCalledWith(
    expect.objectContaining({ model: 'organization' })
  );
  const memberWrites = adapter.create.mock.calls.filter(([call]) => call.model === 'member');
  expect(memberWrites).toHaveLength(1);
  expect(memberWrites[0][0].data).toEqual(
    expect.objectContaining({ userId: 'user_1', organizationId: 'org_third', role: 'owner' })
  );
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: 'org_third' },
  });
});

test('tenant: a fresh mint losing the unique slug race on the next slug reads and uses the winning org row', async () => {
  const handedOver = { id: 'org_handed_over', slug: 'org-user_1' };
  const winner = { id: 'org_winner', slug: 'org-user_1-2' };
  const { auth, adapter } = createMockAuth({
    members: [],
    invitations: [],
    organizationMemberCounts: { org_handed_over: 2 },
  });
  let nextSlugLookups = 0;
  adapter.findOne.mockImplementation(async ({ model, where }) => {
    if (model !== 'organization') {
      return null;
    }
    if (where[0].value === 'org-user_1') {
      return handedOver;
    }
    nextSlugLookups += 1;
    return nextSlugLookups === 1 ? null : winner;
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

test('tenant invite-only: a user with no membership and no invitation is rejected with a 403 MEMBERSHIP_REQUIRED APIError', async () => {
  const { auth, adapter } = createMockAuth({ members: [], invitations: [], organization: null });
  const hook = createActiveOrgPolicyHook({
    getAuth: () => auth,
    organizations: { policy: 'tenant', signup: 'invite-only', create: 'auto' },
  });
  let thrown;
  try {
    await hook({ userId: 'user_1' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(APIError);
  expect(thrown.body.code).toBe('MEMBERSHIP_REQUIRED');
  expect(thrown.body.message).toBe('You have not been granted access to this application.');
  expect(thrown.statusCode).toBe(403);
  expect(adapter.create).not.toHaveBeenCalled();
});

test('tenant open + operator: a user with no membership and no invitation gets an org-less session and no org is minted', async () => {
  const { auth, adapter } = createMockAuth({ members: [], invitations: [], organization: null });
  const hook = createActiveOrgPolicyHook({
    getAuth: () => auth,
    organizations: { policy: 'tenant', signup: 'open', create: 'operator' },
  });
  const result = await hook({ userId: 'user_1' });
  expect(result).toBeUndefined();
  expect(adapter.create).not.toHaveBeenCalled();
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
      organizationId: 'team-portal',
      role: 'member',
    },
    headers: undefined,
  });
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: 'team-portal' },
  });
});
