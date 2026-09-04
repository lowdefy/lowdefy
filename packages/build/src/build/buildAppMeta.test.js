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

import testContext from '../test-utils/testContext.js';

const mockGetRefContent = jest.fn();
jest.unstable_mockModule('./buildRefs/getRefContent.js', () => ({
  default: mockGetRefContent,
}));

const { default: buildAppMeta } = await import('./buildAppMeta.js');

function makeContext() {
  const context = testContext();
  context.errors = [];
  return context;
}

const originalEnvShaPresent = Object.prototype.hasOwnProperty.call(process.env, 'LOWDEFY_GIT_SHA');
const originalEnvSha = process.env.LOWDEFY_GIT_SHA;

beforeEach(() => {
  mockGetRefContent.mockReset();
  process.env.LOWDEFY_GIT_SHA = 'test-sha';
});

afterAll(() => {
  if (originalEnvShaPresent) {
    process.env.LOWDEFY_GIT_SHA = originalEnvSha;
  } else {
    delete process.env.LOWDEFY_GIT_SHA;
  }
});

test('buildAppMeta resolves literal root metadata into context.appMeta', async () => {
  mockGetRefContent.mockResolvedValue({
    slug: 'my-app',
    name: 'My App',
    version: '1.2.3',
    description: 'Useful.',
    license: 'MIT',
    lowdefy: '5.0.0',
  });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta).toEqual({
    slug: 'my-app',
    name: 'My App',
    version: '1.2.3',
    description: 'Useful.',
    license: 'MIT',
    lowdefyVersion: '5.0.0',
    gitSha: 'test-sha',
  });
  expect(context.errors).toEqual([]);
});

test('buildAppMeta sets unset fields to null', async () => {
  mockGetRefContent.mockResolvedValue({ lowdefy: '5.0.0' });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta).toEqual({
    slug: null,
    name: null,
    version: null,
    description: null,
    license: null,
    lowdefyVersion: '5.0.0',
    gitSha: 'test-sha',
  });
  expect(context.errors).toEqual([]);
});

test('buildAppMeta does not throw on unset slug', async () => {
  mockGetRefContent.mockResolvedValue({ lowdefy: '5.0.0' });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.slug).toBeNull();
  expect(context.errors).toEqual([]);
});

test('buildAppMeta pre-resolves _build.env in a root scalar', async () => {
  process.env.TEST_APP_SLUG = 'env-slug';
  mockGetRefContent.mockResolvedValue({
    slug: { '_build.env': 'TEST_APP_SLUG' },
    lowdefy: '5.0.0',
  });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.slug).toBe('env-slug');
  expect(context.errors).toEqual([]);
  delete process.env.TEST_APP_SLUG;
});

test('buildAppMeta resolves an unset _build.env to null', async () => {
  delete process.env.TEST_MISSING_ENV;
  mockGetRefContent.mockResolvedValue({
    name: { '_build.env': 'TEST_MISSING_ENV' },
    lowdefy: '5.0.0',
  });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.name).toBeNull();
  expect(context.errors).toEqual([]);
});

test('buildAppMeta rejects _build.app in a root scalar (self-reference)', async () => {
  mockGetRefContent.mockResolvedValue({
    slug: { '_build.app': 'slug' },
    lowdefy: '5.0.0',
  });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.slug).toBeNull();
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/cannot use `_build.app`/);
});

test('buildAppMeta rejects a _ref operator in a root scalar', async () => {
  mockGetRefContent.mockResolvedValue({
    slug: { _ref: 'slug.yaml' },
    lowdefy: '5.0.0',
  });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.slug).toBeNull();
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/must be a literal or a `_build\.\*` operator/);
});

test('buildAppMeta rejects a static _ operator in a root scalar', async () => {
  mockGetRefContent.mockResolvedValue({
    name: { _string: { concat: ['a', 'b'] } },
    lowdefy: '5.0.0',
  });
  const context = makeContext();
  await buildAppMeta({ context });
  expect(context.appMeta.name).toBeNull();
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/must be a literal or a `_build\.\*` operator/);
});
