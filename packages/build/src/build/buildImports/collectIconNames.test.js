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

function collectJson(value) {
  return [...collectIconNames({ text: JSON.stringify(value) })].sort();
}

function collectJs(source) {
  return [...collectIconNames({ text: source })].sort();
}

test('collectIconNames finds semantic, set and qualified names as whole string values', () => {
  expect(
    collectJson({ properties: { icon: 'edit', suffixIcon: 'Pencil', prefixIcon: 'lucide:House' } })
  ).toEqual(['Pencil', 'edit', 'lucide:House']);
});

test('collectIconNames skips object keys', () => {
  expect(collectJson({ user: 1, Pencil: 2 })).toEqual([]);
});

test('collectIconNames skips values of type keys', () => {
  expect(
    collectJson({
      blocks: [
        { type: 'Box', properties: { title: 'x y' } },
        { type: 'Menu' },
        { type: 'warning' },
      ],
    })
  ).toEqual([]);
});

test('collectIconNames still finds names under keys that end in type', () => {
  expect(collectJson({ blockType: 'Box', subtype: 'Menu' })).toEqual(['Box', 'Menu']);
});

test('collectIconNames skips strings that are not a name form', () => {
  expect(
    collectJson({ a: 'has space', b: '/favicon.ico', c: 'snake_case', d: 'Pencil2x' })
  ).toEqual(['Pencil2x']);
});

test('collectIconNames finds names in operator branches', () => {
  expect(collectJson({ icon: { _if: { test: true, then: 'Pencil', else: 'delete' } } })).toEqual([
    'Pencil',
    'delete',
  ]);
});

test('collectIconNames finds single- and double-quoted literals in JS source', () => {
  const source = "return state.done ? 'check' : \"lucide:Clock\";\nconst block = { type: 'Box' };";
  expect(collectJs(source)).toEqual(['check', 'lucide:Clock']);
});

test('collectIconNames finds JS literals inside a JSON string (_js code in page config)', () => {
  expect(collectJson({ _js: 'return \'edit\' + "Pencil";' })).toEqual(['Pencil', 'edit']);
});

test('collectIconNames finds data-icon values in HTML strings', () => {
  expect(
    collectJson({
      html: '<i data-icon="edit"></i> <i data-icon=\'Pencil\'></i> <i DATA-ICON = lucide:House></i>',
    })
  ).toEqual(['Pencil', 'edit', 'lucide:House']);
});

test('collectIconNames skips templated data-icon values', () => {
  expect(collectJson({ html: '<i data-icon="edit-{{ n }}"></i>' })).toEqual([]);
});
