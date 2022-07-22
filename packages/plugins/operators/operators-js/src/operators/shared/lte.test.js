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

import lte from './lte.js';

test('_lte param 0 less than param 1', () => {
  expect(lte({ params: [1, 1] })).toBe(true);
  expect(lte({ params: [0, 1] })).toBe(true);
  expect(lte({ params: [-1, 0] })).toBe(true);
  expect(lte({ params: [-1, 1] })).toBe(true);
  expect(lte({ params: [0.1, 0.2] })).toBe(true);
  expect(lte({ params: [null, 1] })).toBe(true);
  expect(lte({ params: [null, null] })).toBe(true);
  expect(lte({ params: [new Date(1), new Date(2)] })).toBe(true);
  expect(lte({ params: [new Date(1), new Date(1)] })).toBe(true);
  expect(lte({ params: [null, new Date(2)] })).toBe(true);
  expect(lte({ params: [false, true] })).toBe(true);
  expect(lte({ params: ['a', 'b'] })).toBe(true);
  expect(lte({ params: ['aa', 'b'] })).toBe(true);
  expect(lte({ params: ['b', 'bb'] })).toBe(true);
  expect(lte({ params: ['b', 'b'] })).toBe(true);
});

test('_lte param 0 greater than param 1', () => {
  expect(lte({ params: [1, 0] })).toBe(false);
  expect(lte({ params: [0, -1] })).toBe(false);
  expect(lte({ params: [1, -1] })).toBe(false);
  expect(lte({ params: [0.2, 0.1] })).toBe(false);
  expect(lte({ params: [1, null] })).toBe(false);
  expect(lte({ params: [new Date(2), new Date(1)] })).toBe(false);
  expect(lte({ params: [new Date(2), null] })).toBe(false);
  expect(lte({ params: ['bbb', 'bb'] })).toBe(false);
});

test('_lte params not an array', () => {
  expect(() => lte({ params: '1, 0' })).toThrow('_lte takes an array type as input.');
});

test('_lte params array with length 1', () => {
  expect(() => lte({ params: [1] })).toThrow('_lte takes an array of length 2 as input.');
});

test('_lte params array with length 3', () => {
  expect(() => lte({ params: [1, 2, 3] })).toThrow('_lte takes an array of length 2 as input.');
});
