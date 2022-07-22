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

import runClass from './runClass.js';

const operator = '_op';
const functions = {
  singleArg: (a) => a * 2,
  namedArgs: (a, b) => a + b,
  spreadArgs: (...args) => args.reduce((acc, cur) => acc + cur, 0),
  nameAndSpread: (a, b, ...args) => args.reduce((acc, cur) => acc + (cur * a) / b, 0),
  noArgs: () => 11,
  noArgsError: () => {
    throw new Error('No Args function error.');
  },
  property: 42,
  typeCheck: () => true,
  combination: (a, b, ...args) => args.reduce((acc, cur) => acc - (cur * a) / b, 0),
  error: () => {
    throw new Error('Function error.');
  },
};

const meta = {
  singleArg: { singleArg: true },
  namedArgs: { namedArgs: ['x', 'y'] },
  spreadArgs: { spreadArgs: true },
  nameAndSpread: { namedArgs: ['x', 'y'], spreadArgs: 'z' },
  noArgs: { noArgs: true },
  noArgsError: { noArgs: true },
  property: { property: true },
  typeCheck: { validTypes: ['array', 'object'] },
  combination: { namedArgs: ['x', 'y'], spreadArgs: 'z', validTypes: ['array', 'object'] },
  error: {},
};

test('singleArg', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'singleArg',
      params: 2,
    })
  ).toEqual(4);
});

test('namedArgs', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'namedArgs',
      params: [1, 2],
    })
  ).toEqual(3);
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'namedArgs',
      params: { x: 1, y: 2 },
    })
  ).toEqual(3);
});

test('spreadArgs', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'spreadArgs',
      params: [1, 2, 3, 4],
    })
  ).toEqual(10);
});

test('nameAndSpread', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'nameAndSpread',
      params: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    })
  ).toEqual(21);
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'nameAndSpread',
      params: { x: 1, y: 2, z: [3, 4, 5, 6, 7, 8, 9] },
    })
  ).toEqual(21);
});

test('nameAndSpread - spread args must be an array', () => {
  expect(() =>
    runClass({
      functions,
      meta,
      operator,
      methodName: 'nameAndSpread',
      params: { x: 1, y: 2, z: 'x' },
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_op.nameAndSpread takes an array as input argument for z."`
  );
});

test('noArgs', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'noArgs',
      params: null,
    })
  ).toEqual(11);
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: null,
      params: 'noArgs',
    })
  ).toEqual(11);
});

test('noArgsError', () => {
  expect(() =>
    runClass({
      functions,
      meta,
      operator,
      methodName: 'noArgsError',
      params: null,
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_op: - No Args function error.."`);
});

test('property', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'property',
      params: null,
    })
  ).toEqual(42);
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: null,
      params: 'property',
    })
  ).toEqual(42);
});

test('error', () => {
  expect(() =>
    runClass({
      functions,
      meta,
      operator,
      methodName: 'error',
      params: [],
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_op.error - Function error."`);
});

test('typeCheck', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'typeCheck',
      params: [],
    })
  ).toEqual(true);
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'typeCheck',
      params: {},
    })
  ).toEqual(true);
  expect(() =>
    runClass({
      functions,
      meta,
      operator,
      methodName: 'typeCheck',
      params: 'x',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_op.typeCheck accepts one of the following types: array, object."`
  );
});

test('combination', () => {
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'combination',
      params: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    })
  ).toEqual(-21);
  expect(
    runClass({
      functions,
      meta,
      operator,
      methodName: 'combination',
      params: { x: 1, y: 2, z: [3, 4, 5, 6, 7, 8, 9] },
    })
  ).toEqual(-21);
  expect(() =>
    runClass({
      functions,
      meta,
      operator,
      methodName: 'combination',
      params: 'x',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_op.combination accepts one of the following types: array, object."`
  );
});

test('calling an undefined function', () => {
  expect(() =>
    runClass({
      functions,
      meta,
      operator,
      methodName: 'x',
      params: [],
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_op.x is not supported, use one of the following: singleArg, namedArgs, spreadArgs, nameAndSpread, noArgs, noArgsError, property, typeCheck, combination, error."`
  );
});
