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

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { addRecentResult, readStored, writeStored } from './useRecentResults.js';

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
  };
});

afterEach(() => {
  delete globalThis.localStorage;
});

const hit = (id) => ({ id, title: id, category: 'Documents', score: 3, terms: ['a'], match: {} });

describe('recent results', () => {
  test('stores stored fields only, newest first, without repeats, up to the count', () => {
    let recent = [];
    for (const id of ['a', 'b', 'c', 'd', 'e', 'c']) recent = addRecentResult(recent, hit(id), 4);
    expect(recent.map((r) => r.id)).toEqual(['c', 'e', 'd', 'b']);
    expect(recent[0]).toEqual({ id: 'c', title: 'c', category: 'Documents' });
  });

  test('survive a reload through storage', () => {
    const key = 'user-1-lf-search-recent-results';
    writeStored(key, addRecentResult([], hit('a'), 4));
    expect(readStored(key)).toEqual([{ id: 'a', title: 'a', category: 'Documents' }]);
    expect(readStored('other-user-key')).toEqual([]);
  });

  test('unreadable storage reads as empty', () => {
    globalThis.localStorage.getItem = () => '{not json';
    expect(readStored('k')).toEqual([]);
  });
});
