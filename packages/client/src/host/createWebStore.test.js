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

import { beforeEach, expect, test } from 'vitest';
import createWebStore from './createWebStore.js';

beforeEach(() => {
  window.localStorage.clear();
});

test('createWebStore gets, sets and removes items', () => {
  const store = createWebStore(() => window.localStorage);
  store.set('a', '1');
  expect(store.get('a')).toBe('1');
  expect(window.localStorage.getItem('a')).toBe('1');
  store.remove('a');
  expect(store.get('a')).toBeNull();
});

test('createWebStore lists every key', () => {
  window.localStorage.setItem('a', '1');
  window.localStorage.setItem('b', '2');
  const store = createWebStore(() => window.localStorage);
  expect(store.keys().sort()).toEqual(['a', 'b']);
});

test('createWebStore throws on each call when the browser blocks storage', () => {
  const store = createWebStore(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
  expect(() => store.get('a')).toThrow('The operation is insecure.');
  expect(() => store.set('a', '1')).toThrow('The operation is insecure.');
  expect(() => store.remove('a')).toThrow('The operation is insecure.');
  expect(() => store.keys()).toThrow('The operation is insecure.');
});
