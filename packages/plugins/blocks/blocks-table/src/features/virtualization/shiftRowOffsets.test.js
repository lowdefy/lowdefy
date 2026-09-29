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

import computeRowOffsets from './computeRowOffsets.js';
import shiftRowOffsets from './shiftRowOffsets.js';

test('shiftRowOffsets moves the items after each changed item', () => {
  const offsets = Float64Array.from([0, 40, 80, 120, 160, 200]);
  shiftRowOffsets({
    offsets,
    changes: [
      { index: 3, delta: -10 },
      { index: 1, delta: 20 },
    ],
  });
  expect(Array.from(offsets)).toEqual([0, 40, 100, 140, 170, 210]);
});

test('shiftRowOffsets matches a full recompute with the new heights', () => {
  const heights = [40, 40, 40, 40, 40, 40, 40];
  const rows = heights.map((_, index) => index);
  const offsets = computeRowOffsets({ rows, rowHeight: 40, heightOf: (_, i) => heights[i] });
  heights[2] = 64;
  heights[6] = 20;
  heights[0] = 41;
  shiftRowOffsets({
    offsets,
    changes: [
      { index: 2, delta: 24 },
      { index: 6, delta: -20 },
      { index: 0, delta: 1 },
    ],
  });
  expect(Array.from(offsets)).toEqual(
    Array.from(computeRowOffsets({ rows, rowHeight: 40, heightOf: (_, i) => heights[i] }))
  );
});

test('shiftRowOffsets leaves the offsets alone without changes', () => {
  const offsets = Float64Array.from([0, 40, 80]);
  shiftRowOffsets({ offsets, changes: [] });
  expect(Array.from(offsets)).toEqual([0, 40, 80]);
});
