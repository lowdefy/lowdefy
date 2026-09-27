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

import createGetPageIcons from './createGetPageIcons.js';

// The app's icons as buildIconImports finds them: every name that resolves,
// from all pages, menus, global, endpoints, _js, meta.icons and include.
const appIcons = [
  'bell',
  'check',
  'close',
  'copy',
  'edit',
  'error',
  'home',
  'icon-missing',
  'info',
  'loading',
  'Rocket',
  'star',
  'success',
  'Trash',
  'warning',
  'Zap',
];

const alwaysBundled = [
  'check',
  'close',
  'copy',
  'error',
  'icon-missing',
  'info',
  'loading',
  'success',
  'warning',
];

function setup() {
  const components = {
    global: { statusIcon: 'star' },
    imports: { icons: appIcons },
    menus: [{ id: 'default', links: [{ id: 'home', properties: { icon: 'home' } }] }],
  };
  const context = {
    jsMap: {
      client: { 'aGFzaDE=': "return state.done ? 'Trash' : 'Pencil';", 'aGFzaDI=': 'return 1;' },
      server: {},
    },
    typesMap: { icons: { Header: ['bell', 'NotAnIcon'] } },
  };
  return createGetPageIcons({ components, context });
}

test('createGetPageIcons gives every page the client icons and the menus and global icons', () => {
  const getPageIcons = setup();
  expect(getPageIcons({ blocks: [], page: { id: 'empty' } })).toEqual(
    [...alwaysBundled, 'home', 'star'].sort()
  );
});

test('createGetPageIcons adds the app icons the page config names, as values and data-icon', () => {
  const getPageIcons = setup();
  const page = {
    id: 'page',
    properties: { title: 'Edit', icon: { _if: { test: true, then: 'edit', else: 'Zap' } } },
    blocks: [{ type: 'Html', properties: { html: '<i data-icon="Rocket"></i> Rocket' } }],
  };
  const icons = getPageIcons({ blocks: [], page });
  expect(icons).toEqual(expect.arrayContaining(['edit', 'Rocket', 'Zap']));
  // 'Edit' and 'Html' are not app icons; 'Pencil' is not on this page.
  expect(icons).not.toEqual(expect.arrayContaining(['Edit']));
});

test('createGetPageIcons adds the icons of the _js functions the page references', () => {
  const getPageIcons = setup();
  expect(getPageIcons({ blocks: [], page: { value: { _js: 'aGFzaDE=' } } })).toContain('Trash');
  expect(getPageIcons({ blocks: [], page: { value: { _js: { fn: 'aGFzaDE=' } } } })).toContain(
    'Trash'
  );
  expect(getPageIcons({ blocks: [], page: { value: { _js: 'aGFzaDI=' } } })).not.toContain('Trash');
});

test('createGetPageIcons adds the meta.icons of the page block types that are app icons', () => {
  const getPageIcons = setup();
  expect(getPageIcons({ blocks: ['Header'], page: {} })).toContain('bell');
  expect(getPageIcons({ blocks: ['Header'], page: {} })).not.toContain('NotAnIcon');
  expect(getPageIcons({ blocks: ['Box'], page: {} })).not.toContain('bell');
});
