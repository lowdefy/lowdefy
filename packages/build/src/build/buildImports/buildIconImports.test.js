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

import { jest } from '@jest/globals';

jest.unstable_mockModule('../icons/readIconMigrationTable.js', () => ({
  default: () => ({ icons: { AiOutlineDelete: 'delete' }, review: {} }),
}));

const { default: buildIconImports } = await import('./buildIconImports.js');
const { default: createIconContext } = await import('../icons/createIconContext.js');

const ALWAYS = [
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

async function createContext({ iconsConfig, jsMap = {}, typesMapIcons = {} } = {}) {
  return {
    errors: [],
    handleWarning: jest.fn(),
    icons: await createIconContext({ context: { typesMap: { iconSets: {} } }, iconsConfig }),
    jsMap,
    keyMap: {},
    typesMap: { icons: typesMapIcons },
  };
}

function withoutAlways(names) {
  return names.filter((name) => !ALWAYS.includes(name));
}

test('buildIconImports always bundles the icons the client renders itself', async () => {
  const context = await createContext();
  expect(buildIconImports({ blocks: [], components: {}, context })).toEqual([...ALWAYS].sort());
});

test('buildIconImports bundles every name form the config uses, as written', async () => {
  const context = await createContext();
  const components = {
    pages: [
      {
        id: 'page1',
        blocks: [
          { id: 'a', type: 'Button', properties: { icon: 'edit' } },
          { id: 'b', type: 'Button', properties: { icon: { name: 'Receipt' } } },
          { id: 'c', type: 'Button', properties: { icon: 'lucide:House' } },
          { id: 'd', type: 'Button', properties: { icon: 'Home' } },
        ],
      },
    ],
  };
  expect(withoutAlways(buildIconImports({ blocks: [], components, context }))).toEqual([
    'Home',
    'Receipt',
    'edit',
    'lucide:House',
  ]);
  expect(context.errors).toEqual([]);
});

test('buildIconImports does not bundle icons for type values', async () => {
  const context = await createContext();
  const components = {
    pages: [{ id: 'page1', type: 'Box', blocks: [{ id: 'm', type: 'Menu' }] }],
    menus: [{ id: 'default', links: [{ id: 'l', type: 'MenuLink' }] }],
  };
  expect(withoutAlways(buildIconImports({ blocks: [], components, context }))).toEqual([]);
});

test('buildIconImports bundles names in operator branches and global maps', async () => {
  const context = await createContext();
  const components = {
    global: { statuses: { done: { icon: 'CircleCheckBig' } } },
    pages: [
      {
        id: 'page1',
        blocks: [
          {
            id: 'a',
            type: 'Button',
            properties: { icon: { _if: { test: true, then: 'Flag', else: 'star' } } },
          },
        ],
      },
    ],
  };
  expect(withoutAlways(buildIconImports({ blocks: [], components, context }))).toEqual([
    'CircleCheckBig',
    'Flag',
    'star',
  ]);
});

test('buildIconImports bundles names in client and server _js sources, including single-quoted', async () => {
  const context = await createContext({
    jsMap: {
      client: { hash1: "return value > 0 ? 'arrow-up' : 'arrow-down';" },
      server: { hash2: 'return `<i data-icon="Bell"></i>`;' },
    },
  });
  expect(withoutAlways(buildIconImports({ blocks: [], components: {}, context }))).toEqual([
    'Bell',
    'arrow-down',
    'arrow-up',
  ]);
});

test('buildIconImports bundles names in data-icon attributes and API endpoint HTML', async () => {
  const context = await createContext();
  const components = {
    pages: [
      {
        id: 'page1',
        blocks: [{ id: 'h', type: 'Html', properties: { html: '<i data-icon="edit"></i>' } }],
      },
    ],
    api: [{ id: 'e', routine: [{ ':return': { html: "<i data-icon='Bell'></i>" } }] }],
  };
  expect(withoutAlways(buildIconImports({ blocks: [], components, context }))).toEqual([
    'Bell',
    'edit',
  ]);
});

test('buildIconImports bundles theme.icons.include and app aliases', async () => {
  const context = await createContext({
    iconsConfig: { aliases: { invoice: 'Receipt' }, include: ['Flag', 'invoice'] },
  });
  const components = { theme: { icons: { include: ['Flag', 'invoice'] } } };
  expect(withoutAlways(buildIconImports({ blocks: [], components, context }))).toEqual([
    'Flag',
    'invoice',
  ]);
});

test('buildIconImports bundles block type meta icons and warns on ones that do not resolve', async () => {
  const context = await createContext({
    typesMapIcons: { Selector: ['chevron-down', 'clear', 'AiOutlineDown'] },
  });
  const names = buildIconImports({
    blocks: [{ typeName: 'Selector', package: '@lowdefy/blocks-antd' }],
    components: {},
    context,
  });
  expect(withoutAlways(names)).toEqual(['chevron-down', 'clear']);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  expect(context.handleWarning.mock.calls[0][0].message).toBe(
    'Block type "Selector" (@lowdefy/blocks-antd) lists icon "AiOutlineDown" in its meta.icons, which is not an icon name. The block may render the fallback icon.'
  );
});

test('buildIconImports collects an error for an unresolvable name at an icon position', async () => {
  const context = await createContext();
  const components = {
    menus: [
      {
        id: 'default',
        links: [{ id: 'l', type: 'MenuLink', properties: { icon: 'AiOutlineDelete' } }],
      },
    ],
    pages: [{ id: 'page1', blocks: [{ id: 'a', type: 'Button', properties: { title: 'Pencl' } }] }],
  };
  const names = buildIconImports({ blocks: [], components, context });
  expect(context.errors.map((error) => error.message)).toEqual([
    expect.stringMatching(
      /^Icon "AiOutlineDelete" is a react-icons name\. Lowdefy 7 uses Lucide icons\. Use "delete" \(or "Trash"\)\./
    ),
  ]);
  expect(names).not.toContain('AiOutlineDelete');
});
