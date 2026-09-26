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

jest.unstable_mockModule('./readIconMigrationTable.js', () => ({
  default: () => ({ icons: { AiOutlineDelete: 'delete', HomeOutlined: 'home' }, review: {} }),
}));

const { default: validateIconNames } = await import('./validateIconNames.js');
const { default: createIconContext } = await import('./createIconContext.js');

const icons = await createIconContext({ context: { typesMap: { iconSets: {} } }, iconsConfig: {} });

function validate(config) {
  const context = { errors: [], keyMap: {} };
  validateIconNames({ config, icons, context });
  return context.errors.map((error) => error.message);
}

function withKey(object, key) {
  Object.defineProperty(object, '~k', { value: key, enumerable: false });
  return object;
}

test('validateIconNames accepts semantic, set, alias and qualified names at icon positions', () => {
  expect(
    validate({
      properties: {
        icon: 'edit',
        prefixIcon: 'Pencil',
        suffixIcon: 'Home',
        clearIcon: 'lucide:X',
        checkedIcon: { name: 'check', size: 12 },
      },
    })
  ).toEqual([]);
});

test('validateIconNames raises for an unresolvable name at a key ending in icon', () => {
  expect(validate({ properties: { icon: 'NotAnIcon', maxIcon: 'nope-nope' } })).toEqual([
    'Icon "NotAnIcon" is not an icon name. Search icon names with lowdefy_search_icons.',
    expect.stringMatching(/^Icon "nope-nope" is not a semantic icon name\./),
  ]);
});

test('validateIconNames raises for an icon object name', () => {
  expect(validate({ properties: { icon: { name: 'AiOutlineDelete' } } })).toEqual([
    expect.stringMatching(/^Icon "AiOutlineDelete" is a react-icons name\./),
  ]);
});

test('validateIconNames raises for an Icon block name', () => {
  expect(
    validate({ blocks: [{ id: 'i', type: 'Icon', properties: { name: 'HomeOutlined' } }] })
  ).toEqual([expect.stringMatching(/^Icon "HomeOutlined" is an Ant Design icon name\./)]);
  expect(
    validate({ blocks: [{ id: 't', type: 'Title', properties: { name: 'Anything' } }] })
  ).toEqual([]);
});

test('validateIconNames raises for a data-icon attribute in any string', () => {
  expect(
    validate({ properties: { content: '<i data-icon="delet"></i> <i data-icon="edit"></i>' } })
  ).toEqual(['Icon "delet" is not a semantic icon name. Did you mean "delete"?']);
});

test('validateIconNames ignores strings outside icon positions', () => {
  expect(validate({ properties: { title: 'AiOutlineDelete', label: 'nope-nope' } })).toEqual([]);
});

test('validateIconNames ignores values that are not a name form', () => {
  expect(validate({ favicon: '/favicon.ico', icon: '$icon', maxIcon: '', minIcon: true })).toEqual(
    []
  );
});

test('validateIconNames skips operator subtrees at icon positions', () => {
  expect(
    validate({
      properties: {
        icon: { _if: { test: { _state: 'done' }, then: 'check', else: 'not-an-icon' } },
        prefixIcon: { name: { _state: 'iconName' } },
      },
    })
  ).toEqual([]);
});

test('validateIconNames skips operator subtrees everywhere, including data-icon in _js', () => {
  expect(
    validate({ properties: { html: { _js: 'return \'<i data-icon="nope-nope"></i>\';' } } })
  ).toEqual([]);
});

test('validateIconNames skips classNames and styles slots named after an icon', () => {
  expect(
    validate({
      class: { '.icon': 'text-blue-500' },
      classNames: { icon: 'text-blue-500', '.icon': 'text-blue-500' },
      styles: { icon: 'text-blue-500' },
      style: { '.icon': 'text-blue-500' },
    })
  ).toEqual([]);
});

test('validateIconNames skips request properties', () => {
  expect(
    validate({
      requests: [{ id: 'r', properties: { update: { $set: { icon: 'AiOutlineUser' } } } }],
    })
  ).toEqual([]);
});

test('validateIconNames reports the config key of the object holding the icon position', () => {
  const context = { errors: [], keyMap: {} };
  const properties = withKey({ icon: 'NotAnIcon' }, 'props-key');
  validateIconNames({ config: withKey({ properties }, 'block-key'), icons, context });
  expect(context.errors[0].configKey).toBe('props-key');
  expect(context.errors[0].checkSlug).toBe('icons');
});

test('validateIconNames reports a name once per config key', () => {
  expect(validate({ icon: 'NotAnIcon', prefixIcon: 'NotAnIcon' })).toHaveLength(1);
});
