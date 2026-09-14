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

import {
  COLUMN_GAP,
  DEFAULT_CONTENT_WIDTH,
  columnWidthOf,
  contentHeightOf,
  contentWidthOf,
} from './geometry.js';

test('the default content width is A4 portrait minus the side margins', () => {
  expect(DEFAULT_CONTENT_WIDTH).toBeCloseTo(515.28, 5);
  expect(contentWidthOf()).toBe(DEFAULT_CONTENT_WIDTH);
});

test('content width follows size and orientation', () => {
  expect(contentWidthOf({ size: 'letter' })).toBe(532);
  expect(contentWidthOf({ size: 'A4', orientation: 'landscape' })).toBeCloseTo(761.89, 5);
  expect(contentWidthOf({ size: 'unknown' })).toBe(DEFAULT_CONTENT_WIDTH);
});

test('content height removes the header and footer bands', () => {
  expect(contentHeightOf()).toBeCloseTo(731.89, 5);
  expect(contentHeightOf({ orientation: 'landscape' })).toBeCloseTo(485.28, 5);
});

test('a fraction column takes its share of the row once gutters are removed', () => {
  expect(columnWidthOf({ availableWidth: 480, count: 2, fraction: 0.5 })).toBe(
    (480 - COLUMN_GAP) / 2
  );
  expect(columnWidthOf({ availableWidth: 480, count: 1, fraction: 1 })).toBe(480);
});

test('a flex column takes an equal share of the row once gutters are removed', () => {
  expect(columnWidthOf({ availableWidth: 480, count: 3 })).toBe((480 - 2 * COLUMN_GAP) / 3);
  expect(columnWidthOf({ availableWidth: 480, count: 0 })).toBe(480);
});
