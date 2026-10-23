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

import createStorage from './createStorage.js';
import { beforeEach, expect, test } from 'vitest';

beforeEach(() => {
  window.localStorage.clear();
});

test('createStorage keys app storage by slug and base path', () => {
  const storage = createStorage({ basePath: '/crm', getUserId: () => 'u1', slug: 'sales', window });
  expect(storage.appKey('lf-sider-open')).toBe('lowdefy:sales:/crm:lf-sider-open');
});

test('createStorage keys user storage by the user signed in at the call', () => {
  let userId = 'u1';
  const storage = createStorage({ basePath: '', getUserId: () => userId, slug: 'sales', window });
  expect(storage.userKey('views')).toBe('lowdefy:sales::lowdefy_user:u1:views');
  userId = 'u2';
  expect(storage.userKey('views')).toBe('lowdefy:sales::lowdefy_user:u2:views');
});

test('createStorage clears other owners keys for the user signed in now', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u1:views', '{}');
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u2:views', '{}');
  const storage = createStorage({ basePath: '', getUserId: () => 'u2', slug: 'sales', window });
  storage.clearUserStorageOnOwnerChange();
  expect(Object.keys(window.localStorage)).toEqual(['lowdefy:sales::lowdefy_user:u2:views']);
});

test('createStorage clearUserStorage removes every user key when no user is kept', () => {
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u1:views', '{}');
  const storage = createStorage({ basePath: '', getUserId: () => 'u1', slug: 'sales', window });
  storage.clearUserStorage({ keepUserId: null });
  expect(Object.keys(window.localStorage)).toEqual([]);
});
