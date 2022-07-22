/*
  Copyright 2020-2022 Lowdefy, Inc

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

import product from './product.js';

test('_product number parameters', () => {
  expect(product({ params: [1, 3] })).toBe(3);
  expect(product({ params: [1, -1] })).toBe(-1);
  expect(product({ params: [1, 2, 3, 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, 4.2, 5.123] })).toBe(129.0996);
});

test('_product ignores non number parameters', () => {
  expect(product({ params: [1, 2, 3, null, 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, undefined, 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, true, 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, false, 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, NaN, 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, 'a', 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, [], 4, 5] })).toBe(120);
  expect(product({ params: [1, 2, 3, {}, 4, 5] })).toBe(120);
});

test('_product invalid parameters', () => {
  expect(() => product({ params: null })).toThrow('_product takes an array type as input.');
  expect(() => product({ params: 'a' })).toThrow('_product takes an array type as input.');
  expect(() => product({ params: false })).toThrow('_product takes an array type as input.');
});
