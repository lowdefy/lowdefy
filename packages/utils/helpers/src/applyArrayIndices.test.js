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

import applyArrayIndices from './applyArrayIndices.js';

test('no arrayIndices', () => {
  expect(applyArrayIndices(undefined, 'a')).toEqual('a');
});

test('no arrayIndices 1', () => {
  expect(applyArrayIndices([], 'ab')).toEqual('ab');
});

test('no arrayIndices 2', () => {
  expect(applyArrayIndices([], 'a.b')).toEqual('a.b');
});

test('arrayIndices with 1 index, primitive', () => {
  expect(applyArrayIndices([1], 'a.$')).toEqual('a.1');
});

test('arrayIndices with 1 index, object', () => {
  expect(applyArrayIndices([1], 'a.$.b')).toEqual('a.1.b');
});

test('arrayIndices with 1 index, no $', () => {
  expect(applyArrayIndices([1], 'a')).toEqual('a');
});

test('arrayIndices with 2 indices', () => {
  expect(applyArrayIndices([1, 2], 'a.$.$.b')).toEqual('a.1.2.b');
});

test('arrayIndices with 2 indices, no $', () => {
  expect(applyArrayIndices([1, 2], 'a')).toEqual('a');
});

test('arrayIndices with 2 indices, 1 $', () => {
  expect(applyArrayIndices([1, 2], 'a.$.b')).toEqual('a.1.b');
});

test('arrayIndices with 1 index, more than 1 $', () => {
  expect(applyArrayIndices([1], 'a.$.a.$.b')).toEqual('a.1.a.$.b');
});

test('name is a number', () => {
  expect(applyArrayIndices([], 1)).toEqual(1);
  expect(applyArrayIndices([], 3.14)).toEqual(3.14);
});

test('does not modify arrayIndices', () => {
  const arrayIndices = [1];
  expect(applyArrayIndices(arrayIndices, 'a.$')).toEqual('a.1');
  expect(arrayIndices).toEqual([1]);
});
