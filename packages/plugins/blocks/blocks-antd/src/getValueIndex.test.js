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

import getValueIndex from './getValueIndex.js';

test('primitive string single', () => {
  expect(getValueIndex('b', ['a', 'b', 'c'])).toEqual('1');
});

test('primitive number single', () => {
  expect(getValueIndex(1, [0, 'c', 1, 'c'])).toEqual('2');
});

test('primitive boolean single', () => {
  expect(getValueIndex(false, [0, true, 1, false, 'c'])).toEqual('3');
  expect(getValueIndex(true, [0, true, 1, false, 'c'])).toEqual('1');
});

test('primitive none single', () => {
  expect(getValueIndex(null, [0, null, true, 1, false, 'c'])).toEqual('1');
  expect(getValueIndex(undefined, [0, true, 1, false, undefined, 'c'])).toEqual('4');
});

test('primitive string multiple', () => {
  expect(getValueIndex(['b', 'c'], ['a', 'b', 'd', 'c'], true)).toEqual(['1', '3']);
});

test('primitive number multiple', () => {
  expect(getValueIndex([1, 'x'], [0, 'x', 1, 'c'], true)).toEqual(['2', '1']);
});

test('primitive boolean multiple', () => {
  expect(getValueIndex(['c', false], [0, true, 1, false, 'c'], true)).toEqual(['4', '3']);
  expect(getValueIndex([true, 0], [0, true, 1, false, 'c'], true)).toEqual(['1', '0']);
});

test('primitive none multiple', () => {
  expect(getValueIndex([null, 'c'], [0, null, true, 1, false, 'c'], true)).toEqual(['1', '5']);
  expect(getValueIndex([undefined, false], [0, true, 1, false, undefined, 'c'], true)).toEqual([
    '4',
    '3',
  ]);
});

test('object.value string single', () => {
  const options = [
    { value: 'a', l: 'a' },
    { value: 'b', l: 'b' },
    { value: 'c', l: 'c' },
  ];
  expect(getValueIndex('c', options)).toEqual('2');
});

test('object[key] number single', () => {
  const options = [
    { v: 1, l: 'a' },
    { v: 3, l: 'b' },
    { v: 3.1, l: 'b' },
    { v: 2, l: 'c' },
  ];
  expect(getValueIndex(3.1, options, false, 'v')).toEqual('2');
});

test('object.value object single', () => {
  const options = [
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
  ];
  expect(getValueIndex([1, 2], options)).toEqual('0');
  expect(getValueIndex({ a: 1, b: { c: 1 } }, options)).toEqual('1');
});

test('object.value mixed single', () => {
  const options = [
    'a',
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    undefined,
    { value: 3, l: '1' },
    { value: null, l: 'a' },
    { value: 'x', l: 'a' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
  ];
  expect(getValueIndex('a', options)).toEqual('0');
  expect(getValueIndex([1, 2], options)).toEqual('1');
  expect(getValueIndex({ a: 1, b: { c: 1 } }, options)).toEqual('2');
  expect(getValueIndex(undefined, options)).toEqual('3');
  expect(getValueIndex(3, options)).toEqual('4');
  expect(getValueIndex(null, options)).toEqual('5');
  expect(getValueIndex('x', options)).toEqual('6');
  expect(getValueIndex({ a: 1, b: { c: 'x' } }, options)).toEqual('7');
});

test('object.value string multiple', () => {
  const options = [
    { value: 'a', l: 'a' },
    { value: 'b', l: 'b' },
    { value: 'c', l: 'c' },
  ];
  expect(getValueIndex(['c', 'b'], options, true)).toEqual(['2', '1']);
});

test('object[key] number multiple', () => {
  const options = [
    { v: 1, l: 'a' },
    { v: 3, l: 'b' },
    { v: 3.1, l: 'b' },
    { v: 2, l: 'c' },
  ];
  expect(getValueIndex([1, 2, 3.1], options, true, 'v')).toEqual(['0', '3', '2']);
});

test('object.value object multiple', () => {
  const options = [
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
  ];
  expect(getValueIndex([[1, 2], { a: 1, b: { c: 'x' } }], options, true)).toEqual(['0', '2']);
  expect(getValueIndex([{ a: 1, b: { c: 1 } }], options, true)).toEqual(['1']);
});

test('object.value mixed multiple', () => {
  const options = [
    'a',
    { value: [1, 2], l: 'a' },
    { value: { a: 1, b: { c: 1 } }, l: 'b' },
    undefined,
    { value: 3, l: '1' },
    { value: null, l: 'a' },
    { value: 'x', l: 'a' },
    { value: { a: 1, b: { c: 'x' } }, l: 'b' },
  ];
  expect(getValueIndex(['a', null], options, true)).toEqual(['0', '5']);
  expect(getValueIndex(['x', [1, 2]], options, true)).toEqual(['6', '1']);
  expect(getValueIndex([{ a: 1, b: { c: 1 } }], options, true)).toEqual(['2']);
  expect(getValueIndex([undefined, 3, 'a'], options, true)).toEqual(['3', '4', '0']);
  expect(getValueIndex([3], options, true)).toEqual(['4']);
  expect(getValueIndex([null, { a: 1, b: { c: 'x' } }], options, true)).toEqual(['5', '7']);
  expect(getValueIndex(['x', [1, 2], 'x'], options, true)).toEqual(['6', '1', '6']);
  expect(getValueIndex([{ a: 1, b: { c: 'x' } }], options, true)).toEqual(['7']);
});

test('object.value stable comparison,', () => {
  const options = [{ value: { a: 1, b: 1 } }, { value: { a: 2, b: 2 } }];
  expect(getValueIndex({ b: 1, a: 1 }, options)).toEqual('0');
  expect(getValueIndex([{ b: 1, a: 1 }], options, true)).toEqual(['0']);
});
