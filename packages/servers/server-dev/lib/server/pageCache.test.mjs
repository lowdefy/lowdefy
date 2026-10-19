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

import PageCache from './pageCache.mjs';

test('isCompiled returns false for uncompiled page', () => {
  const cache = new PageCache();
  expect(cache.isCompiled('home')).toBe(false);
});

test('isCompiled returns true after markCompiled, and get returns its state', () => {
  const cache = new PageCache();
  cache.markCompiled('home', { generation: 1, checkedAt: 3 });
  expect(cache.isCompiled('home')).toBe(true);
  expect(cache.get('home')).toEqual({ generation: 1, checkedAt: 3 });
});

test('get returns null for a page that is not compiled', () => {
  const cache = new PageCache();
  expect(cache.get('home')).toBeNull();
});

test('markChecked moves checkedAt forward on the same generation only', () => {
  const cache = new PageCache();
  cache.markCompiled('home', { generation: 2, checkedAt: 3 });
  cache.markChecked('home', { generation: 2, checkedAt: 5 });
  expect(cache.get('home')).toEqual({ generation: 2, checkedAt: 5 });
  cache.markChecked('home', { generation: 2, checkedAt: 4 });
  expect(cache.get('home')).toEqual({ generation: 2, checkedAt: 5 });
  cache.markChecked('home', { generation: 1, checkedAt: 9 });
  expect(cache.get('home')).toEqual({ generation: 2, checkedAt: 5 });
});

test('remove drops a compiled page', () => {
  const cache = new PageCache();
  cache.markCompiled('home', { generation: 1, checkedAt: 0 });
  cache.remove('home');
  expect(cache.isCompiled('home')).toBe(false);
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
