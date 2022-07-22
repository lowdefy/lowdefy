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

import diff from './diff.js';

test('_diff.deep on objects', () => {
  expect(diff({ params: [{ a: 1 }, { a: 2 }], methodName: 'deep' })).toEqual([
    { kind: 'E', lhs: 1, path: ['a'], rhs: 2 },
  ]);
  expect(diff({ params: { lhs: { a: 1 }, rhs: { a: 2 } }, methodName: 'deep' })).toEqual([
    { kind: 'E', lhs: 1, path: ['a'], rhs: 2 },
  ]);
});

test('_diff.deep on arrays', () => {
  expect(diff({ params: [[{ a: 1 }], [{ a: 2 }]], methodName: 'deep' })).toEqual([
    { kind: 'E', lhs: 1, path: [0, 'a'], rhs: 2 },
  ]);
  expect(diff({ params: { lhs: [{ a: 1 }], rhs: [{ a: 2 }] }, methodName: 'deep' })).toEqual([
    { kind: 'E', lhs: 1, path: [0, 'a'], rhs: 2 },
  ]);
});

test('_diff.deep on number', () => {
  expect(diff({ params: [1, 2], methodName: 'deep' })).toEqual([{ kind: 'E', lhs: 1, rhs: 2 }]);
});

test('_diff.deep on bool', () => {
  expect(diff({ params: [true, false], methodName: 'deep' })).toEqual([
    { kind: 'E', lhs: true, rhs: false },
  ]);
});

test('_diff.deep on string', () => {
  expect(diff({ params: ['abc', 'abd'], methodName: 'deep' })).toEqual([
    { kind: 'E', lhs: 'abc', rhs: 'abd' },
  ]);
});

test('_diff.deep no diff', () => {
  expect(diff({ params: [{ a: 1 }, { a: 1 }], methodName: 'deep' })).toEqual([]);
});

test('_diff.deep delete field', () => {
  expect(diff({ params: [{ a: 1, b: 2 }, { b: 2 }], methodName: 'deep' })).toEqual([
    { kind: 'D', lhs: 1, path: ['a'] },
  ]);
  expect(diff({ params: { lhs: { a: 1, b: 2 }, rhs: { b: 2 } }, methodName: 'deep' })).toEqual([
    { kind: 'D', lhs: 1, path: ['a'] },
  ]);
});

test('_diff.deep add field', () => {
  expect(diff({ params: [{ a: 1 }, { a: 1, b: 2 }], methodName: 'deep' })).toEqual([
    { kind: 'N', path: ['b'], rhs: 2 },
  ]);
  expect(diff({ params: { lhs: { a: 1 }, rhs: { a: 1, b: 2 } }, methodName: 'deep' })).toEqual([
    { kind: 'N', path: ['b'], rhs: 2 },
  ]);
});

test('_diff.deep delete and add fields', () => {
  expect(diff({ params: [{ a: 1 }, { b: 2 }], methodName: 'deep' })).toEqual([
    { kind: 'D', lhs: 1, path: ['a'] },
    { kind: 'N', path: ['b'], rhs: 2 },
  ]);
  expect(diff({ params: { lhs: { a: 1 }, rhs: { b: 2 } }, methodName: 'deep' })).toEqual([
    { kind: 'D', lhs: 1, path: ['a'] },
    { kind: 'N', path: ['b'], rhs: 2 },
  ]);
});

test('_diff.deep number', () => {
  expect(() => diff({ params: -1000, methodName: 'deep' })).toThrowErrorMatchingInlineSnapshot(
    `"_diff.deep accepts one of the following types: object, array."`
  );
});

test('_diff.deep null', () => {
  expect(() => diff({ params: null, methodName: 'deep' })).toThrowErrorMatchingInlineSnapshot(
    `"_diff.deep accepts one of the following types: object, array."`
  );
});

test('_diff.deep invalid string', () => {
  expect(() => diff({ params: 'abc', methodName: 'deep' })).toThrowErrorMatchingInlineSnapshot(
    `"_diff.deep accepts one of the following types: object, array."`
  );
});

test('_diff.x not supported', () => {
  expect(() => diff({ params: -1000, methodName: 'x' })).toThrowErrorMatchingInlineSnapshot(
    `"_diff.x is not supported, use one of the following: deep."`
  );
});

test('_diff number', () => {
  expect(() => diff({ params: -1000 })).toThrowErrorMatchingInlineSnapshot(
    `"_diff requires a valid method name, use one of the following: deep."`
  );
});

test('_diff null', () => {
  expect(() => diff({ params: null })).toThrowErrorMatchingInlineSnapshot(
    `"_diff requires a valid method name, use one of the following: deep."`
  );
});

test('_diff invalid operator type', () => {
  expect(() => diff({ params: {} })).toThrowErrorMatchingInlineSnapshot(
    `"_diff requires a valid method name, use one of the following: deep."`
  );
});

test('_diff invalid string', () => {
  expect(() => diff({ params: 'abc' })).toThrowErrorMatchingInlineSnapshot(
    `"_diff requires a valid method name, use one of the following: deep."`
  );
});
