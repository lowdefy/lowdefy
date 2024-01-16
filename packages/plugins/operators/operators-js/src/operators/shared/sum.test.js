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

import sum from './sum.js';

test('_sum number parameters', () => {
  expect(sum({ params: [1, 1], location: 'locationId' })).toBe(2);
  expect(sum({ params: [1, -1], location: 'locationId' })).toBe(0);
  expect(sum({ params: [1, 2, 3, 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, 4.2, 5.123], location: 'locationId' })).toBe(15.323);
});

test('_sum ignores non number parameters', () => {
  expect(sum({ params: [1, 2, 3, null, 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, undefined, 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, true, 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, false, 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, NaN, 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, 'a', 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, [], 4, 5], location: 'locationId' })).toBe(15);
  expect(sum({ params: [1, 2, 3, {}, 4, 5], location: 'locationId' })).toBe(15);
});

test('_sum invalid parameters', () => {
  expect(() => sum({ params: null, location: 'locationId' })).toThrow(
    'Operator Error: _sum takes an array type as input. Received: null at locationId.'
  );
  expect(() => sum({ params: 'a', location: 'locationId' })).toThrow(
    'Operator Error: _sum takes an array type as input. Received: "a" at locationId.'
  );
  expect(() => sum({ params: false, location: 'locationId' })).toThrow(
    'Operator Error: _sum takes an array type as input. Received: false at locationId.'
  );
});
