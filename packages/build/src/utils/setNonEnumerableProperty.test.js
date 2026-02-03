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

import setNonEnumerableProperty from './setNonEnumerableProperty.js';

test('setNonEnumerableProperty sets a non-enumerable property on an object', () => {
  const obj = { a: 1 };
  setNonEnumerableProperty(obj, '~k', 'key-1');
  expect(obj['~k']).toBe('key-1');
  expect(Object.keys(obj)).toEqual(['a']);
});

test('setNonEnumerableProperty sets a writable property', () => {
  const obj = {};
  setNonEnumerableProperty(obj, '~r', 'ref-1');
  obj['~r'] = 'ref-2';
  expect(obj['~r']).toBe('ref-2');
});

test('setNonEnumerableProperty sets a configurable property', () => {
  const obj = {};
  setNonEnumerableProperty(obj, '~l', 5);
  setNonEnumerableProperty(obj, '~l', 10);
  expect(obj['~l']).toBe(10);
});

test('setNonEnumerableProperty works on arrays', () => {
  const arr = [1, 2, 3];
  setNonEnumerableProperty(arr, '~l', 7);
  expect(arr['~l']).toBe(7);
  expect(Object.keys(arr)).toEqual(['0', '1', '2']);
});
