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

import fitChips from './fitChips.js';

const moreWidth = (hidden) => 10 + String(hidden).length * 7;

test('fitChips shows every chip when they all fit', () => {
  expect(fitChips({ widths: [40, 50, 30], total: 3, moreWidth, gap: 4, width: 128 })).toBe(3);
});

test('fitChips keeps room for the +N count when some chips do not fit', () => {
  // 40 + 4 + 50 = 94, then 4 + 17 for "+1" = 115 <= 120; a third chip would need 4 + 30.
  expect(fitChips({ widths: [40, 50, 30], total: 3, moreWidth, gap: 4, width: 120 })).toBe(2);
  // 40 + 4 + 50 + 4 + 17 = 115 > 110, so only the first chip and "+2".
  expect(fitChips({ widths: [40, 50, 30], total: 3, moreWidth, gap: 4, width: 110 })).toBe(1);
});

test('fitChips shows one chip when not even one fits with the count', () => {
  expect(fitChips({ widths: [80, 50], total: 2, moreWidth, gap: 4, width: 60 })).toBe(1);
});

test('fitChips shows the last chip instead of a count when it fits without one', () => {
  // All three need 128; with 128 available no count is needed.
  expect(fitChips({ widths: [40, 50, 30], total: 3, moreWidth, gap: 4, width: 128 })).toBe(3);
  expect(fitChips({ widths: [40], total: 1, moreWidth, gap: 4, width: 20 })).toBe(1);
});

test('fitChips keeps an explicit cap and counts the capped values in +N', () => {
  // cell.max 2 of 4 values: at most two chips, and the count covers the other two.
  expect(fitChips({ widths: [40, 50], total: 4, moreWidth, gap: 4, width: 500 })).toBe(2);
  // 40 + 4 + 50 + 4 + "+2" (17) = 115 > 100: one chip and "+3".
  expect(fitChips({ widths: [40, 50], total: 4, moreWidth, gap: 4, width: 100 })).toBe(1);
});
