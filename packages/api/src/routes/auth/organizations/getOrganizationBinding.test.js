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

import getOrganizationBinding, {
  registerOrganizationBinding,
  setPinnedOrganization,
} from './getOrganizationBinding.js';

test('getOrganizationBinding returns the registered policy with no pinned org yet', () => {
  const auth = {};
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'default' } });

  expect(getOrganizationBinding({ auth })).toEqual({ policy: 'pinned', pinned: null });
});

test('setPinnedOrganization retains the id, slug and name of the ensured organization', () => {
  const auth = {};
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'default' } });

  setPinnedOrganization({
    auth,
    organization: { id: 'org_1', slug: 'default', name: 'Default', extra: 'dropped' },
    slug: 'default',
  });

  expect(getOrganizationBinding({ auth })).toEqual({
    policy: 'pinned',
    pinned: { id: 'org_1', slug: 'default', name: 'Default' },
  });
});

test('setPinnedOrganization is ignored when the slug does not match the registered slug', () => {
  const auth = {};
  registerOrganizationBinding({ auth, organizations: { policy: 'pinned', org: 'default' } });

  setPinnedOrganization({
    auth,
    organization: { id: 'org_1', slug: 'other', name: 'Other' },
    slug: 'other',
  });

  expect(getOrganizationBinding({ auth })).toEqual({ policy: 'pinned', pinned: null });
});

test('setPinnedOrganization is ignored when the registered policy is not pinned', () => {
  const auth = {};
  registerOrganizationBinding({ auth, organizations: { policy: 'tenant', org: 'default' } });

  setPinnedOrganization({
    auth,
    organization: { id: 'org_1', slug: 'default', name: 'Default' },
    slug: 'default',
  });

  expect(getOrganizationBinding({ auth })).toEqual({ policy: 'tenant', pinned: null });
});

test('getOrganizationBinding returns null when auth is null', () => {
  expect(getOrganizationBinding({ auth: null })).toBeNull();
});

test('getOrganizationBinding returns null when auth is undefined', () => {
  expect(getOrganizationBinding({ auth: undefined })).toBeNull();
});

test('getOrganizationBinding returns null for an auth instance that was never registered', () => {
  const auth = {};
  expect(getOrganizationBinding({ auth })).toBeNull();
});

test('setPinnedOrganization is a no-op for an auth instance that was never registered', () => {
  const auth = {};
  setPinnedOrganization({
    auth,
    organization: { id: 'org_1', slug: 'default', name: 'Default' },
    slug: 'default',
  });

  expect(getOrganizationBinding({ auth })).toBeNull();
});
