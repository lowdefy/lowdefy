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

import userStorageKey from './userStorageKey.js';
import { expect, test } from 'vitest';

test('userStorageKey names the app, the owner and the key', () => {
  expect(
    userStorageKey({ basePath: '/crm', name: 'lf-search-recent', slug: 'sales', userId: 'u1' })
  ).toBe('lowdefy:sales:/crm:lowdefy_user:u1:lf-search-recent');
});

test('userStorageKey gives an anonymous visitor the empty owner', () => {
  expect(
    userStorageKey({ basePath: '', name: 'lf-search-recent', slug: 'sales', userId: null })
  ).toBe('lowdefy:sales::lowdefy_user::lf-search-recent');
});

test('userStorageKey encodes the user id so the owner ends at the next colon', () => {
  expect(userStorageKey({ basePath: '', name: 'views', slug: 'sales', userId: 'org:42' })).toBe(
    'lowdefy:sales::lowdefy_user:org%3A42:views'
  );
});

test('userStorageKey gives two people different keys for the same name', () => {
  expect(userStorageKey({ basePath: '', name: 'views', slug: 'sales', userId: 'u1' })).not.toBe(
    userStorageKey({ basePath: '', name: 'views', slug: 'sales', userId: 'u2' })
  );
});
