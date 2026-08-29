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

import ensureOrganization from './ensureOrganization.js';
import getOrganizationBinding, { registerOrganizationBinding } from './getOrganizationBinding.js';
import OrganizationKeyError from './OrganizationKeyError.js';

function createMockAuth({ findOne, create }) {
  return {
    $context: Promise.resolve({ adapter: { findOne, create } }),
  };
}

test('ensureOrganization returns the existing org and creates nothing', async () => {
  const existing = { id: 'team-portal', slug: 'team-portal' };
  const findOne = jest.fn(async () => existing);
  const create = jest.fn();
  const auth = createMockAuth({ findOne, create });

  const org = await ensureOrganization({ auth, slug: 'team-portal' });

  expect(org).toBe(existing);
  expect(findOne).toHaveBeenCalledWith({
    model: 'organization',
    where: [{ field: 'slug', value: 'team-portal' }],
  });
  expect(create).not.toHaveBeenCalled();
});

test('ensureOrganization creates the org keyed by its slug when none exists with that slug', async () => {
  const findOne = jest.fn(async () => null);
  const create = jest.fn(async ({ data }) => ({ ...data }));
  const auth = createMockAuth({ findOne, create });

  const org = await ensureOrganization({ auth, slug: 'fresh-app' });

  // forceAllowId is a sibling of data in the adapter factory's create
  // signature, not a key inside it - without it the factory drops the id.
  expect(create).toHaveBeenCalledWith({
    model: 'organization',
    data: {
      id: 'fresh-app',
      name: 'fresh-app',
      slug: 'fresh-app',
      createdAt: expect.any(Date),
    },
    forceAllowId: true,
  });
  expect(org.id).toBe('fresh-app');
});

test('ensureOrganization memoizes per auth instance and slug', async () => {
  const findOne = jest.fn(async () => ({ id: 'team-portal', slug: 'team-portal' }));
  const auth = createMockAuth({ findOne, create: jest.fn() });

  const first = await ensureOrganization({ auth, slug: 'team-portal' });
  const second = await ensureOrganization({ auth, slug: 'team-portal' });

  expect(first).toBe(second);
  expect(findOne).toHaveBeenCalledTimes(1);
});

test('ensureOrganization reads the winning row when a racing instance created the org first', async () => {
  const winner = { id: 'team-portal', slug: 'team-portal' };
  const findOne = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
  const create = jest.fn(async () => {
    throw new Error('E11000 duplicate key error');
  });
  const auth = createMockAuth({ findOne, create });

  const org = await ensureOrganization({ auth, slug: 'team-portal' });

  expect(org).toBe(winner);
});

test('ensureOrganization does not memoize a failure', async () => {
  const findOne = jest
    .fn()
    .mockRejectedValueOnce(new Error('connection refused'))
    .mockResolvedValueOnce({ id: 'team-portal', slug: 'team-portal' });
  const auth = createMockAuth({ findOne, create: jest.fn() });

  await expect(ensureOrganization({ auth, slug: 'team-portal' })).rejects.toThrow(
    'connection refused'
  );
  const org = await ensureOrganization({ auth, slug: 'team-portal' });
  expect(org.id).toBe('team-portal');
});

test('ensureOrganization pins the resolved organization on the binding after a successful ensure', async () => {
  const existing = { id: 'team-portal', slug: 'team-portal', name: 'team-portal' };
  const findOne = jest.fn(async () => existing);
  const auth = createMockAuth({ findOne, create: jest.fn() });
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'team-portal' } });

  await ensureOrganization({ auth, slug: 'team-portal' });

  expect(getOrganizationBinding({ auth })).toEqual({
    policy: 'pinned',
    pinned: { id: 'team-portal', slug: 'team-portal', name: 'team-portal' },
  });
});

test('ensureOrganization throws when the existing org is keyed by an id that is not its slug', async () => {
  const findOne = jest.fn(async () => ({
    id: '0f1b3a2c-5d6e-4f70-8a9b-1c2d3e4f5a6b',
    slug: 'team-portal',
  }));
  const create = jest.fn();
  const auth = createMockAuth({ findOne, create });

  const promise = ensureOrganization({ auth, slug: 'team-portal' });

  await expect(promise).rejects.toThrow(OrganizationKeyError);
  await expect(promise).rejects.toThrow(
    'The organization with slug "team-portal" is keyed by id "0f1b3a2c-5d6e-4f70-8a9b-1c2d3e4f5a6b", ' +
      'not by its slug. Under the "pinned" organizations policy the organization id must equal its slug. ' +
      'Re-key the organization row and every member.organizationId / invitation.organizationId that ' +
      'references it, and delete the user-sessions collection (session.activeOrganizationId is a stored ' +
      'field holding the old id).'
  );
  expect(create).not.toHaveBeenCalled();
});

test('ensureOrganization throws when the racing winner is keyed by an id that is not its slug', async () => {
  const findOne = jest
    .fn()
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ id: '0f1b3a2c-5d6e-4f70-8a9b-1c2d3e4f5a6b', slug: 'team-portal' });
  const create = jest.fn(async () => {
    throw new Error('E11000 duplicate key error');
  });
  const auth = createMockAuth({ findOne, create });

  await expect(ensureOrganization({ auth, slug: 'team-portal' })).rejects.toThrow(
    OrganizationKeyError
  );
});

test('ensureOrganization retries the adapter after a mis-keyed row is re-keyed', async () => {
  const findOne = jest
    .fn()
    .mockResolvedValueOnce({ id: '0f1b3a2c-5d6e-4f70-8a9b-1c2d3e4f5a6b', slug: 'team-portal' })
    .mockResolvedValueOnce({ id: 'team-portal', slug: 'team-portal' });
  const auth = createMockAuth({ findOne, create: jest.fn() });

  await expect(ensureOrganization({ auth, slug: 'team-portal' })).rejects.toThrow(
    OrganizationKeyError
  );
  const org = await ensureOrganization({ auth, slug: 'team-portal' });

  expect(org.id).toBe('team-portal');
  expect(findOne).toHaveBeenCalledTimes(2);
});
