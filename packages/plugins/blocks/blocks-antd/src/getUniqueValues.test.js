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

import getUniqueValues from './getUniqueValues.js';

test('primitive string - return all items', () => {
  const arr = ['a', 'b', 'c'];
  expect(getUniqueValues(arr)).toEqual(arr);
});

test('primitive number - return all items', () => {
  const arr = [1, 3, 4, 4.5];
  expect(getUniqueValues(arr)).toEqual(arr);
});

test('primitive boolean and none - return all items', () => {
  const arr = [true, false, null, undefined];
  expect(getUniqueValues(arr)).toEqual(arr);
});

test('object.value string - return all items', () => {
  const arr = [
    { value: 'a', l: 'a' },
    { value: 'b', l: 'b' },
    { value: 'c', l: 'c' },
  ];
  expect(getUniqueValues(arr)).toEqual(arr);
});

test('object[key] number - return all items', () => {
  const arr = [
    { v: 1, l: 'a' },
    { v: 2, l: 'b' },
    { v: 3, l: 'c' },
  ];
  expect(getUniqueValues(arr, 'v')).toEqual(arr);
});

test('primitive string - remove duplicate', () => {
  const arr = ['a', 'a', 'b', 'c', 'b'];
  expect(getUniqueValues(arr)).toEqual(['a', 'b', 'c']);
});

test('primitive number - remove duplicate', () => {
  const arr = [1, 4, 2, 3, 4, 4.5, 3, 2, 2, 1];
  expect(getUniqueValues(arr)).toEqual([1, 4, 2, 3, 4.5]);
});

test('primitive boolean and none - remove duplicate', () => {
  const arr = [true, false, null, undefined, undefined, null, true, false];
  expect(getUniqueValues(arr)).toEqual([true, false, null, undefined]);
});

test('object.value string - remove duplicate', () => {
  const arr = [
    { value: 'a', l: 'a' },
    { value: 'b', l: 'b' },
    { value: 'a', l: 'y' },
    { value: 'c', l: 'c' },
    { value: 'b', l: 'x' },
  ];
  expect(getUniqueValues(arr)).toEqual([
    { value: 'a', l: 'a' },
    { value: 'b', l: 'b' },
    { value: 'c', l: 'c' },
  ]);
});

test('object[key] number - remove duplicate', () => {
  const arr = [
    { v: 1, l: 'a' },
    { v: 3, l: 'b' },
    { v: 3, l: '3' },
    { v: 3.1, l: 'b' },
    { v: 2, l: 'c' },
    { v: 1, l: 'x' },
  ];
  expect(getUniqueValues(arr, 'v')).toEqual([
    { v: 1, l: 'a' },
    { v: 3, l: 'b' },
    { v: 3.1, l: 'b' },
    { v: 2, l: 'c' },
  ]);
});

test('object.value objects and arrays - remove duplicate', () => {
  const arr = [
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    { value: [1, 2], l: '1' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
    { value: { a: 1, b: { c: 1 } }, l: 'y' },
  ];
  expect(getUniqueValues(arr)).toEqual([
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
  ]);
});

test('object.value mixed - remove duplicate', () => {
  const arr = [
    'a',
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    { value: [1, 2], l: '1' },
    undefined,
    { value: 3, l: '1' },
    { value: null, l: 'a' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
    'a',
    { value: { a: 1, b: { c: 1 } }, l: 'y' },
    3,
    { value: 'a', l: '1' },
    { value: undefined, l: '1' },
    { value: 3, l: 'c' },
    null,
  ];
  expect(getUniqueValues(arr)).toEqual([
    'a',
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    undefined,
    { value: 3, l: '1' },
    { value: null, l: 'a' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
  ]);
});
