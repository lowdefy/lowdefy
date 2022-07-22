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

import eq from './eq.js';

test('_eq false', () => {
  expect(eq({ params: [1, 2] })).toEqual(false);
  expect(eq({ params: [0, 1] })).toEqual(false);
  expect(eq({ params: [false, true] })).toEqual(false);
  expect(eq({ params: [true, false] })).toEqual(false);
});
test('_eq true', () => {
  expect(eq({ params: [1, 1] })).toEqual(true);
  expect(eq({ params: [0, 0] })).toEqual(true);
  expect(eq({ params: [true, true] })).toEqual(true);
  expect(eq({ params: [false, false] })).toEqual(true);
});
test('_eq errors', () => {
  expect(() => eq({ params: 'hello' })).toThrow('_eq takes an array type as input.');
  expect(() => eq({ params: null })).toThrow('_eq takes an array type as input.');
  expect(() => eq({ params: true })).toThrow('_eq takes an array type as input.');
  expect(() => eq({ params: false })).toThrow('_eq takes an array type as input.');
  expect(() => eq({ params: [1, 2, 3] })).toThrow('_eq takes an array of length 2 as input.');
});
