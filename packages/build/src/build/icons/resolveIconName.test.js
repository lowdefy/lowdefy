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

import createIconSemanticMap from './createIconSemanticMap.js';
import createLucideIconLayer from './createLucideIconLayer.js';
import resolveIconName from './resolveIconName.js';
import createTestIconLayer from '../../test-utils/createTestIconLayer.js';

const node = [['path', { d: 'M0 0' }]];

function createIcons({ sets = {}, defaultSet = 'lucide', aliases } = {}) {
  const allSets = { ...sets, lucide: [createLucideIconLayer(), ...(sets.lucide ?? [])] };
  return {
    sets: allSets,
    defaultSet,
    semantic: createIconSemanticMap({ sets: allSets, defaultSet, aliases }),
  };
}

function resolve(name, icons = createIcons()) {
  return resolveIconName({ name, ...icons });
}

test('resolveIconName resolves a Lucide set name in the built-in layer', () => {
  expect(resolve('Pencil')).toEqual({ setId: 'lucide', layer: 0, iconName: 'Pencil' });
});

test('resolveIconName resolves a Lucide alias name', () => {
  expect(resolve('Home')).toEqual({ setId: 'lucide', layer: 0, iconName: 'Home' });
});

test('resolveIconName resolves a semantic name to its Lucide target', () => {
  expect(resolve('edit')).toEqual({ setId: 'lucide', layer: 0, iconName: 'Pencil' });
  expect(resolve('delete')).toEqual({ setId: 'lucide', layer: 0, iconName: 'Trash' });
});

test('resolveIconName resolves a qualified Lucide name', () => {
  expect(resolve('lucide:Pencil')).toEqual({ setId: 'lucide', layer: 0, iconName: 'Pencil' });
});

test('resolveIconName does not accept Lucide kebab-case names', () => {
  // Lucide's "pencil" is not a semantic name; the lowercase namespace is semantic only.
  expect(resolve('pencil')).toBeNull();
  expect(resolve('lucide:pencil')).toBeNull();
});

test('resolveIconName returns null for unknown names and non-strings', () => {
  expect(resolve('NotAnIcon')).toBeNull();
  expect(resolve('not-an-icon')).toBeNull();
  expect(resolve('AiOutlineUser')).toBeNull();
  expect(resolve(undefined)).toBeNull();
  expect(resolve({ name: 'edit' })).toBeNull();
  expect(resolve('has space')).toBeNull();
});

test('resolveIconName keeps a qualified name inside its set', () => {
  const icons = createIcons({
    sets: { tabler: [createTestIconLayer({ icons: { Tabler: { node } } })] },
  });
  expect(resolve('tabler:Tabler', icons)).toEqual({
    setId: 'tabler',
    layer: 0,
    iconName: 'Tabler',
  });
  // Pencil is a Lucide name, but the author asked for the tabler set.
  expect(resolve('tabler:Pencil', icons)).toBeNull();
  expect(resolve('missing:Pencil', icons)).toBeNull();
});

test('resolveIconName resolves set names in the default set, then Lucide', () => {
  const icons = createIcons({
    defaultSet: 'tabler',
    sets: { tabler: [createTestIconLayer({ icons: { Pencil: { node }, Only: { node } } })] },
  });
  expect(resolve('Pencil', icons)).toEqual({ setId: 'tabler', layer: 0, iconName: 'Pencil' });
  expect(resolve('Only', icons)).toEqual({ setId: 'tabler', layer: 0, iconName: 'Only' });
  expect(resolve('House', icons)).toEqual({ setId: 'lucide', layer: 0, iconName: 'House' });
});

test('resolveIconName lets the default set win a name it shares with Lucide (PiSquare order)', () => {
  const sets = { 'react-icons': [createTestIconLayer({ icons: { PiSquare: { node } } })] };
  // PiSquare is both a Lucide name and a react-icons name.
  expect(resolve('PiSquare', createIcons({ sets }))).toEqual({
    setId: 'lucide',
    layer: 0,
    iconName: 'PiSquare',
  });
  expect(resolve('PiSquare', createIcons({ sets, defaultSet: 'react-icons' }))).toEqual({
    setId: 'react-icons',
    layer: 0,
    iconName: 'PiSquare',
  });
});

test('resolveIconName gives a name to the last layer that has it', () => {
  const icons = createIcons({
    sets: {
      acme: [
        createTestIconLayer({ packageName: 'first', icons: { Shared: { node }, First: { node } } }),
        createTestIconLayer({ packageName: 'second', icons: { Shared: { node } } }),
      ],
    },
  });
  expect(resolve('acme:Shared', icons)).toEqual({ setId: 'acme', layer: 1, iconName: 'Shared' });
  // The second layer is partial; First falls through to the layer below.
  expect(resolve('acme:First', icons)).toEqual({ setId: 'acme', layer: 0, iconName: 'First' });
});

test('resolveIconName resolves an icon a plugin adds to lucide unqualified, and a replaced icon follows its semantic name', () => {
  const icons = createIcons({
    sets: {
      lucide: [createTestIconLayer({ icons: { Invoice: { node }, Pencil: { node } } })],
    },
  });
  expect(resolve('Invoice', icons)).toEqual({ setId: 'lucide', layer: 1, iconName: 'Invoice' });
  expect(resolve('Pencil', icons)).toEqual({ setId: 'lucide', layer: 1, iconName: 'Pencil' });
  expect(resolve('edit', icons)).toEqual({ setId: 'lucide', layer: 1, iconName: 'Pencil' });
  expect(resolve('Trash', icons)).toEqual({ setId: 'lucide', layer: 0, iconName: 'Trash' });
});

test('resolveIconName resolves semantic names through app aliases over set maps over built-ins', () => {
  const sets = {
    tabler: [
      createTestIconLayer({
        icons: { TablerEdit: { node }, TablerTrash: { node } },
        semantic: { edit: 'TablerEdit', delete: 'TablerTrash' },
      }),
    ],
  };
  const icons = createIcons({
    sets,
    defaultSet: 'tabler',
    aliases: { delete: 'lucide:Trash2', invoice: 'Receipt' },
  });
  expect(resolve('edit', icons)).toEqual({ setId: 'tabler', layer: 0, iconName: 'TablerEdit' });
  expect(resolve('delete', icons)).toEqual({ setId: 'lucide', layer: 0, iconName: 'Trash2' });
  expect(resolve('invoice', icons)).toEqual({ setId: 'lucide', layer: 0, iconName: 'Receipt' });
  // Names the set leaves out keep their Lucide targets.
  expect(resolve('home', icons)).toEqual({ setId: 'lucide', layer: 0, iconName: 'House' });
});

test('resolveIconName ignores the semantic map of a set that is not the default', () => {
  const sets = {
    tabler: [
      createTestIconLayer({ icons: { TablerEdit: { node } }, semantic: { edit: 'TablerEdit' } }),
    ],
  };
  expect(resolve('edit', createIcons({ sets }))).toEqual({
    setId: 'lucide',
    layer: 0,
    iconName: 'Pencil',
  });
});
