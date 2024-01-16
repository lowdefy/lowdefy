/*
  Copyright 2020-2024 Lowdefy, Inc

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

import swap from './swap.js';

test('swap', () => {
  const arr = [0, 1, 2, 3, 4];
  swap(arr, 2, 3);
  expect(arr).toEqual([0, 1, 3, 2, 4]);
});

test('swap', () => {
  const arr = [0, 1, 2, 3, 4];
  swap(arr, 0, 3);
  expect(arr).toEqual([3, 1, 2, 0, 4]);
});

test('swap out of bounds', () => {
  const arr = [0, 1, 2, 3, 4];
  swap(arr, -1, 3);
  expect(arr).toEqual(arr);
  swap(arr, 2, 8);
  expect(arr).toEqual(arr);
});

test('not an array', () => {
  const arr = 1;
  swap(arr, 2, 3);
  expect(arr).toEqual(1);
});
