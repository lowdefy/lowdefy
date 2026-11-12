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

import createMemoryTokenStore from './createMemoryTokenStore.js';

test('createMemoryTokenStore holds no token until one is set', () => {
  const tokenStore = createMemoryTokenStore();
  expect(tokenStore.get()).toBeNull();
});

test('createMemoryTokenStore returns the last token set and forgets it on clear', () => {
  const tokenStore = createMemoryTokenStore();
  tokenStore.set('token-1');
  tokenStore.set('token-2');
  expect(tokenStore.get()).toBe('token-2');
  tokenStore.clear();
  expect(tokenStore.get()).toBeNull();
});

test('createMemoryTokenStore keeps the token out of browser storage and cookies', () => {
  const tokenStore = createMemoryTokenStore();
  tokenStore.set('secret-token');
  expect(JSON.stringify({ ...window.localStorage })).not.toContain('secret-token');
  expect(JSON.stringify({ ...window.sessionStorage })).not.toContain('secret-token');
  expect(window.document.cookie).not.toContain('secret-token');
});
