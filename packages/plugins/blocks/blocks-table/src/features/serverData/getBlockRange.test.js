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

import getBlockRange from './getBlockRange.js';

test('getBlockRange returns the blocks covering a row range', () => {
  expect(getBlockRange({ startRow: 0, endRow: 200, blockSize: 200 })).toEqual({
    first: 0,
    last: 0,
  });
  expect(getBlockRange({ startRow: 190, endRow: 410, blockSize: 200 })).toEqual({
    first: 0,
    last: 2,
  });
  expect(getBlockRange({ startRow: 400, endRow: 401, blockSize: 200 })).toEqual({
    first: 2,
    last: 2,
  });
});

test('getBlockRange clips the range to the total when it is known', () => {
  expect(getBlockRange({ startRow: 150, endRow: 500, blockSize: 100, total: 250 })).toEqual({
    first: 1,
    last: 2,
  });
});

test('getBlockRange returns an empty range when the range holds no rows', () => {
  const { first, last } = getBlockRange({ startRow: 300, endRow: 500, blockSize: 100, total: 300 });
  expect(first > last).toBe(true);
  const empty = getBlockRange({ startRow: 10, endRow: 10, blockSize: 100 });
  expect(empty.first > empty.last).toBe(true);
});
