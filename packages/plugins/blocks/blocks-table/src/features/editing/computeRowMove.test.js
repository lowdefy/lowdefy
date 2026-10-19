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

import computeRowMove from './computeRowMove.js';
import positionBetween from './positionBetween.js';
import reorderByKeys from './reorderByKeys.js';
import sortByPosition from './sortByPosition.js';

const getKey = (row) => row.id;
const rows = [
  { id: 'a', pos: 1024 },
  { id: 'b', pos: 2048 },
  { id: 'c', pos: 3072 },
];

function move(options) {
  return computeRowMove({ rows, getKey, positionField: 'pos', ...options });
}

test('a move to the middle takes the midpoint of its new neighbours', () => {
  expect(move({ rowKey: 'c', gap: 1 })).toEqual({
    rowKey: 'c',
    fromIndex: 2,
    toIndex: 1,
    beforeKey: 'a',
    afterKey: 'b',
    order: ['a', 'c', 'b'],
    position: 1536,
    positions: { c: 1536 },
  });
});

test('a move to the top goes one step before the first row', () => {
  const result = move({ rowKey: 'b', gap: 0 });
  expect(result).toMatchObject({ toIndex: 0, beforeKey: null, afterKey: 'a', position: 0 });
  expect(result.positions).toEqual({ b: 0 });
});

test('a move to the bottom goes one step after the last row', () => {
  const result = move({ rowKey: 'a', gap: 3 });
  expect(result).toMatchObject({
    fromIndex: 0,
    toIndex: 2,
    beforeKey: 'c',
    afterKey: null,
    order: ['b', 'c', 'a'],
    position: 4096,
  });
});

test('positionBetween covers the ends, the middle, an empty list and no room', () => {
  expect(positionBetween()).toBe(1024);
  expect(positionBetween({ after: 100 })).toBe(-924);
  expect(positionBetween({ before: 100 })).toBe(1124);
  expect(positionBetween({ before: 1, after: 2 })).toBe(1.5);
  expect(positionBetween({ before: 1, after: 1 + 1e-7 })).toBe(null);
  expect(positionBetween({ before: 2, after: 1 })).toBe(null);
  expect(positionBetween({ before: null, after: 1 })).toBe(null);
});

test('a neighbour without a position renumbers the list', () => {
  const result = computeRowMove({
    rows: [{ id: 'x' }, { id: 'y' }],
    getKey,
    positionField: 'pos',
    rowKey: 'x',
    gap: 2,
  });
  expect(result.order).toEqual(['y', 'x']);
  expect(result.positions).toEqual({ y: 1024, x: 2048 });
  expect(result.position).toBe(2048);
});

test('a drop onto its own place is no move', () => {
  expect(move({ rowKey: 'b', gap: 1 })).toBe(null);
  expect(move({ rowKey: 'b', gap: 2 })).toBe(null);
  expect(move({ rowKey: 'zz', gap: 0 })).toBe(null);
});

test('a gap below 1e-6 renumbers the list and reports every changed position', () => {
  const tight = [
    { id: 'a', pos: 1 },
    { id: 'b', pos: 1 + 5e-7 },
    { id: 'c', pos: 2 },
  ];
  const result = computeRowMove({ rows: tight, getKey, positionField: 'pos', rowKey: 'c', gap: 1 });
  expect(result.order).toEqual(['a', 'c', 'b']);
  expect(result.positions).toEqual({ a: 1024, c: 2048, b: 3072 });
  expect(result.position).toBe(2048);
});

test('renumbering leaves out rows whose position already matches', () => {
  const tight = [
    { id: 'a', pos: 1024 },
    { id: 'b', pos: 1024 },
    { id: 'c', pos: 3072 },
  ];
  const result = computeRowMove({ rows: tight, getKey, positionField: 'pos', rowKey: 'c', gap: 1 });
  expect(result.positions).toEqual({ c: 2048, b: 3072 });
});

test('without a position field the move reports neighbours and the key order only', () => {
  const result = computeRowMove({ rows, getKey, rowKey: 'a', gap: 2 });
  expect(result).toEqual({
    rowKey: 'a',
    fromIndex: 0,
    toIndex: 1,
    beforeKey: 'b',
    afterKey: 'c',
    order: ['b', 'a', 'c'],
    position: undefined,
    positions: undefined,
  });
});

test('sortByPosition orders by position, keeping data order for ties and missing positions', () => {
  const sorted = sortByPosition({
    rows: [{ id: 1, pos: 3 }, { id: 2 }, { id: 3, pos: 1 }, { id: 4, pos: 3 }],
    positionField: 'pos',
  });
  expect(sorted.map(getKey)).toEqual([3, 1, 4, 2]);
});

test('reorderByKeys follows the key list and keeps unlisted rows after it', () => {
  const ordered = reorderByKeys({
    rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
    order: [3, '1'],
    getKey,
  });
  expect(ordered.map(getKey)).toEqual([3, 1, 2, 4]);
});
