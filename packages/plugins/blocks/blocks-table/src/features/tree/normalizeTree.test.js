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

import normalizeTree from './normalizeTree.js';

test('normalizeTree returns null without a tree', () => {
  expect(normalizeTree({ tree: undefined })).toBeNull();
});

test('normalizeTree defaults the lazy children flag and the indent', () => {
  expect(normalizeTree({ tree: { parentField: 'parent_id', lazy: true } })).toEqual({
    childrenField: null,
    parentField: 'parent_id',
    lazy: true,
    hasChildrenField: 'hasChildren',
    indent: 20,
  });
});

test('normalizeTree throws unless exactly one of childrenField or parentField is set', () => {
  expect(() => normalizeTree({ tree: {} })).toThrow('requires one of "childrenField"');
  expect(() => normalizeTree({ tree: { childrenField: 'c', parentField: 'p' } })).toThrow(
    'requires one of "childrenField"'
  );
});

test('normalizeTree throws in server mode', () => {
  expect(() => normalizeTree({ tree: { parentField: 'p' }, server: {} })).toThrow(
    'server mode does not support trees'
  );
});
