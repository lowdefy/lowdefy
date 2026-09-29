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

import getFilteredKeys from './getFilteredKeys.js';
import isCompleteLeaf from './isCompleteLeaf.js';
import pruneCondition from './pruneCondition.js';

test('isCompleteLeaf needs a key, an operator and a value unless the operator takes none', () => {
  expect(isCompleteLeaf({ key: 'a', op: 'eq', value: 1 })).toBe(true);
  expect(isCompleteLeaf({ key: 'a', op: 'eq', value: 0 })).toBe(true);
  expect(isCompleteLeaf({ key: 'a', op: 'eq' })).toBe(false);
  expect(isCompleteLeaf({ key: 'a', op: 'contains', value: '' })).toBe(false);
  expect(isCompleteLeaf({ key: 'a', op: 'in', value: [] })).toBe(false);
  expect(isCompleteLeaf({ key: 'a', op: 'empty' })).toBe(true);
  expect(isCompleteLeaf({ key: 'a', op: 'isFalse' })).toBe(true);
  expect(isCompleteLeaf({ op: 'eq', value: 1 })).toBe(false);
});

test('isCompleteLeaf accepts a between with one open end and a well formed within', () => {
  expect(isCompleteLeaf({ key: 'a', op: 'between', value: [1, null] })).toBe(true);
  expect(isCompleteLeaf({ key: 'a', op: 'between', value: [null, null] })).toBe(false);
  expect(isCompleteLeaf({ key: 'a', op: 'within', value: { last: 7, unit: 'day' } })).toBe(true);
  expect(isCompleteLeaf({ key: 'a', op: 'within', value: { last: 7, unit: 'hour' } })).toBe(false);
});

test('pruneCondition drops incomplete leaves and the groups they leave empty', () => {
  const complete = { key: 'a', op: 'gt', value: 1 };
  expect(
    pruneCondition({
      and: [complete, { key: 'b', op: 'in', value: [] }, { or: [{ key: 'c', op: 'eq' }] }],
    })
  ).toEqual({ and: [complete] });
  expect(pruneCondition({ or: [{ key: 'c', op: 'eq' }] })).toBe(null);
  expect(pruneCondition(null)).toBe(null);
});

test('pruneCondition passes malformed groups through for compileCondition to report', () => {
  expect(pruneCondition({ and: 'x' })).toEqual({ and: 'x' });
});

test('getFilteredKeys lists the columns complete conditions constrain', () => {
  const filter = {
    and: [
      { key: 'a', op: 'gt', value: 1 },
      { key: 'b', op: 'in', value: [] },
      {
        or: [
          { key: 'c', op: 'empty' },
          { key: 'd', op: 'eq', value: 'x' },
        ],
      },
    ],
  };
  expect([...getFilteredKeys(filter)]).toEqual(['a', 'c', 'd']);
  expect(getFilteredKeys(filter)).toBe(getFilteredKeys(filter));
  expect(getFilteredKeys(null).size).toBe(0);
});
