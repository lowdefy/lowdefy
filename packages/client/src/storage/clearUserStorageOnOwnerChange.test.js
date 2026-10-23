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

import clearUserStorageOnOwnerChange from './clearUserStorageOnOwnerChange.js';
import { beforeEach, expect, test } from 'vitest';

const scope = { basePath: '', slug: 'sales' };

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.sessionStorage.setItem('lowdefy_scroll', '{}');
});

test('clearUserStorageOnOwnerChange keeps storage when the signed-in user owns every user key', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u1:views', '{}');
  clearUserStorageOnOwnerChange({ ...scope, userId: 'u1', window });
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user:u1:views')).toBe('{}');
  expect(window.sessionStorage.getItem('lowdefy_scroll')).toBe('{}');
});

test('clearUserStorageOnOwnerChange keeps an anonymous visitor its own keys', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user::views', '{}');
  clearUserStorageOnOwnerChange({ ...scope, userId: null, window });
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user::views')).toBe('{}');
});

test('clearUserStorageOnOwnerChange clears another user keys when a different user signs in', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u1:views', '{}');
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u2:views', '{"mine":true}');
  clearUserStorageOnOwnerChange({ ...scope, userId: 'u2', window });
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user:u1:views')).toBeNull();
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user:u2:views')).toBe('{"mine":true}');
  expect(window.sessionStorage.getItem('lowdefy_scroll')).toBeNull();
});

test('clearUserStorageOnOwnerChange clears user keys when nobody is signed in', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u1:views', '{}');
  window.localStorage.setItem('lowdefy:sales::lowdefy_darkMode', 'dark');
  clearUserStorageOnOwnerChange({ ...scope, userId: null, window });
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user:u1:views')).toBeNull();
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_darkMode')).toBe('dark');
});

test('clearUserStorageOnOwnerChange drops anonymous leftovers when a user signs in', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user::views', '{}');
  clearUserStorageOnOwnerChange({ ...scope, userId: 'u1', window });
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user::views')).toBeNull();
});

test('clearUserStorageOnOwnerChange reads an encoded user id back as the owner', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:org%3A42:views', '{}');
  clearUserStorageOnOwnerChange({ ...scope, userId: 'org:42', window });
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user:org%3A42:views')).toBe('{}');
});

test('clearUserStorageOnOwnerChange does not throw when the browser blocks storage', () => {
  const blockedWindow = {
    get localStorage() {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  };
  expect(() =>
    clearUserStorageOnOwnerChange({ ...scope, userId: null, window: blockedWindow })
  ).not.toThrow();
});
