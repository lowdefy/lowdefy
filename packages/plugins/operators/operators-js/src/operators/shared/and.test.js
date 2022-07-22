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
import _and from './and.js';

test('_and false', () => {
  expect(_and({ params: [0, 0] })).toEqual(false);
  expect(_and({ params: [0, 1] })).toEqual(false);
  expect(_and({ params: [1, 2, 3, 0] })).toEqual(false);
  expect(_and({ params: [false, false] })).toEqual(false);
  expect(_and({ params: [false, true] })).toEqual(false);
});
test('_and true', () => {
  expect(_and({ params: [1, 2] })).toEqual(true);
  expect(_and({ params: [1, 2, 3] })).toEqual(true);
  expect(_and({ params: [true, true] })).toEqual(true);
});
test('_and errors', () => {
  expect(() => _and({ params: 'hello' })).toThrow('_and takes an array type.');
  expect(() => _and({ params: null })).toThrow('_and takes an array type.');
  expect(() => _and({ params: true })).toThrow('_and takes an array type.');
  expect(() => _and({ params: false })).toThrow('_and takes an array type.');
});
