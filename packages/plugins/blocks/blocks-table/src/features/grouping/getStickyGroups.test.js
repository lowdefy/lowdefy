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

import assert from 'node:assert/strict';

import buildStickyLevels from './buildStickyLevels.js';
import getStickyGroups from './getStickyGroups.js';

function levelsOf(depths) {
  const rows = depths.map((depth) => (depth === null ? { kind: 'row' } : { kind: 'group', depth }));
  const groupIndices = Uint32Array.from(
    depths.flatMap((depth, index) => (depth === null ? [] : [index]))
  );
  const levelCount = Math.max(...depths.filter((depth) => depth !== null)) + 1;
  return buildStickyLevels({ groupIndices, levelCount, rows });
}

// One level: headers at list indices 0, 31 and 62 with 40px rows.
const oneLevel = levelsOf(
  Array.from({ length: 70 }, (_, index) => ([0, 31, 62].includes(index) ? 0 : null))
);

test('getStickyGroups shows nothing at the top of the list', () => {
  assert.deepEqual(getStickyGroups({ levels: oneLevel, rowHeight: 40, scrollTop: 0 }), []);
});

test('getStickyGroups shows the group whose rows are at the top', () => {
  assert.deepEqual(getStickyGroups({ levels: oneLevel, rowHeight: 40, scrollTop: 210 }), [
    { index: 0, shift: 0 },
  ]);
  assert.deepEqual(getStickyGroups({ levels: oneLevel, rowHeight: 40, scrollTop: 31 * 40 + 5 }), [
    { index: 31, shift: 0 },
  ]);
});

test('getStickyGroups pushes the overlay up as the next header arrives', () => {
  assert.deepEqual(getStickyGroups({ levels: oneLevel, rowHeight: 40, scrollTop: 31 * 40 - 20 }), [
    { index: 0, shift: -20 },
  ]);
});

test('getStickyGroups shows nothing while a header sits exactly at the top', () => {
  assert.deepEqual(getStickyGroups({ levels: oneLevel, rowHeight: 40, scrollTop: 31 * 40 }), []);
});

test('getStickyGroups shows nothing without groups', () => {
  assert.deepEqual(getStickyGroups({ levels: [], rowHeight: 40, scrollTop: 400 }), []);
});

test('getStickyGroups reads item tops from rowOffsets when items differ in height', () => {
  // Items 0 (group) and 1 are one row high, item 2 is a 100px detail row, item 3 is a group.
  const rowOffsets = new Float64Array([0, 40, 80, 180, 220]);
  const levels = levelsOf([0, null, null, 0]);
  assert.deepEqual(getStickyGroups({ levels, rowHeight: 40, rowOffsets, scrollTop: 100 }), [
    { index: 0, shift: 0 },
  ]);
  assert.deepEqual(getStickyGroups({ levels, rowHeight: 40, rowOffsets, scrollTop: 160 }), [
    { index: 0, shift: -20 },
  ]);
});

// Two levels, 10px rows: region A (0) with reps A1 (1, rows 2-5) and A2 (6, rows 7-9), then
// region B (10) with rep B1 (11, rows 12-19).
const dataRows = (count) => Array(count).fill(null);
const twoLevels = levelsOf([0, 1, ...dataRows(4), 1, ...dataRows(3), 0, 1, ...dataRows(8)]);

test('getStickyGroups stacks one header per level', () => {
  // Rows 3 and 4 sit under the two slots: region A above rep A1.
  assert.deepEqual(getStickyGroups({ levels: twoLevels, rowHeight: 10, scrollTop: 30 }), [
    { index: 0, shift: 0 },
    { index: 1, shift: 0 },
  ]);
});

test('getStickyGroups pushes the inner header out as the next inner group arrives', () => {
  // Rep A2 (6, top 60) is 5px below slot 1's bottom at scrollTop 45: rep A1 moves up 5px.
  assert.deepEqual(getStickyGroups({ levels: twoLevels, rowHeight: 10, scrollTop: 45 }), [
    { index: 0, shift: 0 },
    { index: 1, shift: -5 },
  ]);
});

test('getStickyGroups pushes both levels as the next outer group arrives, the inner one first', () => {
  // At scrollTop 95 slot 0 spans 95-105 and slot 1 105-115: region B's header (100-110) is 5px
  // into slot 0 (outer pushed 5px) and above slot 1 (inner pushed a row and 5px).
  assert.deepEqual(getStickyGroups({ levels: twoLevels, rowHeight: 10, scrollTop: 95 }), [
    { index: 0, shift: -5 },
    { index: 6, shift: -15 },
  ]);
});

test('getStickyGroups drops an inner level whose header belongs to the previous outer group', () => {
  // Region A (0) with rep A1 (1), then region B (4) collapsed, then region C (5) with rep C1 (6).
  const levels = levelsOf([0, 1, null, null, 0, 0, 1, null, null]);
  // Region B is under slot 0; the last rep header above slot 1 is A1, from region A.
  assert.deepEqual(getStickyGroups({ levels, rowHeight: 10, scrollTop: 41 }), [
    { index: 4, shift: -1 },
  ]);
});
