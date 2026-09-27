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

// An in-memory auth database holding the unique indexes ensureAuthIndexes
// creates - one organization per slug, one member row per (user, org) - so the
// mint's recovery from a lost race runs against the same rejection a real
// database gives. `before` pauses an operation until the test releases it,
// which fixes the interleaving of two concurrent sessions.
function createMemoryAuth({ organizations = [], members = [], ensureUniqueIndexes } = {}) {
  const db = { organization: [...organizations], member: [...members] };
  const pauses = [];
  let ids = 0;
  function matches(row, where) {
    return where.every(({ field, value, operator }) =>
      operator === 'ne' ? row[field] !== value : row[field] === value
    );
  }
  async function pause(operation, args) {
    const found = pauses.find((entry) => entry.match(operation, args));
    if (found) {
      pauses.splice(pauses.indexOf(found), 1);
      found.reached();
      await found.released;
    }
  }
  const adapter = {
    options: {
      ensureUniqueIndexes: ensureUniqueIndexes ?? jest.fn(async () => {}),
    },
    findOne: jest.fn(async ({ model, where }) => {
      await pause('findOne', { model, where });
      return db[model].find((row) => matches(row, where)) ?? null;
    }),
    findMany: jest.fn(async ({ model, where }) => {
      if (model === 'invitation') return [];
      return db[model].filter((row) => matches(row, where));
    }),
    create: jest.fn(async ({ model, data }) => {
      await pause('create', { model, data });
      const duplicate =
        model === 'organization'
          ? db.organization.some((row) => row.slug === data.slug)
          : db.member.some(
              (row) => row.userId === data.userId && row.organizationId === data.organizationId
            );
      if (duplicate) {
        throw new Error(`E11000 duplicate key error collection: ${model}`);
      }
      ids += 1;
      const row = { id: `${model}_${ids}`, ...data };
      db[model].push(row);
      return { ...row };
    }),
    count: jest.fn(
      async ({ model, where }) => db[model].filter((row) => matches(row, where)).length
    ),
    update: jest.fn(async ({ model, where, update }) => {
      const row = db[model].find((candidate) => matches(candidate, where));
      Object.assign(row, update);
      return { ...row };
    }),
  };
  const internalAdapter = {
    findUserById: jest.fn(async (id) => ({ id, email: `${id}@example.com`, name: 'User One' })),
  };
  const auth = { $context: Promise.resolve({ adapter, internalAdapter }) };
  // Pause the next operation matching `match` until release() is called;
  // reached resolves once a session is waiting there.
  function before(match) {
    const entry = { match };
    const reached = new Promise((resolve) => {
      entry.reached = resolve;
    });
    let release;
    entry.released = new Promise((resolve) => {
      release = resolve;
    });
    pauses.push(entry);
    return { reached, release };
  }
  return { auth, adapter, db, before };
}

function mintHook(auth) {
  return createActiveOrgPolicyHook({
    getAuth: () => auth,
    logger: { error: jest.fn(), warn: jest.fn() },
    organizations: tenant,
  });
}

test('tenant: a fresh signup mints its own organization as owner and clears the mint marker', async () => {
  const { auth, db } = createMemoryAuth();
  const result = await mintHook(auth)({ userId: 'user_1' });
  expect(db.organization).toEqual([
    expect.objectContaining({ name: 'User One', slug: 'org-user_1', mintPending: false }),
  ]);
  expect(db.member).toEqual([
    expect.objectContaining({
      userId: 'user_1',
      organizationId: db.organization[0].id,
      role: 'owner',
    }),
  ]);
  expect(result).toEqual({
    data: { userId: 'user_1', activeOrganizationId: db.organization[0].id },
  });
});

test('tenant: a retried mint joins the marked organization a failed member write left behind', async () => {
  const orphan = { id: 'org_orphan', slug: 'org-user_1', mintPending: true, createdAt: new Date() };
  const { auth, db } = createMemoryAuth({ organizations: [orphan] });
  const result = await mintHook(auth)({ userId: 'user_1' });
  expect(db.organization).toEqual([{ ...orphan, mintPending: false }]);
  expect(db.member).toEqual([
    expect.objectContaining({ userId: 'user_1', organizationId: 'org_orphan', role: 'owner' }),
  ]);
  expect(result.data.activeOrganizationId).toBe('org_orphan');
});

test.each([
  ['everyone has left', { id: 'org_left', slug: 'org-user_1', mintPending: false }, []],
  ['was never marked', { id: 'org_unmarked', slug: 'org-user_1' }, []],
  [
    'has other members',
    { id: 'org_handed_over', slug: 'org-user_1', mintPending: false },
    [{ id: 'm_other', userId: 'user_2', organizationId: 'org_handed_over', role: 'owner' }],
  ],
])(
  'tenant: an organization on the user slug that %s is never joined - a fresh one is minted on the next slug',
  async (_, organization, members) => {
    const { auth, db } = createMemoryAuth({ organizations: [organization], members });
    const result = await mintHook(auth)({ userId: 'user_1' });
    const fresh = db.organization.find((row) => row.slug === 'org-user_1-2');
    expect(fresh).toEqual(expect.objectContaining({ mintPending: false }));
    expect(db.member.filter((row) => row.userId === 'user_1')).toEqual([
      expect.objectContaining({ organizationId: fresh.id, role: 'owner' }),
    ]);
    expect(result.data.activeOrganizationId).toBe(fresh.id);
  }
);

