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

// The table's documented shape (codemods v7-0-0/react-icons-to-lucide.json).
jest.unstable_mockModule('./readIconMigrationTable.js', () => ({
  default: () => ({
    icons: {
      AiOutlineDelete: 'delete',
      AiOutlineCreditCard: 'CreditCard',
      HomeOutlined: 'home',
    },
    review: {},
  }),
}));

const { default: createUnresolvedIconError } = await import('./createUnresolvedIconError.js');
const { default: createIconSemanticMap } = await import('./createIconSemanticMap.js');
const { default: createLucideIconLayer } = await import('./createLucideIconLayer.js');
const { default: createTestIconLayer } = await import('../../test-utils/createTestIconLayer.js');

const node = [['path', { d: 'M0 0' }]];

function createIcons({ sets = {}, defaultSet = 'lucide' } = {}) {
  const allSets = { ...sets, lucide: [createLucideIconLayer()] };
  return {
    sets: allSets,
    defaultSet,
    semantic: createIconSemanticMap({ sets: allSets, defaultSet }),
  };
}

function message(name, icons = createIcons()) {
  return createUnresolvedIconError({ name, icons, configKey: 'key-1' }).message;
}

test('createUnresolvedIconError returns a ConfigError with the icons check slug and config key', () => {
  const error = createUnresolvedIconError({ name: 'Nope', icons: createIcons(), configKey: 'k' });
  expect(error.name).toBe('ConfigError');
  expect(error.checkSlug).toBe('icons');
  expect(error.configKey).toBe('k');
});

test('createUnresolvedIconError suggests a semantic name and its target for a react-icons name', () => {
  expect(message('AiOutlineDelete')).toBe(
    'Icon "AiOutlineDelete" is a react-icons name. Lowdefy 7 uses Lucide icons. Use "delete" (or "Trash"). To keep react-icons names, install @lowdefy/icons-react-icons and set theme.icons.set: react-icons. Run `lowdefy upgrade` to migrate names automatically.'
  );
});

test('createUnresolvedIconError suggests a Lucide name for a react-icons name', () => {
  expect(message('AiOutlineCreditCard')).toContain('Use "CreditCard".');
});

test('createUnresolvedIconError does not mention installing the compatibility set when it is installed', () => {
  const icons = createIcons({
    sets: { 'react-icons': [createTestIconLayer({ icons: { AiOutlineUser: { node } } })] },
  });
  const text = message('AiOutlineDelete', icons);
  expect(text).not.toContain('install @lowdefy/icons-react-icons');
  expect(text).toContain('To keep react-icons names, set theme.icons.set: react-icons.');
});

test('createUnresolvedIconError points at search for a react-icons name the table does not cover', () => {
  expect(message('AiOutlineUnmapped')).toContain(
    'Use a semantic name or a Lucide name. Search icon names with lowdefy_search_icons.'
  );
});

test('createUnresolvedIconError gives a did-you-mean in the react-icons set when it is the default', () => {
  const icons = createIcons({
    defaultSet: 'react-icons',
    sets: { 'react-icons': [createTestIconLayer({ icons: { AiOutlineUser: { node } } })] },
  });
  expect(message('AiOutlineUsr', icons)).toBe(
    'Icon "AiOutlineUsr" is not an icon name. Did you mean "AiOutlineUser"?'
  );
});

test('createUnresolvedIconError gives stale Ant Design names the migration message', () => {
  expect(message('HomeOutlined')).toBe(
    'Icon "HomeOutlined" is an Ant Design icon name. Lowdefy 7 uses Lucide icons. Use "home" (or "House"). Run `lowdefy upgrade` to migrate names automatically.'
  );
});

test('createUnresolvedIconError suggests a similar semantic or Lucide name', () => {
  expect(message('delet')).toBe('Icon "delet" is not a semantic icon name. Did you mean "delete"?');
  expect(message('Pencl')).toBe('Icon "Pencl" is not an icon name. Did you mean "Pencil"?');
  // Lucide's kebab names are not accepted; the PascalCase name is suggested.
  expect(message('circle-plus')).toBe(
    'Icon "circle-plus" is not a semantic icon name. Did you mean "CirclePlus"?'
  );
});

test('createUnresolvedIconError reports a qualified name in a set that is not installed', () => {
  expect(message('tabler:Pencil')).toBe(
    'Icon "tabler:Pencil" names the icon set "tabler", which is not installed. Installed icon sets: "lucide".'
  );
});

test('createUnresolvedIconError suggests a qualified name within its set', () => {
  expect(message('lucide:Pencl')).toBe(
    'Icon "lucide:Pencl" is not in the "lucide" icon set. Did you mean "lucide:Pencil"?'
  );
});
