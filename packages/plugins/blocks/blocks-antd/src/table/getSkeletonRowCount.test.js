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

import getSkeletonRowCount from './getSkeletonRowCount.js';

test('getSkeletonRowCount fills the body height', () => {
  expect(getSkeletonRowCount({ bodyHeight: 280, rowHeight: 40 })).toBe(7);
  expect(getSkeletonRowCount({ bodyHeight: 290, rowHeight: 40 })).toBe(8);
});

test('getSkeletonRowCount is capped at the page size', () => {
  expect(getSkeletonRowCount({ bodyHeight: 800, rowHeight: 40, pageSize: 5 })).toBe(5);
});

test('getSkeletonRowCount is capped at the rows already known', () => {
  expect(getSkeletonRowCount({ bodyHeight: 800, rowHeight: 40, rowCount: 3 })).toBe(3);
});

test('getSkeletonRowCount shows at least one row', () => {
  expect(getSkeletonRowCount({ bodyHeight: 0, rowHeight: 40 })).toBe(1);
});
