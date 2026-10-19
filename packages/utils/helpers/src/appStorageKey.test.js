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

import appStorageKey from './appStorageKey.js';

test('appStorageKey names the app slug, base path and key', () => {
  expect(appStorageKey({ basePath: '/crm', name: 'lowdefy_darkMode', slug: 'sales' })).toBe(
    'lowdefy:sales:/crm:lowdefy_darkMode'
  );
});

test('appStorageKey leaves the slug and base path empty when the app sets neither', () => {
  expect(appStorageKey({ basePath: '', name: 'filters', slug: null })).toBe('lowdefy:::filters');
});

test('appStorageKey gives apps on one origin different keys for the same name', () => {
  expect(appStorageKey({ basePath: '/a', name: 'filters', slug: 'app' })).not.toBe(
    appStorageKey({ basePath: '/b', name: 'filters', slug: 'app' })
  );
});
