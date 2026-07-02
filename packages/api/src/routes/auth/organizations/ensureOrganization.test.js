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

function createMockAuth({ findOne, create }) {
  return {
    $context: Promise.resolve({ adapter: { findOne, create } }),
  };
}

test('ensureOrganization returns the existing org and creates nothing', async () => {
  const existing = { id: 'org_1', slug: 'team-portal' };
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

test('ensureOrganization creates the org when none exists with that slug', async () => {
  const findOne = jest.fn(async () => null);
  const create = jest.fn(async ({ data }) => ({ id: 'org_new', ...data }));
  const auth = createMockAuth({ findOne, create });

  const org = await ensureOrganization({ auth, slug: 'fresh-app' });

  expect(create).toHaveBeenCalledWith({
    model: 'organization',
    data: {
      name: 'fresh-app',
      slug: 'fresh-app',
      createdAt: expect.any(Date),
    },
  });
  expect(org.id).toBe('org_new');
});

test('ensureOrganization memoizes per auth instance and slug', async () => {
  const findOne = jest.fn(async () => ({ id: 'org_1', slug: 'team-portal' }));
  const auth = createMockAuth({ findOne, create: jest.fn() });

  const first = await ensureOrganization({ auth, slug: 'team-portal' });
  const second = await ensureOrganization({ auth, slug: 'team-portal' });

  expect(first).toBe(second);
  expect(findOne).toHaveBeenCalledTimes(1);
});

test('ensureOrganization reads the winning row when a racing instance created the org first', async () => {
  const winner = { id: 'org_winner', slug: 'team-portal' };
  const findOne = jest
    .fn()
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(winner);
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
    .mockResolvedValueOnce({ id: 'org_1', slug: 'team-portal' });
  const auth = createMockAuth({ findOne, create: jest.fn() });

  await expect(ensureOrganization({ auth, slug: 'team-portal' })).rejects.toThrow(
    'connection refused'
  );
  const org = await ensureOrganization({ auth, slug: 'team-portal' });
  expect(org.id).toBe('org_1');
});
