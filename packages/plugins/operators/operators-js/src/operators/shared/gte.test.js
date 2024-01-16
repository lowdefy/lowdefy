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

import gte from './gte.js';

const location = 'locationId';

test('_gte param 0 greater than param 1', () => {
  expect(gte({ params: [1, 1], location })).toBe(true);
  expect(gte({ params: [1, 0], location })).toBe(true);
  expect(gte({ params: [0, -1], location })).toBe(true);
  expect(gte({ params: [1, -1], location })).toBe(true);
  expect(gte({ params: [0.2, 0.1], location })).toBe(true);
  expect(gte({ params: [1, null], location })).toBe(true);
  expect(gte({ params: [null, null], location })).toBe(true);
  expect(gte({ params: [new Date(2), new Date(1)], location })).toBe(true);
  expect(gte({ params: [new Date(2), null], location })).toBe(true);
  expect(gte({ params: ['bbb', 'bb'], location })).toBe(true);
  expect(gte({ params: ['b', 'b'], location })).toBe(true);
  expect(gte({ params: [new Date(1), new Date(1)], location })).toBe(true);
});

test('_gte param 0 less than param 1', () => {
  expect(gte({ params: [0, 1], location })).toBe(false);
  expect(gte({ params: [-1, 0], location })).toBe(false);
  expect(gte({ params: [-1, 1], location })).toBe(false);
  expect(gte({ params: [0.1, 0.2], location })).toBe(false);
  expect(gte({ params: [null, 1], location })).toBe(false);
  expect(gte({ params: [new Date(1), new Date(2)], location })).toBe(false);
  expect(gte({ params: [null, new Date(2)], location })).toBe(false);
  expect(gte({ params: [false, true], location })).toBe(false);
  expect(gte({ params: ['a', 'b'], location })).toBe(false);
  expect(gte({ params: ['aa', 'b'], location })).toBe(false);
  expect(gte({ params: ['b', 'bb'], location })).toBe(false);
});

test('_gte params not an array', () => {
  expect(() => gte({ params: '1, 0', location })).toThrow(
    'Operator Error: _gte takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_gte params array with length 1', () => {
  expect(() => gte({ params: [1], location })).toThrow(
    'Operator Error: _gte takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_gte params array with length 3', () => {
  expect(() => gte({ params: [1, 2, 3], location })).toThrow(
    'Operator Error: _gte takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});
