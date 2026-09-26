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

const mockImportPluginModule = jest.fn();
jest.unstable_mockModule('../writePluginImports/importPluginModule.js', () => ({
  default: mockImportPluginModule,
}));
jest.unstable_mockModule('./readIconMigrationTable.js', () => ({
  default: () => ({ icons: { AiOutlineDelete: 'delete' }, review: {} }),
}));

const { default: buildIconContext } = await import('./buildIconContext.js');

beforeEach(() => {
  mockImportPluginModule.mockReset();
});

function createContext(iconSets = {}) {
  return { errors: [], keyMap: {}, directories: { server: '/server' }, typesMap: { iconSets } };
}

async function run({ icons, iconSets } = {}) {
  const context = createContext(iconSets);
  await buildIconContext({ components: { theme: { icons } }, context });
  return { context, messages: context.errors.map((error) => error.message) };
}

test('buildIconContext sets context.icons with Lucide as the default set', async () => {
  const { context, messages } = await run();
  expect(messages).toEqual([]);
  expect(context.icons.defaultSet).toBe('lucide');
  expect(Object.keys(context.icons.sets)).toEqual(['lucide']);
  expect(context.icons.semantic.edit).toBe('Pencil');
});

test('buildIconContext accepts every theme.icons setting', async () => {
  const { context, messages } = await run({
    icons: {
      set: 'lucide',
      size: 18,
      strokeWidth: 1.5,
      nonScalingStroke: true,
      aliases: { invoice: 'Receipt', edit: 'lucide:SquarePen' },
      include: ['Flag', 'invoice', 'lucide:Bell'],
    },
  });
  expect(messages).toEqual([]);
  expect(context.icons.semantic.invoice).toBe('Receipt');
  expect(context.icons.semantic.edit).toBe('lucide:SquarePen');
});

test('buildIconContext selects an installed icon set and its semantic map', async () => {
  mockImportPluginModule.mockResolvedValue({
    default: {
      tabler: {
        semantic: { edit: 'TablerPencil' },
        listIcons: async () => ['TablerPencil'],
        loadIcons: async () => ({}),
      },
    },
  });
  const { context, messages } = await run({
    icons: { set: 'tabler' },
    iconSets: { tabler: [{ package: '@acme/icons-tabler', version: '1.0.0' }] },
  });
  expect(messages).toEqual([]);
  expect(context.icons.defaultSet).toBe('tabler');
  expect(context.icons.semantic.edit).toBe('TablerPencil');
});

test('buildIconContext raises when theme.icons.set names a set that is not installed', async () => {
  const { messages } = await run({ icons: { set: 'tabler' } });
  expect(messages).toEqual([
    'App "theme.icons.set" is "tabler", but no installed plugin declares that icon set. Installed icon sets: "lucide".',
  ]);
});

test('buildIconContext raises for settings of the wrong type', async () => {
  expect((await run({ icons: { set: 3 } })).messages).toEqual([
    'App "theme.icons.set" should be an icon set id, like "lucide". Received 3.',
  ]);
  expect((await run({ icons: { size: true } })).messages).toEqual([
    'App "theme.icons.size" should be a string or a number. Received true.',
  ]);
  expect((await run({ icons: { strokeWidth: 0 } })).messages).toEqual([
    'App "theme.icons.strokeWidth" should be a number greater than 0. Received 0.',
  ]);
  expect((await run({ icons: { nonScalingStroke: 'yes' } })).messages).toEqual([
    'App "theme.icons.nonScalingStroke" should be a boolean. Received "yes".',
  ]);
  expect((await run({ icons: { aliases: ['edit'] } })).messages).toEqual([
    'App "theme.icons.aliases" should be an object.',
  ]);
  expect((await run({ icons: { include: 'Flag' } })).messages).toEqual([
    'App "theme.icons.include" should be an array of icon names.',
  ]);
});

test('buildIconContext raises for alias names and targets that are not valid', async () => {
  const { messages } = await run({
    icons: {
      aliases: {
        Invoice: 'Receipt',
        edit: 'pencil',
        trash: 'AiOutlineDelete',
        star: 'Starr',
      },
    },
  });
  expect(messages).toEqual([
    'Icon alias "Invoice" should be lowercase kebab-case, like "edit" or "external-link".',
    'Icon alias "edit" targets "pencil", which is a semantic name. Alias targets are set names like "Pencil" or qualified names like "lucide:Pencil".',
    expect.stringMatching(/^Icon "AiOutlineDelete" is a react-icons name\./),
    'Icon "Starr" is not an icon name. Did you mean "Star"?',
  ]);
});

test('buildIconContext raises for include entries that name no icon', async () => {
  const { messages } = await run({ icons: { include: ['Flag', 'nope-nope'] } });
  expect(messages).toEqual([
    expect.stringMatching(/^Icon "nope-nope" is not a semantic icon name\./),
  ]);
});
