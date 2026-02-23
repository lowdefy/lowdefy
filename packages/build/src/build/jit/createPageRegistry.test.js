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

// Simulate what addKeys does: set ~k on page, store ~r in keyMap
function addPageKey(page, keyMapId, refId, keyMap) {
  Object.defineProperty(page, '~k', { value: keyMapId, enumerable: false, writable: true });
  const entry = { key: page.id };
  if (refId !== undefined) entry['~r'] = refId;
  keyMap[keyMapId] = entry;
}

const emptyContext = { keyMap: {} };
const defaults = { shallowPageIndices: new Set(), context: emptyContext };

test('createPageRegistry creates registry from pages', () => {
  const keyMap = {};
  const page = {
    id: 'home',
    auth: { public: true },
    type: 'PageHeaderMenu',
    blocks: [{ id: 'block1', type: 'TextInput' }],
  };
  addPageKey(page, 'k1', 'ref-1', keyMap);
  const components = { pages: [page] };
  const registry = createPageRegistry({
    components,
    shallowPageIndices: new Set(),
    context: { keyMap },
  });
  expect(registry.size).toBe(1);

  const entry = registry.get('home');
  expect(entry.pageId).toBe('home');
  expect(entry.auth).toEqual({ public: true });
  expect(entry.refId).toBe('ref-1');
  expect(entry.shallow).toBe(false);
});

test('createPageRegistry creates registry with multiple pages', () => {
  const keyMap = {};
  const pages = [
    { id: 'home', type: 'PageHeaderMenu', blocks: [] },
    { id: 'dashboard', type: 'PageSiderMenu', blocks: [] },
    { id: 'settings', type: 'PageHeaderMenu', blocks: [] },
  ];
  pages.forEach((p, i) => addPageKey(p, `k${i}`, undefined, keyMap));
  const components = { pages };
  const registry = createPageRegistry({
    components,
    shallowPageIndices: new Set(),
    context: { keyMap },
  });
  expect(registry.size).toBe(3);
  expect(registry.has('home')).toBe(true);
  expect(registry.has('dashboard')).toBe(true);
  expect(registry.has('settings')).toBe(true);
});

test('createPageRegistry returns empty registry when no pages', () => {
  const registry = createPageRegistry({ components: {}, ...defaults });
  expect(registry.size).toBe(0);
});

test('createPageRegistry returns empty registry when pages is null', () => {
  const registry = createPageRegistry({ components: { pages: null }, ...defaults });
  expect(registry.size).toBe(0);
});

test('createPageRegistry reads refId from keyMap via ~k', () => {
  const keyMap = {};
  const page = { id: 'home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', 'ref-42', keyMap);
  const components = { pages: [page] };
  const registry = createPageRegistry({
    components,
    shallowPageIndices: new Set(),
    context: { keyMap },
  });
  const entry = registry.get('home');
  expect(entry.refId).toBe('ref-42');
});

test('createPageRegistry stores null refId when ~r not in keyMap', () => {
  const keyMap = {};
  const page = { id: 'home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', undefined, keyMap);
  const components = { pages: [page] };
  const registry = createPageRegistry({
    components,
    shallowPageIndices: new Set(),
    context: { keyMap },
  });
  const entry = registry.get('home');
  expect(entry.refId).toBeNull();
});

test('createPageRegistry stores page auth', () => {
  const keyMap = {};
  const pages = [
    { id: 'home', auth: { public: true } },
    { id: 'admin', auth: { roles: ['admin'] } },
  ];
  pages.forEach((p, i) => addPageKey(p, `k${i}`, undefined, keyMap));
  const components = { pages };
  const registry = createPageRegistry({
    components,
    shallowPageIndices: new Set(),
    context: { keyMap },
  });
  expect(registry.get('home').auth).toEqual({ public: true });
  expect(registry.get('admin').auth).toEqual({ roles: ['admin'] });
});

test('createPageRegistry marks shallow pages from shallowPageIndices', () => {
  const keyMap = {};
  const pages = [
    { id: 'home', type: 'PageHeaderMenu' },
    { id: 'dashboard', type: 'PageSiderMenu' },
    { id: '404', type: 'PageHeaderMenu' },
  ];
  pages.forEach((p, i) => addPageKey(p, `k${i}`, undefined, keyMap));
  const shallowPageIndices = new Set([0, 1]);
  const registry = createPageRegistry({
    components: { pages },
    shallowPageIndices,
    context: { keyMap },
  });
  expect(registry.get('home').shallow).toBe(true);
  expect(registry.get('dashboard').shallow).toBe(true);
  expect(registry.get('404').shallow).toBe(false);
});
