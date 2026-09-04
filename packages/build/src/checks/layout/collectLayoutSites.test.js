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
import collectLayoutSites from './collectLayoutSites.js';
import { layoutComponents } from './testFixture.js';

test('collectLayoutSites finds one site per block layout and per slot with area keys', () => {
  const sites = collectLayoutSites({ components: layoutComponents() });
  expect(sites.map((site) => [site.blockId, site.scope])).toEqual([
    ['sidebar', 'layout'],
    ['main', 'layout'],
    ['toolbar', 'layout'],
    ['badge', 'layout'],
    ['column_box', 'slots.content'],
    ['dynamic_block', 'layout'],
    ['partly_dynamic', 'layout'],
  ]);
});

test('collectLayoutSites splits item keys from area keys on one layout object', () => {
  const sites = collectLayoutSites({
    components: {
      pages: [
        {
          pageId: 'home',
          blockId: 'home',
          '~k': 'k_home',
          layout: { span: 12, gap: 8, direction: 'column' },
        },
      ],
    },
  });
  expect(sites).toHaveLength(1);
  expect(sites[0]).toMatchObject({
    itemKeys: ['span'],
    areaKeys: ['gap', 'direction'],
    columnDirection: true,
    dynamicKeys: [],
  });
});

test('collectLayoutSites recurses into every slot of a nested container', () => {
  const sites = collectLayoutSites({
    components: {
      pages: [
        {
          pageId: 'home',
          blockId: 'home',
          '~k': 'k_home',
          slots: {
            header: { blocks: [{ blockId: 'logo', '~k': 'k_logo', layout: { span: 4 } }] },
            content: {
              blocks: [
                {
                  blockId: 'card',
                  '~k': 'k_card',
                  slots: {
                    content: { blocks: [{ blockId: 'deep', '~k': 'k_deep', layout: { flex: 1 } }] },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  });
  expect(sites.map((site) => site.blockId)).toEqual(['logo', 'deep']);
});

test('collectLayoutSites reads the layout objects own ~k so the warning points at layout, not the block', () => {
  const layout = { span: 12 };
  Object.defineProperty(layout, '~k', { value: 'k_layout', enumerable: false });
  const sites = collectLayoutSites({
    components: { pages: [{ pageId: 'home', blockId: 'home', '~k': 'k_home', layout }] },
  });
  expect(sites[0].configKey).toBe('k_layout');
});
