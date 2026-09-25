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

import defaultIconAliases from './defaultIconAliases.js';

// data-copy's icons are always bundled.
const HTML_ALIASES = { check: 'LuCheck', copy: 'LuCopy' };

const mockRequire = jest.fn();

jest.unstable_mockModule('module', () => ({
  createRequire: () => mockRequire,
}));

function iconModule(names) {
  return Object.fromEntries(names.map((name) => [name, () => null]));
}

const modules = {
  'react-icons/ai': iconModule([
    'AiOutlineExclamationCircle',
    'AiOutlineLoading3Quarters',
    'AiFillHome',
  ]),
  'react-icons/lu': iconModule([...Object.values(defaultIconAliases), 'LuReceipt', 'LuFlag']),
  'react-icons/tb': iconModule(['TbPencil']),
};

beforeEach(() => {
  mockRequire.mockReset();
  mockRequire.mockImplementation((iconPackage) => modules[iconPackage] ?? {});
});

function createContext() {
  return {
    directories: { server: '/test/server' },
    handleWarning: jest.fn(),
    jsMap: {},
    typesMap: { icons: {} },
  };
}

function getIcons(iconImports, iconPackage) {
  return iconImports.find((entry) => entry.package === iconPackage).icons;
}

test('buildIconImports emits only the aliases the config uses', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const components = {
    pages: [{ id: 'page1', blocks: [{ id: 'b', properties: { icon: 'edit' } }] }],
  };
  const { iconAliases, iconImports } = buildIconImports({
    blocks: [],
    components,
    context: createContext(),
  });
  expect(iconAliases).toEqual({ ...HTML_ALIASES, edit: 'LuPencil' });
  expect(getIcons(iconImports, 'react-icons/lu').sort()).toEqual(['LuCheck', 'LuCopy', 'LuPencil']);
});

test('buildIconImports bundles icons named in client _js sources', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const context = createContext();
  context.jsMap = {
    client: { abc123: 'return `<i data-icon="delete"></i> <i data-icon="AiFillHome"></i>`;' },
  };
  const { iconAliases, iconImports } = buildIconImports({ blocks: [], components: {}, context });
  expect(iconAliases).toEqual({ ...HTML_ALIASES, delete: 'LuTrash2' });
  expect(getIcons(iconImports, 'react-icons/ai')).toEqual(['AiFillHome']);
});

test('buildIconImports lets theme aliases override and extend built-in names', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const components = {
    theme: { icons: { aliases: { edit: 'TbPencil', invoice: 'LuReceipt' } } },
    pages: [{ id: 'page1', blocks: [{ properties: { a: 'edit', b: 'invoice' } }] }],
  };
  const { iconAliases, iconImports } = buildIconImports({
    blocks: [],
    components,
    context: createContext(),
  });
  expect(iconAliases).toEqual({ ...HTML_ALIASES, edit: 'TbPencil', invoice: 'LuReceipt' });
  expect(getIcons(iconImports, 'react-icons/tb')).toEqual(['TbPencil']);
  expect(getIcons(iconImports, 'react-icons/lu').sort()).toEqual([
    'LuCheck',
    'LuCopy',
    'LuReceipt',
  ]);
});

test('buildIconImports bundles icons listed in theme.icons.include', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const components = { theme: { icons: { include: ['LuFlag', 'star'] } } };
  const { iconAliases, iconImports } = buildIconImports({
    blocks: [],
    components,
    context: createContext(),
  });
  expect(iconAliases).toEqual({ ...HTML_ALIASES, star: 'LuStar' });
  expect(getIcons(iconImports, 'react-icons/lu').sort()).toEqual([
    'LuCheck',
    'LuCopy',
    'LuFlag',
    'LuStar',
  ]);
});

test('buildIconImports warns on an include entry that names no icon', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const context = createContext();
  buildIconImports({
    blocks: [],
    components: { theme: { icons: { include: ['nothing'] } } },
    context,
  });
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  expect(context.handleWarning.mock.calls[0][0].message).toBe(
    'theme.icons.include lists "nothing", which is neither an icon alias nor a react-icons name.'
  );
});

