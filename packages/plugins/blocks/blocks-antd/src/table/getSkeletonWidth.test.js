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

import getSkeletonWidth from './getSkeletonWidth.js';

test('getSkeletonWidth is stable for the same row and column', () => {
  expect(getSkeletonWidth({ rowIndex: 3, columnKey: 'name' })).toBe(
    getSkeletonWidth({ rowIndex: 3, columnKey: 'name' })
  );
});

test('getSkeletonWidth stays between 40 and 90 percent', () => {
  for (let rowIndex = 0; rowIndex < 500; rowIndex++) {
    const width = getSkeletonWidth({ rowIndex, columnKey: `col_${rowIndex % 7}` });
    expect(width).toBeGreaterThanOrEqual(40);
    expect(width).toBeLessThanOrEqual(90);
  }
});

test('getSkeletonWidth varies across rows and columns', () => {
  const byRow = new Set();
  const byColumn = new Set();
  for (let i = 0; i < 20; i++) {
    byRow.add(getSkeletonWidth({ rowIndex: i, columnKey: 'name' }));
    byColumn.add(getSkeletonWidth({ rowIndex: 0, columnKey: `col_${i}` }));
  }
  expect(byRow.size).toBeGreaterThan(10);
  expect(byColumn.size).toBeGreaterThan(10);
});
