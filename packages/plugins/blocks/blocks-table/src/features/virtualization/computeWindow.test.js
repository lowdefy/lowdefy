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

import computeWindow from './computeWindow.js';

const layout = { center: [], centerEnds: [], centerStarts: [], startWidth: 0, endWidth: 0 };

function windowAt({ scrollTop, rowOffsets }) {
  return computeWindow({
    direction: 0,
    headerHeight: 40,
    layout,
    rowCount: 100,
    rowHeight: 40,
    rowOffsets,
    scrollLeft: 0,
    scrollTop,
    viewportHeight: 440,
    viewportWidth: 800,
    virtualColumns: false,
    virtualRows: true,
  });
}

test('computeWindow finds the rendered rows by index times row height', () => {
  const { rowStart, rowEnd } = windowAt({ scrollTop: 400 });
  expect(rowStart).toBe(7);
  expect(rowEnd).toBe(23);
});

test('computeWindow finds the rendered rows by offsets when items differ in height', () => {
  // Item 5 is a 400px detail row: every item after it starts 360px lower.
  const rowOffsets = new Float64Array(101);
  let top = 0;
  for (let i = 0; i < 100; i++) {
    rowOffsets[i] = top;
    top += i === 5 ? 400 : 40;
  }
  rowOffsets[100] = top;
  const { rowStart, rowEnd } = windowAt({ scrollTop: 400, rowOffsets });
  // The window spans 300px to 900px: items 5 (200-600) to 13 (880-920).
  expect(rowStart).toBe(5);
  expect(rowEnd).toBe(14);
});
