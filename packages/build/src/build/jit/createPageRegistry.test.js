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

// Build a refMap with parent chain entries
function buildRefMap(entries) {
  const refMap = {};
  for (const [id, entry] of Object.entries(entries)) {
    refMap[id] = entry;
  }
  return refMap;
}

test('createPageRegistry creates registry from pages with simple ref chain', () => {
  // home.yaml (no vars) → layout.yaml.njk (vars)
  // ~r points to layout ref, walk should find home.yaml
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
    'ref-home': { parent: 'ref-root', path: 'home.yaml' },
    'ref-layout': { parent: 'ref-home', path: 'layout.yaml.njk' },
  });
  const unresolvedRefVars = {
    'ref-layout': { id: 'home' },
  };
  const keyMap = {};
  const page = {
    id: 'home',
    auth: { public: true },
    type: 'PageHeaderMenu',
    blocks: [{ id: 'block1', type: 'TextInput' }],
  };
  addPageKey(page, 'k1', 'ref-layout', keyMap);
  const components = { pages: [page] };
  const registry = createPageRegistry({
    components,
    context: { keyMap, refMap, unresolvedRefVars },
  });
  expect(registry.size).toBe(1);

  const entry = registry.get('home');
  expect(entry.pageId).toBe('home');
  expect(entry.auth).toEqual({ public: true });
  expect(entry.refId).toBe('ref-layout');
  expect(entry.refPath).toBe('home.yaml');
  expect(entry.unresolvedVars).toBeNull();
});

test('createPageRegistry creates registry with multiple pages', () => {
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
  });
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
    context: { keyMap, refMap, unresolvedRefVars: {} },
  });
  expect(registry.size).toBe(3);
  expect(registry.has('home')).toBe(true);
  expect(registry.has('dashboard')).toBe(true);
  expect(registry.has('settings')).toBe(true);
});

test('createPageRegistry returns empty registry when no pages', () => {
  const registry = createPageRegistry({
    components: {},
    context: { keyMap: {}, refMap: {} },
  });
  expect(registry.size).toBe(0);
});

test('createPageRegistry returns empty registry when pages is null', () => {
  const registry = createPageRegistry({
    components: { pages: null },
    context: { keyMap: {}, refMap: {} },
  });
  expect(registry.size).toBe(0);
});

test('createPageRegistry stores null refPath and unresolvedVars when ~r not in keyMap', () => {
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
  });
  const keyMap = {};
  const page = { id: 'home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', undefined, keyMap);
  const components = { pages: [page] };
  const registry = createPageRegistry({
    components,
    context: { keyMap, refMap, unresolvedRefVars: {} },
  });
  const entry = registry.get('home');
  expect(entry.refId).toBeNull();
  expect(entry.refPath).toBeNull();
  expect(entry.unresolvedVars).toBeNull();
});

test('createPageRegistry stores page auth', () => {
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
  });
  const keyMap = {};
  const pages = [
    { id: 'home', auth: { public: true } },
    { id: 'admin', auth: { roles: ['admin'] } },
  ];
  pages.forEach((p, i) => addPageKey(p, `k${i}`, undefined, keyMap));
  const components = { pages };
  const registry = createPageRegistry({
    components,
    context: { keyMap, refMap, unresolvedRefVars: {} },
  });
  expect(registry.get('home').auth).toEqual({ public: true });
  expect(registry.get('admin').auth).toEqual({ roles: ['admin'] });
});

test('createPageRegistry walks parent chain to find page file without vars', () => {
  // pages.yaml (no vars) → home.yaml (no vars) → layout.yaml.njk (vars)
  // Walk from ref-layout: has vars → go to ref-home: no vars, not root → return home.yaml
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
    'ref-pages': { parent: 'ref-root', path: 'pages.yaml' },
    'ref-home': { parent: 'ref-pages', path: 'home.yaml' },
    'ref-layout': { parent: 'ref-home', path: 'layout.yaml.njk' },
  });
  const unresolvedRefVars = {
    'ref-layout': { id: 'home' },
  };
  const keyMap = {};
  const page = { id: 'home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', 'ref-layout', keyMap);

  const registry = createPageRegistry({
    components: { pages: [page] },
    context: { keyMap, refMap, unresolvedRefVars },
  });
  const entry = registry.get('home');
  expect(entry.refPath).toBe('home.yaml');
  expect(entry.unresolvedVars).toBeNull();
});

