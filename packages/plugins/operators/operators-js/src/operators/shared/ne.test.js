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

import ne from './ne.js';

test('_ne param 0 equal 1', () => {
  expect(ne({ params: [1, 1] })).toBe(false);
  expect(ne({ params: [0, 0] })).toBe(false);
  expect(ne({ params: [null, null] })).toBe(false);
  expect(ne({ params: [true, true] })).toBe(false);
  expect(ne({ params: [false, false] })).toBe(false);
  expect(ne({ params: ['123', '123'] })).toBe(false);
  expect(ne({ params: [new Date(1).toString(), new Date(1).toString()] })).toBe(false);
});

test('_ne param 0 not eq 1', () => {
  expect(ne({ params: [0, 1] })).toBe(true);
  expect(ne({ params: [-1, 0] })).toBe(true);
  expect(ne({ params: [-1, 1] })).toBe(true);
  expect(ne({ params: [0.1, 0.2] })).toBe(true);
  expect(ne({ params: [null, 1] })).toBe(true);
  expect(ne({ params: [null, 0] })).toBe(true);
  expect(ne({ params: [new Date(1), new Date(2)] })).toBe(true);
  expect(ne({ params: [new Date(1), new Date(1)] })).toBe(true);
  expect(ne({ params: [false, true] })).toBe(true);
  expect(ne({ params: ['a', 'b'] })).toBe(true);
  expect(ne({ params: ['aa', 'b'] })).toBe(true);
  expect(ne({ params: ['b', 'bb'] })).toBe(true);
});

test('_ne params not an array', () => {
  expect(() => ne({ params: '1, 0' })).toThrow('_ne takes an array type as input.');
});

test('_ne params array with length 1', () => {
  expect(() => ne({ params: [1] })).toThrow('_ne takes an array of length 2 as input.');
});

test('_ne params array with length 3', () => {
  expect(() => ne({ params: [1, 2, 3] })).toThrow('_ne takes an array of length 2 as input.');
});
