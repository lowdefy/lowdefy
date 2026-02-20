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

import createPageRegistry from './createPageRegistry.js';

test('createPageRegistry creates registry from pages', () => {
  const page = {
    id: 'home',
    auth: { public: true },
    type: 'PageHeaderMenu',
    blocks: [{ id: 'block1', type: 'TextInput' }],
  };
  Object.defineProperty(page, '~r', { value: 'ref-1', enumerable: false });
  const components = { pages: [page] };
  const registry = createPageRegistry({ components });
  expect(registry.size).toBe(1);

  const entry = registry.get('home');
  expect(entry.pageId).toBe('home');
  expect(entry.auth).toEqual({ public: true });
  expect(entry.refId).toBe('ref-1');
  expect(entry.rawContent).toBeUndefined();
});

test('createPageRegistry creates registry with multiple pages', () => {
  const components = {
    pages: [
      { id: 'home', type: 'PageHeaderMenu', blocks: [] },
      { id: 'dashboard', type: 'PageSiderMenu', blocks: [] },
      { id: 'settings', type: 'PageHeaderMenu', blocks: [] },
    ],
  };
  const registry = createPageRegistry({ components });
  expect(registry.size).toBe(3);
  expect(registry.has('home')).toBe(true);
  expect(registry.has('dashboard')).toBe(true);
  expect(registry.has('settings')).toBe(true);
});

test('createPageRegistry returns empty registry when no pages', () => {
  const registry = createPageRegistry({ components: {} });
  expect(registry.size).toBe(0);
});

test('createPageRegistry returns empty registry when pages is null', () => {
  const registry = createPageRegistry({ components: { pages: null } });
  expect(registry.size).toBe(0);
});

test('createPageRegistry stores refId from ~r marker', () => {
  const page = { id: 'home', type: 'PageHeaderMenu' };
  Object.defineProperty(page, '~r', { value: 'ref-42', enumerable: false });
  const components = { pages: [page] };
  const registry = createPageRegistry({ components });
  const entry = registry.get('home');
  expect(entry.refId).toBe('ref-42');
});

test('createPageRegistry stores null refId when ~r is missing', () => {
  const components = {
    pages: [{ id: 'home', type: 'PageHeaderMenu' }],
  };
  const registry = createPageRegistry({ components });
  const entry = registry.get('home');
  expect(entry.refId).toBeNull();
});

test('createPageRegistry stores page auth', () => {
  const components = {
    pages: [
      { id: 'home', auth: { public: true } },
      { id: 'admin', auth: { roles: ['admin'] } },
    ],
  };
  const registry = createPageRegistry({ components });
  expect(registry.get('home').auth).toEqual({ public: true });
  expect(registry.get('admin').auth).toEqual({ roles: ['admin'] });
});