test('buildIconImports bundles icons named in data-icon attributes', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const components = {
    pages: [{ properties: { html: '<i data-icon="delete"></i><i data-icon="AiFillHome"></i>' } }],
  };
  const { iconAliases, iconImports } = buildIconImports({
    blocks: [],
    components,
    context: createContext(),
  });
  expect(iconAliases).toEqual({ ...HTML_ALIASES, delete: 'LuTrash2' });
  expect(getIcons(iconImports, 'react-icons/ai')).toEqual(['AiFillHome']);
});

test('buildIconImports warns with a suggestion on an unknown data-icon name', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const context = createContext();
  buildIconImports({
    blocks: [],
    components: { pages: [{ properties: { html: '<i data-icon="delet"></i>' } }] },
    context,
  });
  expect(context.handleWarning.mock.calls[0][0].message).toBe(
    'data-icon="delet" is not an icon alias or a react-icons name. Did you mean "delete"?'
  );
});

test('buildIconImports bundles aliases named in block type default icons', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const context = createContext();
  context.typesMap.icons = { MyBlock: ['close'] };
  const { iconAliases } = buildIconImports({
    blocks: [{ typeName: 'MyBlock' }],
    components: {},
    context,
  });
  expect(iconAliases).toEqual({ ...HTML_ALIASES, close: 'LuX' });
});

test('buildIconImports throws when a theme alias targets an unknown icon', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  expect(() =>
    buildIconImports({
      blocks: [],
      components: { theme: { icons: { aliases: { invoice: 'LuReciept' } } } },
      context: createContext(),
    })
  ).toThrow(
    'Icon alias "invoice" targets "LuReciept", which is not a react-icons icon. Did you mean "LuReceipt"?'
  );
});

test('buildIconImports throws when a theme alias target is not a react-icons name', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  expect(() =>
    buildIconImports({
      blocks: [],
      components: { theme: { icons: { aliases: { invoice: 'receipt' } } } },
      context: createContext(),
    })
  ).toThrow('Icon alias "invoice" targets "receipt", which is not a react-icons name.');
});

test('buildIconImports throws when a theme alias name is not lowercase kebab-case', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  expect(() =>
    buildIconImports({
      blocks: [],
      components: { theme: { icons: { aliases: { Invoice: 'LuReceipt' } } } },
      context: createContext(),
    })
  ).toThrow('Icon alias "Invoice" should be lowercase kebab-case, like "edit" or "external-link".');
});

test('buildIconImports always bundles the icons data-copy buttons render', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const { iconAliases, iconImports } = buildIconImports({
    blocks: [],
    components: {},
    context: createContext(),
  });
  expect(iconAliases).toEqual(HTML_ALIASES);
  expect(getIcons(iconImports, 'react-icons/lu')).toEqual(['LuCheck', 'LuCopy']);
});

test('buildIconImports keeps existing react-icons names working unchanged', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const { iconAliases, iconImports } = buildIconImports({
    blocks: [],
    components: { pages: [{ properties: { icon: 'AiFillHome' } }] },
    context: createContext(),
    defaults: { 'react-icons/ai': ['AiOutlineExclamationCircle'] },
  });
  expect(iconAliases).toEqual(HTML_ALIASES);
  expect(getIcons(iconImports, 'react-icons/ai')).toEqual([
    'AiOutlineExclamationCircle',
    'AiFillHome',
  ]);
});

test('buildIconImports bundles icons named in HTML built by API endpoints', async () => {
  const { default: buildIconImports } = await import('./buildIconImports.js');
  const components = {
    api: [
      { id: 'notify', routine: [{ ':return': { html: '<i data-icon="bell"></i> New comment' } }] },
    ],
  };
  const { iconAliases } = buildIconImports({ blocks: [], components, context: createContext() });
  expect(iconAliases).toEqual({ ...HTML_ALIASES, bell: 'LuBell' });
});
