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

import changeLeafOperator from './changeLeafOperator.js';
import createDefaultLeaf from './createDefaultLeaf.js';
import toRootGroup from './toRootGroup.js';

test('changeLeafOperator keeps a value of the same shape', () => {
  expect(changeLeafOperator({ leaf: { key: 'a', op: 'eq', value: 3 }, op: 'gt' })).toEqual({
    key: 'a',
    op: 'gt',
    value: 3,
  });
});

test('changeLeafOperator turns a scalar into a list and back', () => {
  expect(changeLeafOperator({ leaf: { key: 'a', op: 'eq', value: 'x' }, op: 'in' })).toEqual({
    key: 'a',
    op: 'in',
    value: ['x'],
  });
  expect(changeLeafOperator({ leaf: { key: 'a', op: 'in', value: ['x', 'y'] }, op: 'ne' })).toEqual(
    { key: 'a', op: 'ne', value: 'x' }
  );
});

test('changeLeafOperator clears a value that does not fit and seeds within', () => {
  expect(changeLeafOperator({ leaf: { key: 'a', op: 'eq', value: 3 }, op: 'between' })).toEqual({
    key: 'a',
    op: 'between',
  });
  expect(changeLeafOperator({ leaf: { key: 'a', op: 'eq', value: 3 }, op: 'empty' })).toEqual({
    key: 'a',
    op: 'empty',
  });
  expect(changeLeafOperator({ leaf: { key: 'a', op: 'before' }, op: 'within' })).toEqual({
    key: 'a',
    op: 'within',
    value: { last: 7, unit: 'day' },
  });
});

test('createDefaultLeaf uses in for option columns and the first operator otherwise', () => {
  expect(createDefaultLeaf({ column: { key: 's', type: 'tag', options: ['a'] } })).toEqual({
    key: 's',
    op: 'in',
  });
  expect(createDefaultLeaf({ column: { key: 'n', type: 'text' } })).toEqual({
    key: 'n',
    op: 'contains',
  });
});

test('toRootGroup wraps a leaf and treats no filter as an empty and', () => {
  const leaf = { key: 'a', op: 'empty' };
  expect(toRootGroup(null)).toEqual({ and: [] });
  expect(toRootGroup(leaf)).toEqual({ and: [leaf] });
  expect(toRootGroup({ or: [leaf] })).toEqual({ or: [leaf] });
});
