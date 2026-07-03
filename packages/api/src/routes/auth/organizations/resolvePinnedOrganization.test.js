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

import getOrganizationBinding, {
  registerOrganizationBinding,
} from './getOrganizationBinding.js';
import resolvePinnedOrganization from './resolvePinnedOrganization.js';

function createMockAuth({ create = jest.fn(), findOne = jest.fn() } = {}) {
  return {
    $context: Promise.resolve({ adapter: { create, findOne } }),
  };
}

test('resolvePinnedOrganization ensures and retains the pinned org for the binding', async () => {
  const findOne = jest
    .fn()
    .mockResolvedValue({ id: 'org_1', slug: 'org-a', name: 'org-a', createdAt: new Date() });
  const auth = createMockAuth({ findOne });
  registerOrganizationBinding({
    auth,
    database: true,
    organizations: { policy: 'pinned', org: 'org-a' },
  });
  await resolvePinnedOrganization({ auth });
  expect(findOne).toHaveBeenCalledTimes(1);
  expect(getOrganizationBinding({ auth })).toEqual({
    policy: 'pinned',
    pinned: { id: 'org_1', slug: 'org-a', name: 'org-a' },
  });
});

test('resolvePinnedOrganization is a no-op once the pinned org is retained', async () => {
  const findOne = jest
    .fn()
    .mockResolvedValue({ id: 'org_1', slug: 'org-a', name: 'org-a', createdAt: new Date() });
  const auth = createMockAuth({ findOne });
  registerOrganizationBinding({
    auth,
    database: true,
    organizations: { policy: 'pinned', org: 'org-a' },
  });
  await resolvePinnedOrganization({ auth });
  await resolvePinnedOrganization({ auth });
  expect(findOne).toHaveBeenCalledTimes(1);
});

test('resolvePinnedOrganization does nothing under the tenant policy', async () => {
  const findOne = jest.fn();
  const auth = createMockAuth({ findOne });
  registerOrganizationBinding({
    auth,
    database: true,
    organizations: { policy: 'tenant' },
  });
  await resolvePinnedOrganization({ auth });
  expect(findOne).not.toHaveBeenCalled();
  expect(getOrganizationBinding({ auth })).toEqual({ policy: 'tenant', pinned: null });
});

test('resolvePinnedOrganization does nothing without a database', async () => {
  const findOne = jest.fn();
  const auth = createMockAuth({ findOne });
  registerOrganizationBinding({
    auth,
    database: false,
    organizations: { policy: 'pinned', org: 'org-a' },
  });
  await resolvePinnedOrganization({ auth });
  expect(findOne).not.toHaveBeenCalled();
});

test('resolvePinnedOrganization does nothing for null or unregistered auth', async () => {
  await expect(resolvePinnedOrganization({ auth: null })).resolves.toBeUndefined();
  const auth = createMockAuth();
  await expect(resolvePinnedOrganization({ auth })).resolves.toBeUndefined();
});

test('resolvePinnedOrganization swallows an ensure failure and leaves the binding unresolved', async () => {
  const findOne = jest.fn().mockRejectedValue(new Error('db down'));
  const auth = createMockAuth({ findOne });
  registerOrganizationBinding({
    auth,
    database: true,
    organizations: { policy: 'pinned', org: 'org-a' },
  });
  await expect(resolvePinnedOrganization({ auth })).resolves.toBeUndefined();
  expect(getOrganizationBinding({ auth })).toEqual({ policy: 'pinned', pinned: null });
});
