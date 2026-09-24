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

import inputContainsOperator from './inputContainsOperator.js';
import valuesEqual from './valuesEqual.js';

test('valuesEqual compares plain data by content', () => {
  expect(valuesEqual(1, 1)).toBe(true);
  expect(valuesEqual('a', 'b')).toBe(false);
  expect(valuesEqual([], [])).toBe(true);
  expect(valuesEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
  expect(valuesEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  expect(valuesEqual({ a: undefined }, { b: undefined })).toBe(false);
  expect(valuesEqual(new Date(1), new Date(1))).toBe(true);
  expect(valuesEqual(new Date(1), new Date(2))).toBe(false);
  expect(valuesEqual(null, undefined)).toBe(false);
  expect(valuesEqual([], {})).toBe(false);
});

test('valuesEqual compares functions by identity only', () => {
  const fn = () => 1;
  expect(valuesEqual(fn, fn)).toBe(true);
  expect(
    valuesEqual(
      () => 1,
      () => 1
    )
  ).toBe(false);
  expect(valuesEqual(fn, undefined)).toBe(false);
  expect(valuesEqual({ fn: () => 1 }, { fn: () => 1 })).toBe(false);
});

test('inputContainsOperator finds single-key underscore objects at any depth', () => {
  expect(inputContainsOperator('text')).toBe(false);
  expect(inputContainsOperator(null)).toBe(false);
  expect(inputContainsOperator({ title: 'a', size: 3 })).toBe(false);
  expect(inputContainsOperator({ _state: 'a' })).toBe(true);
  expect(inputContainsOperator({ title: { _state: 'a' } })).toBe(true);
  expect(inputContainsOperator({ list: [1, { a: [{ '_string.concat': ['a'] }] }] })).toBe(true);
  expect(inputContainsOperator({ _a: 1, _b: 2 })).toBe(false);
});
