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

import collectIconNames from './collectIconNames.js';

const aliases = { edit: 'LuPencil', 'external-link': 'LuExternalLink', user: 'LuUser' };

function collect(value) {
  return collectIconNames({ json: JSON.stringify(value), aliases });
}

test('collectIconNames finds react-icons names used as string values', () => {
  const result = collect({ properties: { icon: 'AiOutlineUser', suffixIcon: 'LuPencil' } });
  expect(result.packageIcons['react-icons/ai']).toEqual(new Set(['AiOutlineUser']));
  expect(result.packageIcons['react-icons/lu']).toEqual(new Set(['LuPencil']));
});

test('collectIconNames finds semantic names used as string values', () => {
  const result = collect({ properties: { icon: 'edit', title: 'external-link' } });
  expect(result.aliasNames).toEqual(new Set(['edit', 'external-link']));
});

test('collectIconNames ignores semantic names used as object keys', () => {
  const result = collect({ user: { name: 'Jane' } });
  expect(result.aliasNames).toEqual(new Set());
});

test('collectIconNames ignores semantic names inside longer strings', () => {
  const result = collect({ title: 'edit the user' });
  expect(result.aliasNames).toEqual(new Set());
});

test('collectIconNames finds double-quoted data-icon values in HTML strings', () => {
  const result = collect({
    html: '<i data-icon="LuTrash2"></i> <i data-icon="edit"></i>',
  });
  expect(result.packageIcons['react-icons/lu']).toEqual(new Set(['LuTrash2']));
  expect(result.aliasNames).toEqual(new Set(['edit']));
});

test('collectIconNames finds single-quoted data-icon values in HTML strings', () => {
  const result = collect({ html: "<i data-icon='AiFillHome'></i>" });
  expect(result.packageIcons['react-icons/ai']).toEqual(new Set(['AiFillHome']));
});

test('collectIconNames reports data-icon values that are neither aliases nor react-icons names', () => {
  const result = collect({ html: '<i data-icon="pencil"></i>' });
  expect(result.unknownDataIcons).toEqual(new Set(['pencil']));
});

test('collectIconNames skips templated data-icon values', () => {
  const result = collect({ html: '<i data-icon="{{ icon }}"></i>' });
  expect(result.unknownDataIcons).toEqual(new Set());
  expect(result.aliasNames).toEqual(new Set());
});

test('collectIconNames adds IoIos names to both io packages like the string value match', () => {
  const result = collect({ html: '<i data-icon="IoIosAdd"></i>' });
  expect(result.packageIcons['react-icons/io']).toEqual(new Set(['IoIosAdd']));
  expect(result.packageIcons['react-icons/io5']).toEqual(new Set(['IoIosAdd']));
});

test('collectIconNames finds data-icon written with spaces, capitals or no quotes', () => {
  const result = collect({
    html: '<i data-icon = "edit"></i><i DATA-ICON="LuTrash2"></i><i data-icon=user></i>',
  });
  expect(result.aliasNames).toEqual(new Set(['edit', 'user']));
  expect(result.packageIcons['react-icons/lu']).toEqual(new Set(['LuTrash2']));
});

test('collectIconNames skips a data-icon value with a template suffix', () => {
  const result = collect({ html: '<i data-icon="edit-{{ n }}"></i>' });
  expect(result.aliasNames).toEqual(new Set());
  expect(result.unknownDataIcons).toEqual(new Set());
});

test('collectIconNames finds data-icon in unescaped JS source text', () => {
  const result = collectIconNames({
    json: 'return `<i data-icon="edit"></i>`;',
    aliases,
  });
  expect(result.aliasNames).toEqual(new Set(['edit']));
});