test('createPageRegistry uses collection file when page ref has vars', () => {
  // pages.yaml (no vars) → home.yaml (WITH vars) → layout.yaml.njk (vars)
  // Walk from ref-layout: has vars → ref-home: has vars → ref-pages: no vars, not root → return pages.yaml
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
    'ref-pages': { parent: 'ref-root', path: 'pages.yaml' },
    'ref-home': { parent: 'ref-pages', path: 'home.yaml' },
    'ref-layout': { parent: 'ref-home', path: 'layout.yaml.njk' },
  });
  const unresolvedRefVars = {
    'ref-home': { id: 'home', title: 'Home' },
    'ref-layout': { id: 'home' },
  };
  const keyMap = {};
  const page = { id: 'home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', 'ref-layout', keyMap);

  const registry = createPageRegistry({
    components: { pages: [page] },
    context: { keyMap, refMap, unresolvedRefVars },
  });
  const entry = registry.get('home');
  expect(entry.refPath).toBe('pages.yaml');
  expect(entry.unresolvedVars).toBeNull();
});

test('createPageRegistry falls back to first child of root when all refs have vars', () => {
  // module.yaml (vars) → admin.yaml (vars) → layout.yaml.njk (vars)
  // All have vars, so fall back to first child of root (module.yaml)
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
    'ref-module': { parent: 'ref-root', path: 'module.yaml' },
    'ref-admin': { parent: 'ref-module', path: 'admin.yaml' },
    'ref-layout': { parent: 'ref-admin', path: 'layout.yaml.njk' },
  });
  const unresolvedRefVars = {
    'ref-module': { section: 'admin' },
    'ref-admin': { id: 'admin-home' },
    'ref-layout': { id: 'admin-home' },
  };
  const keyMap = {};
  const page = { id: 'admin-home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', 'ref-layout', keyMap);

  const registry = createPageRegistry({
    components: { pages: [page] },
    context: { keyMap, refMap, unresolvedRefVars },
  });
  const entry = registry.get('admin-home');
  expect(entry.refPath).toBe('module.yaml');
  expect(entry.unresolvedVars).toEqual({ section: 'admin' });
});

test('createPageRegistry handles direct page ref without template', () => {
  // home.yaml (no vars) — directly referenced, no template
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
    'ref-home': { parent: 'ref-root', path: 'home.yaml' },
  });
  const keyMap = {};
  const page = { id: 'home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', 'ref-home', keyMap);

  const registry = createPageRegistry({
    components: { pages: [page] },
    context: { keyMap, refMap, unresolvedRefVars: {} },
  });
  const entry = registry.get('home');
  expect(entry.refPath).toBe('home.yaml');
  expect(entry.unresolvedVars).toBeNull();
});

test('createPageRegistry handles resolver ref chain (child of root has no path)', () => {
  // Resolver (no path) → template view.yaml (vars) → layout.yaml.njk (vars)
  // Child of root (ref-resolver) has no path. Go shallower — capture the
  // resolver's info so JIT can re-run it with freshly resolved vars.
  const resolverOriginal = { resolver: 'resolvers/pages.js', vars: { app_name: { _ref: 'app-config.yaml' }, workflows: { _ref: 'workflows.yaml' } } };
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
    'ref-resolver': { parent: 'ref-root', path: null, original: resolverOriginal },
    'ref-template': { parent: 'ref-resolver', path: 'view.yaml' },
    'ref-layout': { parent: 'ref-template', path: 'layout.yaml.njk' },
  });
  const unresolvedRefVars = {
    'ref-resolver': { app_name: { _ref: 'app-config.yaml' }, workflows: { _ref: 'workflows.yaml' } },
    'ref-template': { action_config: { action: 'initial-details' }, workflow_type: 'device' },
    'ref-layout': { id: 'device-initial-details-view', title: 'View' },
  };
  const keyMap = {};
  const page = { id: 'device-initial-details-view', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', 'ref-layout', keyMap);

  const registry = createPageRegistry({
    components: { pages: [page] },
    context: { keyMap, refMap, unresolvedRefVars },
  });
  const entry = registry.get('device-initial-details-view');
  expect(entry.refPath).toBeNull();
  // Unresolved vars live in resolverOriginal.vars — not duplicated in unresolvedVars
  expect(entry.unresolvedVars).toBeNull();
  expect(entry.resolverOriginal).toEqual(resolverOriginal);
});

test('createPageRegistry handles missing refMap entry gracefully', () => {
  const refMap = buildRefMap({
    'ref-root': { parent: null, path: 'lowdefy.yaml' },
  });
  const keyMap = {};
  const page = { id: 'home', type: 'PageHeaderMenu' };
  addPageKey(page, 'k1', 'ref-missing', keyMap);

  const registry = createPageRegistry({
    components: { pages: [page] },
    context: { keyMap, refMap, unresolvedRefVars: {} },
  });
  const entry = registry.get('home');
  expect(entry.refId).toBe('ref-missing');
  expect(entry.refPath).toBeNull();
  expect(entry.unresolvedVars).toBeNull();
});
