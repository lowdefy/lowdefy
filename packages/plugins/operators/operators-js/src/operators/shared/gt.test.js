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

import gt from './gt.js';

test('_gt param 0 greater than param 1', () => {
  expect(gt({ params: [1, 0] })).toBe(true);
  expect(gt({ params: [0, -1] })).toBe(true);
  expect(gt({ params: [1, -1] })).toBe(true);
  expect(gt({ params: [0.2, 0.1] })).toBe(true);
  expect(gt({ params: [1, null] })).toBe(true);
  expect(gt({ params: [new Date(2), new Date(1)] })).toBe(true);
  expect(gt({ params: [new Date(2), null] })).toBe(true);
  expect(gt({ params: ['bbb', 'bb'] })).toBe(true);
});

test('_gt param 0 less than param 1', () => {
  expect(gt({ params: [1, 1] })).toBe(false);
  expect(gt({ params: [0, 1] })).toBe(false);
  expect(gt({ params: [-1, 0] })).toBe(false);
  expect(gt({ params: [-1, 1] })).toBe(false);
  expect(gt({ params: [0.1, 0.2] })).toBe(false);
  expect(gt({ params: [null, 1] })).toBe(false);
  expect(gt({ params: [null, null] })).toBe(false);
  expect(gt({ params: [new Date(1), new Date(2)] })).toBe(false);
  expect(gt({ params: [null, new Date(2)] })).toBe(false);
  expect(gt({ params: [false, true] })).toBe(false);
  expect(gt({ params: ['a', 'b'] })).toBe(false);
  expect(gt({ params: ['aa', 'b'] })).toBe(false);
  expect(gt({ params: ['b', 'bb'] })).toBe(false);
  expect(gt({ params: [new Date(1), new Date(1)] })).toBe(false);
  expect(gt({ params: ['b', 'b'] })).toBe(false);
});

test('_gt params not an array', () => {
  expect(() => gt({ params: '1, 0' })).toThrow('_gt takes an array type as input.');
});

test('_gt params array with length 1', () => {
  expect(() => gt({ params: [1] })).toThrow('_gt takes an array of length 2 as input.');
});

test('_gt params array with length 3', () => {
  expect(() => gt({ params: [1, 2, 3] })).toThrow('_gt takes an array of length 2 as input.');
});
