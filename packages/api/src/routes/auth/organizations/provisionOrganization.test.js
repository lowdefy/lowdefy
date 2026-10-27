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

import createMemoryAuth from '../../../test/createMemoryAuth.js';
import provisionOrganization from './provisionOrganization.js';
import { registerOrganizationBinding } from './getOrganizationBinding.js';

const logger = { error: vi.fn(), warn: vi.fn() };

function setup({ creatorAppRoles = [], ...database } = {}) {
  const memory = createMemoryAuth(database);
  registerOrganizationBinding({
    auth: memory.auth,
    database: true,
    organizations: { policy: 'tenant', creatorAppRoles },
  });
  return memory;
}

test('provisionOrganization writes the organization and its owner row holding creatorAppRoles, and clears the marker', async () => {
  const { auth, db } = setup({ creatorAppRoles: ['workspace-admin'] });
  const result = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
    userId: 'user_9',
  });
  expect(db.organization).toEqual([
    expect.objectContaining({ slug: 'org-one', mintPending: false, mintCreatorId: 'user_9' }),
  ]);
  expect(db.member).toEqual([
    expect.objectContaining({
      userId: 'user_9',
      organizationId: db.organization[0].id,
      role: 'owner',
      appRoles: ['workspace-admin'],
    }),
  ]);
  expect(result.member).toEqual(db.member[0]);
  expect(result.organization).toEqual({
    id: db.organization[0].id,
    name: 'Org One',
    slug: 'org-one',
    createdAt: expect.any(Date),
  });
});

test('provisionOrganization stores metadata as a JSON string and returns it parsed', async () => {
  const { auth, db } = setup();
  const result = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one', metadata: { tier: 'gold' } },
    userId: 'user_9',
  });
  expect(db.organization[0].metadata).toBe('{"tier":"gold"}');
  expect(result.organization.metadata).toEqual({ tier: 'gold' });
});

test('provisionOrganization without a creator writes one unmarked organization and no member', async () => {
  const { auth, db } = setup({ creatorAppRoles: ['workspace-admin'] });
  const result = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
  });
  expect(db.organization).toEqual([
    { id: db.organization[0].id, name: 'Org One', slug: 'org-one', createdAt: expect.any(Date) },
  ]);
  expect(db.member).toEqual([]);
  expect(result).toEqual({ organization: db.organization[0], member: null });
});

test.each([
  ['with a creator', 'user_9'],
  ['without a creator', undefined],
])('provisionOrganization %s refuses a slug an organization already holds', async (_, userId) => {
  const existing = { id: 'org_0', name: 'Taken', slug: 'org-one', createdAt: new Date() };
  const { auth, db } = setup({ organizations: [existing] });
  const result = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
    userId,
  });
  expect(result).toBeNull();
  expect(db.organization).toEqual([existing]);
  expect(db.member).toEqual([]);
});

test('provisionOrganization refuses a slug held by an organization the creator already belongs to', async () => {
  const existing = { id: 'org_0', name: 'Taken', slug: 'org-one', createdAt: new Date() };
  const member = { id: 'm_0', userId: 'user_9', organizationId: 'org_0', role: 'member' };
  const { auth, db } = setup({ organizations: [existing], members: [member] });
  const result = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
    userId: 'user_9',
  });
  expect(result).toBeNull();
  expect(db.member).toEqual([member]);
});

test('provisionOrganization run again by the same creator finishes an organization a failed owner write left without an owner', async () => {
  const orphan = {
    id: 'org_orphan',
    name: 'Org One',
    slug: 'org-one',
    mintPending: true,
    mintCreatorId: 'user_9',
    createdAt: new Date(),
  };
  const { auth, db } = setup({ organizations: [orphan] });
  const result = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
    userId: 'user_9',
  });
  expect(db.organization).toEqual([{ ...orphan, mintPending: false }]);
  expect(db.member).toEqual([
    expect.objectContaining({ userId: 'user_9', organizationId: 'org_orphan', role: 'owner' }),
  ]);
  expect(result.organization.id).toBe('org_orphan');
});

test('provisionOrganization never joins or clears another creator mint in progress', async () => {
  const inProgress = {
    id: 'org_other',
    name: 'Org One',
    slug: 'org-one',
    mintPending: true,
    mintCreatorId: 'user_1',
    createdAt: new Date(),
  };
  const { auth, db } = setup({ organizations: [inProgress] });
  const result = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
    userId: 'user_9',
  });
  expect(result).toBeNull();
  expect(db.organization).toEqual([inProgress]);
  expect(db.member).toEqual([]);
});

test('provisionOrganization lets only one of two creators racing for a slug become its owner', async () => {
  const { auth, db, before } = setup();
  // A writes the organization and stops before its owner write. B then finds
  // A's marked organization and is refused.
  const aMemberWrite = before(
    (operation, { model }) => operation === 'create' && model === 'member'
  );
  const a = provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
    userId: 'user_1',
  });
  await aMemberWrite.reached;
  const b = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org One', slug: 'org-one' },
    userId: 'user_9',
  });
  aMemberWrite.release();
  expect(b).toBeNull();
  expect((await a).member).toEqual(expect.objectContaining({ userId: 'user_1', role: 'owner' }));
  expect(db.organization).toEqual([expect.objectContaining({ mintPending: false })]);
  expect(db.member).toEqual([expect.objectContaining({ userId: 'user_1', role: 'owner' })]);
});

test('provisionOrganization without a creator refuses a slug that a racing write takes first', async () => {
  const { auth, db, before } = setup();
  const aOrganizationWrite = before(
    (operation, { model }) => operation === 'create' && model === 'organization'
  );
  const a = provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org A', slug: 'org-one' },
  });
  await aOrganizationWrite.reached;
  const b = await provisionOrganization({
    auth,
    logger,
    organization: { name: 'Org B', slug: 'org-one' },
  });
  aOrganizationWrite.release();
  expect(b.organization.name).toBe('Org B');
  expect(await a).toBeNull();
  expect(db.organization).toHaveLength(1);
});

test('provisionOrganization writes nothing while the unique indexes can not be ensured', async () => {
  const ensureUniqueIndexes = vi.fn(async () => {
    throw new Error('not authorized to create index');
  });
  const { auth, db } = setup({ ensureUniqueIndexes });
  await expect(
    provisionOrganization({
      auth,
      logger,
      organization: { name: 'Org One', slug: 'org-one' },
      userId: 'user_9',
    })
  ).rejects.toThrow('missing a unique index');
  expect(db.organization).toEqual([]);
  expect(db.member).toEqual([]);
});
