/*
  Copyright 2020-2024 Lowdefy, Inc

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

import PageCache from './pageCache.mjs';

test('isCompiled returns false for uncompiled page', () => {
  const cache = new PageCache();
  expect(cache.isCompiled('home')).toBe(false);
});

test('isCompiled returns true after markCompiled', () => {
  const cache = new PageCache();
  cache.markCompiled('home');
  expect(cache.isCompiled('home')).toBe(true);
});

test('invalidateAll clears all compiled pages', () => {
  const cache = new PageCache();
  cache.markCompiled('home');
  cache.markCompiled('dashboard');
  cache.invalidateAll();
  expect(cache.isCompiled('home')).toBe(false);
  expect(cache.isCompiled('dashboard')).toBe(false);
});

test('invalidatePages removes specific pages', () => {
  const cache = new PageCache();
  cache.markCompiled('home');
  cache.markCompiled('dashboard');
  cache.markCompiled('settings');
  cache.invalidatePages(['home', 'settings']);
  expect(cache.isCompiled('home')).toBe(false);
  expect(cache.isCompiled('dashboard')).toBe(true);
  expect(cache.isCompiled('settings')).toBe(false);
});

test('invalidateByFiles returns affected pages and invalidates them', () => {
  const cache = new PageCache();
  cache.markCompiled('home');
  cache.markCompiled('dashboard');

  const fileDependencyMap = new Map([
    ['pages/home/blocks.yaml', new Set(['home'])],
    ['shared/layout.yaml', new Set(['home', 'dashboard'])],
  ]);

  const affected = cache.invalidateByFiles(['pages/home/blocks.yaml'], fileDependencyMap);
  expect(affected).toEqual(new Set(['home']));
  expect(cache.isCompiled('home')).toBe(false);
  expect(cache.isCompiled('dashboard')).toBe(true);
});

test('invalidateByFiles handles shared files affecting multiple pages', () => {
  const cache = new PageCache();
  cache.markCompiled('home');
  cache.markCompiled('dashboard');

  const fileDependencyMap = new Map([
    ['shared/layout.yaml', new Set(['home', 'dashboard'])],
  ]);

  const affected = cache.invalidateByFiles(['shared/layout.yaml'], fileDependencyMap);
  expect(affected).toEqual(new Set(['home', 'dashboard']));
  expect(cache.isCompiled('home')).toBe(false);
  expect(cache.isCompiled('dashboard')).toBe(false);
});

test('invalidateByFiles returns empty set for unknown files', () => {
  const cache = new PageCache();
  cache.markCompiled('home');

  const fileDependencyMap = new Map();
  const affected = cache.invalidateByFiles(['unknown.yaml'], fileDependencyMap);
  expect(affected).toEqual(new Set());
  expect(cache.isCompiled('home')).toBe(true);
});

test('acquireBuildLock returns true for first request', async () => {
  const cache = new PageCache();
  const shouldBuild = await cache.acquireBuildLock('home');
  expect(shouldBuild).toBe(true);
  cache.releaseBuildLock('home');
});

test('acquireBuildLock returns false for concurrent request (waits for first)', async () => {
  const cache = new PageCache();

  // First request acquires lock
  const shouldBuild1 = await cache.acquireBuildLock('home');
  expect(shouldBuild1).toBe(true);

  // Second request waits for lock and returns false
  const promise2 = cache.acquireBuildLock('home');

  // Release first lock
  cache.releaseBuildLock('home');

  const shouldBuild2 = await promise2;
  expect(shouldBuild2).toBe(false);
});

test('acquireBuildLock for different pages does not block', async () => {
  const cache = new PageCache();

  const shouldBuild1 = await cache.acquireBuildLock('home');
  const shouldBuild2 = await cache.acquireBuildLock('dashboard');

  expect(shouldBuild1).toBe(true);
  expect(shouldBuild2).toBe(true);

  cache.releaseBuildLock('home');
  cache.releaseBuildLock('dashboard');
});

test('releaseBuildLock does nothing for non-existent lock', () => {
  const cache = new PageCache();
  // Should not throw
  cache.releaseBuildLock('nonexistent');
});

test('acquireSkeletonLock waits for page builds', async () => {
  const cache = new PageCache();
  const buildOrder = [];

  // Start a page build
  await cache.acquireBuildLock('home');

  // Start skeleton lock acquisition (should wait)
  const skeletonPromise = cache.acquireSkeletonLock().then(() => {
    buildOrder.push('skeleton-acquired');
  });

  // Release page build
  buildOrder.push('page-released');
  cache.releaseBuildLock('home');

  await skeletonPromise;
  expect(buildOrder).toEqual(['page-released', 'skeleton-acquired']);
  cache.releaseSkeletonLock();
});

test('acquireBuildLock waits for skeleton lock', async () => {
  const cache = new PageCache();
  const buildOrder = [];

  // Acquire skeleton lock
  await cache.acquireSkeletonLock();

  // Start page build (should wait for skeleton)
  const pagePromise = cache.acquireBuildLock('home').then((result) => {
    buildOrder.push('page-acquired');
    return result;
  });

  // Release skeleton
  buildOrder.push('skeleton-released');
  cache.releaseSkeletonLock();

  const shouldBuild = await pagePromise;
  expect(shouldBuild).toBe(true);
  expect(buildOrder).toEqual(['skeleton-released', 'page-acquired']);
  cache.releaseBuildLock('home');
});

test('releaseSkeletonLock does nothing when no lock exists', () => {
  const cache = new PageCache();
  // Should not throw
  cache.releaseSkeletonLock();
});
