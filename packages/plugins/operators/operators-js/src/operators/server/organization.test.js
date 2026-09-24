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

jest.unstable_mockModule('@lowdefy/operators', () => ({
  getFromObject: jest.fn(),
}));

test('organization calls getFromObject with the pinned organization for "id"', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const organization = (await import('./organization.js')).default;
  organization({
    location: 'location',
    organization: {
      policy: 'pinned',
      pinned: { id: 'org_1', slug: 'default', name: 'Default' },
    },
    params: 'id',
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        location: 'location',
        object: { id: 'org_1', slug: 'default', name: 'Default' },
        operator: '_organization',
        params: 'id',
      },
    ],
  ]);
});

test('organization calls getFromObject with the pinned organization for "slug"', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const organization = (await import('./organization.js')).default;
  organization({
    location: 'location',
    organization: {
      policy: 'pinned',
      pinned: { id: 'org_1', slug: 'default', name: 'Default' },
    },
    params: 'slug',
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        location: 'location',
        object: { id: 'org_1', slug: 'default', name: 'Default' },
        operator: '_organization',
        params: 'slug',
      },
    ],
  ]);
});

test('organization calls getFromObject with the pinned organization for "name"', async () => {
  const lowdefyOperators = await import('@lowdefy/operators');
  const organization = (await import('./organization.js')).default;
  organization({
    location: 'location',
    organization: {
      policy: 'pinned',
      pinned: { id: 'org_1', slug: 'default', name: 'Default' },
    },
    params: 'name',
  });
  expect(lowdefyOperators.getFromObject.mock.calls).toEqual([
    [
      {
        location: 'location',
        object: { id: 'org_1', slug: 'default', name: 'Default' },
        operator: '_organization',
        params: 'name',
      },
    ],
  ]);
});

test('organization throws when organization is undefined', async () => {
  const organization = (await import('./organization.js')).default;
  expect(() =>
    organization({ location: 'location', organization: undefined, params: 'id' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_organization requires auth organizations to be configured - no organizations state is available."`
  );
});

test('organization throws when organization is null', async () => {
  const organization = (await import('./organization.js')).default;
  expect(() =>
    organization({ location: 'location', organization: null, params: 'id' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_organization requires auth organizations to be configured - no organizations state is available."`
  );
});

test('organization throws under the "tenant" organizations policy', async () => {
  const organization = (await import('./organization.js')).default;
  expect(() =>
    organization({
      location: 'location',
      organization: { policy: 'tenant' },
      params: 'id',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_organization cannot resolve under the \\"tenant\\" organizations policy - there is no single pinned organization. Pass an explicit organization id instead."`
  );
});

test('organization throws when the pinned organization has not been resolved', async () => {
  const organization = (await import('./organization.js')).default;
  expect(() =>
    organization({
      location: 'location',
      organization: { policy: 'pinned', pinned: null },
      params: 'id',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"The pinned organization has not been resolved - the startup ensure has not completed or failed."`
  );
});

test('organization throws a ConfigError when organizations are not configured', async () => {
  const organization = (await import('./organization.js')).default;
  expect(() =>
    organization({ location: 'location', organization: undefined, params: 'id' })
  ).toThrow(expect.objectContaining({ name: 'ConfigError' }));
});

test('organization throws a LowdefyInternalError when the pinned organization is unresolved', async () => {
  const organization = (await import('./organization.js')).default;
  expect(() =>
    organization({
      location: 'location',
      organization: { policy: 'pinned', pinned: null },
      params: 'id',
    })
  ).toThrow(expect.objectContaining({ name: 'LowdefyInternalError' }));
});
