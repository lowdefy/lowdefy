/*
  Copyright 2020-2024 Lowdefy, Inc

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
  const components = {
    pages: [
      {
        id: 'home',
        auth: { public: true },
        type: 'PageHeaderMenu',
        blocks: [{ id: 'block1', type: 'TextInput' }],
        events: { onClick: { actions: [] } },
        requests: [{ id: 'req1' }],
      },
    ],
  };
  const registry = createPageRegistry({ components });
  expect(registry.size).toBe(1);

  const entry = registry.get('home');
  expect(entry.pageId).toBe('home');
  expect(entry.auth).toEqual({ public: true });
  expect(entry.type).toBe('PageHeaderMenu');
  expect(entry.rawContent.blocks).toEqual([{ id: 'block1', type: 'TextInput' }]);
  expect(entry.rawContent.events).toEqual({ onClick: { actions: [] } });
  expect(entry.rawContent.requests).toEqual([{ id: 'req1' }]);
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

test('createPageRegistry deep copies raw content', () => {
  const blocks = [{ id: 'block1', type: 'TextInput' }];
  const components = {
    pages: [{ id: 'home', type: 'PageHeaderMenu', blocks }],
  };
  const registry = createPageRegistry({ components });
  const entry = registry.get('home');

  // Modify original - should not affect registry
  blocks[0].id = 'modified';
  expect(entry.rawContent.blocks[0].id).toBe('block1');
});

test('createPageRegistry handles pages with shallow markers', () => {
  const components = {
    pages: [
      {
        id: 'home',
        auth: { public: true },
        type: 'PageHeaderMenu',
        blocks: { '~shallow': true, _ref: 'pages/home/blocks.yaml', _refId: 'r1' },
        events: { '~shallow': true, _ref: 'pages/home/events.yaml', _refId: 'r2' },
      },
    ],
  };
  const registry = createPageRegistry({ components });
  const entry = registry.get('home');
  expect(entry.rawContent.blocks['~shallow']).toBe(true);
  expect(entry.rawContent.blocks._ref).toBe('pages/home/blocks.yaml');
  expect(entry.rawContent.events['~shallow']).toBe(true);
});

test('createPageRegistry handles undefined content fields', () => {
  const components = {
    pages: [{ id: 'home', type: 'PageHeaderMenu' }],
  };
  const registry = createPageRegistry({ components });
  const entry = registry.get('home');
  expect(entry.rawContent.blocks).toBeUndefined();
  expect(entry.rawContent.areas).toBeUndefined();
  expect(entry.rawContent.events).toBeUndefined();
  expect(entry.rawContent.requests).toBeUndefined();
  expect(entry.rawContent.layout).toBeUndefined();
});
