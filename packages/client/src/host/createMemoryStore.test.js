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

import { expect, test } from 'vitest';

import createMemoryStore from './createMemoryStore.js';

test('createMemoryStore returns null for a key that was never set', () => {
  expect(createMemoryStore().get('missing')).toBeNull();
});

test('createMemoryStore stores values as strings and lists their keys', () => {
  const store = createMemoryStore();
  store.set('a', 1);
  store.set('b', 'two');
  expect(store.get('a')).toBe('1');
  expect(store.keys()).toEqual(['a', 'b']);
});

test('createMemoryStore removes a key', () => {
  const store = createMemoryStore();
  store.set('a', 'one');
  store.remove('a');
  expect(store.get('a')).toBeNull();
  expect(store.keys()).toEqual([]);
});

test('createMemoryStore keeps each store apart', () => {
  const first = createMemoryStore();
  first.set('a', 'one');
  expect(createMemoryStore().get('a')).toBeNull();
});
