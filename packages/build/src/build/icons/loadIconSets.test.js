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

const { default: loadIconSets } = await import('./loadIconSets.js');

const node = [['path', { d: 'M0 0' }]];

function setDefinition(names, extra = {}) {
  return {
    listIcons: async () => names,
    loadIcons: async () => ({}),
    ...extra,
  };
}

beforeEach(() => {
  mockImportPluginModule.mockReset();
});

function contextWith(iconSets) {
  return { directories: { server: '/server' }, typesMap: { iconSets } };
}

test('loadIconSets always has the built-in lucide layer', async () => {
  const sets = await loadIconSets({ context: contextWith({}) });
  expect(Object.keys(sets)).toEqual(['lucide']);
  expect(sets.lucide).toHaveLength(1);
  expect(sets.lucide[0].package).toBe('lucide');
  expect(sets.lucide[0].names.has('Pencil')).toBe(true);
  expect(await sets.lucide[0].loadIcons({ names: ['Pencil', 'Nope'] })).toEqual({
    Pencil: { node: expect.any(Array) },
  });
  expect(mockImportPluginModule).not.toHaveBeenCalled();
});

test('loadIconSets stacks plugin layers in plugins order from the iconSets entry', async () => {
  mockImportPluginModule.mockImplementation(async ({ specifier }) => {
    if (specifier === '@acme/tabler/iconSets') {
      return { default: { tabler: setDefinition(['Pencil'], { semantic: { edit: 'Pencil' } }) } };
    }
    if (specifier === '@acme/extra/iconSets') {
      return {
        default: {
          tabler: setDefinition(['Extra'], { attrs: { fill: 'currentColor' } }),
          lucide: setDefinition(['Invoice']),
        },
      };
    }
    return undefined;
  });
  const sets = await loadIconSets({
    context: contextWith({
      tabler: [
        { package: '@acme/tabler', version: '1.0.0' },
        { package: '@acme/extra', version: '2.0.0' },
      ],
      lucide: [{ package: '@acme/extra', version: '2.0.0' }],
    }),
  });
  expect(sets.tabler.map((layer) => layer.package)).toEqual(['@acme/tabler', '@acme/extra']);
  expect([...sets.tabler[0].names]).toEqual(['Pencil']);
  expect(sets.tabler[0].semantic).toEqual({ edit: 'Pencil' });
  expect(sets.tabler[1].attrs).toEqual({ fill: 'currentColor' });
  expect(sets.lucide.map((layer) => layer.package)).toEqual(['lucide', '@acme/extra']);
  expect(mockImportPluginModule).toHaveBeenCalledWith({
    context: expect.any(Object),
    specifier: '@acme/tabler/iconSets',
  });
});

test('loadIconSets throws when a plugin has no iconSets entry', async () => {
  mockImportPluginModule.mockResolvedValue(undefined);
  await expect(
    loadIconSets({ context: contextWith({ tabler: [{ package: '@acme/tabler' }] }) })
  ).rejects.toThrow(
    'Plugin "@acme/tabler" declares icon set "tabler" in its types, but "@acme/tabler/iconSets" could not be imported.'
  );
});

test('loadIconSets throws when the iconSets entry does not export the declared set', async () => {
  mockImportPluginModule.mockResolvedValue({ default: { other: setDefinition([]) } });
  await expect(
    loadIconSets({ context: contextWith({ tabler: [{ package: '@acme/tabler' }] }) })
  ).rejects.toThrow('but "@acme/tabler/iconSets" does not export it.');
});

test('loadIconSets throws when a set has no listIcons or loadIcons', async () => {
  mockImportPluginModule.mockResolvedValue({
    default: { tabler: { loadIcons: async () => ({}) } },
  });
  await expect(
    loadIconSets({ context: contextWith({ tabler: [{ package: '@acme/tabler' }] }) })
  ).rejects.toThrow('must define "listIcons" and "loadIcons" functions.');
});

test('loadIconSets throws when a set sets strokeWidth in attrs', async () => {
  mockImportPluginModule.mockResolvedValue({
    default: { tabler: setDefinition([], { attrs: { strokeWidth: 1.5 } }) },
  });
  await expect(
    loadIconSets({ context: contextWith({ tabler: [{ package: '@acme/tabler' }] }) })
  ).rejects.toThrow('"attrs" may not set "strokeWidth".');
});

test('loadIconSets throws for a set id that is not kebab-case', async () => {
  await expect(
    loadIconSets({ context: contextWith({ Tabler: [{ package: '@acme/tabler' }] }) })
  ).rejects.toThrow('Icon set id "Tabler" should be lowercase kebab-case');
});

test('loadIconSets reads no icon data', async () => {
  const loadIcons = jest.fn(async () => ({ Pencil: { node } }));
  mockImportPluginModule.mockResolvedValue({
    default: { tabler: setDefinition(['Pencil'], { loadIcons }) },
  });
  await loadIconSets({ context: contextWith({ tabler: [{ package: '@acme/tabler' }] }) });
  expect(loadIcons).not.toHaveBeenCalled();
});