test('tenant: a user already holding the owner row of a marked organization clears the marker without a second row', async () => {
  const organization = {
    id: 'org_own',
    slug: 'org-user_1',
    mintPending: true,
    createdAt: new Date(),
  };
  const member = { id: 'm_1', userId: 'user_1', organizationId: 'org_own', role: 'owner' };
  const { auth, adapter, db } = createMemoryAuth({ organizations: [organization] });
  // The membership read at the top of the hook ran before the concurrent
  // session wrote this row.
  adapter.findMany.mockResolvedValueOnce([]);
  db.member.push(member);
  const result = await mintHook(auth)({ userId: 'user_1' });
  expect(db.member).toEqual([member]);
  expect(db.organization).toEqual([{ ...organization, mintPending: false }]);
  expect(result.data.activeOrganizationId).toBe('org_own');
});

test('tenant: two sessions that both see no members and both write the owner row end with one row', async () => {
  const { auth, db, before } = createMemoryAuth();
  const hook = mintHook(auth);
  const isMemberWrite = (operation, { model }) => operation === 'create' && model === 'member';
  // Both sessions pass the member read and stop right before the member write.
  const aMemberWrite = before(isMemberWrite);
  const a = hook({ userId: 'user_1' });
  await aMemberWrite.reached;
  const bMemberWrite = before(isMemberWrite);
  const b = hook({ userId: 'user_1' });
  await bMemberWrite.reached;
  aMemberWrite.release();
  await a;
  bMemberWrite.release();
  expect(await b).toEqual(await a);
  expect(db.organization).toEqual([expect.objectContaining({ mintPending: false })]);
  expect(db.member).toEqual([expect.objectContaining({ userId: 'user_1', role: 'owner' })]);
});

test('tenant: a session reading members between the other session organization and member writes joins the same organization', async () => {
  const { auth, db, before } = createMemoryAuth();
  const hook = mintHook(auth);
  // A has written the organization and stops before its member write. B finds
  // the marked organization with no member, writes the owner row, and A's
  // member write then loses on the unique index and reads B's row.
  const aMemberWrite = before(
    (operation, { model }) => operation === 'create' && model === 'member'
  );
  const a = hook({ userId: 'user_1' });
  await aMemberWrite.reached;
  const b = await hook({ userId: 'user_1' });
  expect(db.member).toHaveLength(1);
  aMemberWrite.release();
  expect(await a).toEqual(b);
  expect(db.organization).toEqual([expect.objectContaining({ mintPending: false })]);
  expect(db.member).toEqual([expect.objectContaining({ userId: 'user_1', role: 'owner' })]);
});

test('tenant: a mint losing the unique slug race joins the winning organization', async () => {
  const { auth, db, before } = createMemoryAuth();
  const hook = mintHook(auth);
  // Both sessions find no organization; A's create then loses to B's.
  const aOrganizationWrite = before(
    (operation, { model }) => operation === 'create' && model === 'organization'
  );
  const a = hook({ userId: 'user_1' });
  await aOrganizationWrite.reached;
  const b = await hook({ userId: 'user_1' });
  aOrganizationWrite.release();
  expect(await a).toEqual(b);
  expect(db.organization).toHaveLength(1);
  expect(db.member).toHaveLength(1);
});

test('tenant: while the unique indexes can not be ensured, repeated sign-ins are refused without retrying the index build until the cool-down passes', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-01-01T00:00:00Z'));
  try {
    const ensureUniqueIndexes = jest.fn(async () => {
      throw new Error('E11000 duplicate key error collection: user-members');
    });
    const { auth, db } = createMemoryAuth({ ensureUniqueIndexes });
    const hook = mintHook(auth);
    for (const userId of ['user_1', 'user_2', 'user_3', 'user_4']) {
      await expect(hook({ userId })).rejects.toMatchObject({
        statusCode: 503,
        body: { code: 'ORGANIZATION_SETUP_UNAVAILABLE' },
      });
    }
    expect(ensureUniqueIndexes).toHaveBeenCalledTimes(1);
    expect(db.organization).toEqual([]);
    now.mockReturnValue(Date.parse('2026-01-01T00:00:31Z'));
    await expect(hook({ userId: 'user_5' })).rejects.toMatchObject({ statusCode: 503 });
    expect(ensureUniqueIndexes).toHaveBeenCalledTimes(2);
  } finally {
    now.mockRestore();
  }
});

test.each([
  [
    'minted long ago - its owner row was written and everyone later left',
    { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
    [],
  ],
  [
    'that other people belong to',
    { createdAt: new Date() },
    [{ id: 'm_other', userId: 'user_2', organizationId: 'org_stale', role: 'owner' }],
  ],
])(
  'tenant: a stale mint marker on an organization %s is cleared and the organization is not joined',
  async (_, organizationFields, members) => {
    const organization = {
      id: 'org_stale',
      slug: 'org-user_1',
      mintPending: true,
      ...organizationFields,
    };
    const { auth, db } = createMemoryAuth({ organizations: [organization], members });
    const result = await mintHook(auth)({ userId: 'user_1' });
    expect(db.organization.find((row) => row.id === 'org_stale').mintPending).toBe(false);
    const fresh = db.organization.find((row) => row.slug === 'org-user_1-2');
    expect(result.data.activeOrganizationId).toBe(fresh.id);
    expect(db.member.filter((row) => row.userId === 'user_1')).toEqual([
      expect.objectContaining({ organizationId: fresh.id, role: 'owner' }),
    ]);
  }
);

test('tenant: the mint ensures the unique indexes in model terms before writing', async () => {
  const { auth, adapter } = createMemoryAuth();
  await mintHook(auth)({ userId: 'user_1' });
  expect(adapter.options.ensureUniqueIndexes).toHaveBeenCalledWith({
    indexes: [
      { model: 'organization', fields: ['slug'] },
      { model: 'member', fields: ['userId', 'organizationId'] },
    ],
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
