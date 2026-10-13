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

import clearUserStorage from './clearUserStorage.js';

const scope = { basePath: '/crm', slug: 'sales' };

function seed() {
  window.localStorage.setItem('lowdefy:sales:/crm:lowdefy_darkMode', 'dark');
  window.localStorage.setItem('lowdefy:sales:/crm:settings', '"author value"');
  window.localStorage.setItem('lowdefy:sales:/crm:lowdefy_user:u1:lf-search-recent', '[1]');
  window.localStorage.setItem('lowdefy:sales:/crm:lowdefy_user:u2:lf-search-recent', '[2]');
  window.localStorage.setItem('lowdefy:sales:/crm:lowdefy_user::lf-search-recent', '[0]');
  window.localStorage.setItem('lowdefy:other::lowdefy_user:u2:lf-search-recent', '[3]');
  window.sessionStorage.setItem('lowdefy_scroll', '{}');
  window.sessionStorage.setItem('lowdefy_reloaded_for_build', 'build-1');
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  seed();
});

test('clearUserStorage keeps device keys and author keys of the app', () => {
  clearUserStorage({ ...scope, keepUserId: null, window });
  expect(window.localStorage.getItem('lowdefy:sales:/crm:lowdefy_darkMode')).toBe('dark');
  expect(window.localStorage.getItem('lowdefy:sales:/crm:settings')).toBe('"author value"');
});

test('clearUserStorage keeps the current user keys and drops other users and anonymous keys', () => {
  clearUserStorage({ ...scope, keepUserId: 'u1', window });
  expect(window.localStorage.getItem('lowdefy:sales:/crm:lowdefy_user:u1:lf-search-recent')).toBe(
    '[1]'
  );
  expect(
    window.localStorage.getItem('lowdefy:sales:/crm:lowdefy_user:u2:lf-search-recent')
  ).toBeNull();
  expect(
    window.localStorage.getItem('lowdefy:sales:/crm:lowdefy_user::lf-search-recent')
  ).toBeNull();
});

test('clearUserStorage drops every user key of the app when no user is kept', () => {
  clearUserStorage({ ...scope, keepUserId: null, window });
  expect(Object.keys(window.localStorage).sort()).toEqual([
    'lowdefy:other::lowdefy_user:u2:lf-search-recent',
    'lowdefy:sales:/crm:lowdefy_darkMode',
    'lowdefy:sales:/crm:settings',
  ]);
});

test('clearUserStorage leaves the user keys of another app on the origin', () => {
  clearUserStorage({ ...scope, keepUserId: null, window });
  expect(window.localStorage.getItem('lowdefy:other::lowdefy_user:u2:lf-search-recent')).toBe(
    '[3]'
  );
});

test('clearUserStorage clears the scroll positions and keeps the build reload marker', () => {
  clearUserStorage({ ...scope, keepUserId: 'u1', window });
  expect(window.sessionStorage.getItem('lowdefy_scroll')).toBeNull();
  expect(window.sessionStorage.getItem('lowdefy_reloaded_for_build')).toBe('build-1');
});

test('clearUserStorage does not throw when the browser blocks storage', () => {
  const blockedWindow = {
    get localStorage() {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
    get sessionStorage() {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  };
  expect(() =>
    clearUserStorage({ ...scope, keepUserId: null, window: blockedWindow })
  ).not.toThrow();
});
