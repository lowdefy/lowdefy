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

import runInstance from './runInstance.js';

const location = 'locationId';
const operator = '_op';
const functions = {
  singleArg: () => 30,
  namedArgs: (a, b) => a + b,
  spreadArgs: (...args) => args.reduce((acc, cur) => acc + cur, 0),
  nameAndSpread: (a, b, ...args) => args.reduce((acc, cur) => acc + (cur * a) / b, 0),
  property: 42,
  typeCheck: () => true,
  combination: (a, b, ...args) => args.reduce((acc, cur) => acc - (cur * a) / b, 0),
  error: () => {
    throw new Error('Function error.');
  },
  returnInstance: () => 1,
};

const meta = {
  singleArg: { singleArg: true },
  namedArgs: { namedArgs: ['on', 'x', 'y'] },
  spreadArgs: { spreadArgs: true },
  nameAndSpread: { namedArgs: ['on', 'x', 'y'], spreadArgs: 'z' },
  property: { property: true },
  typeCheck: { namedArgs: ['on'], validTypes: ['array', 'object'] },
  combination: { namedArgs: ['on', 'x', 'y'], spreadArgs: 'z', validTypes: ['array', 'object'] },
  error: {},
  noFunction: { spreadArgs: true },
  returnInstance: { returnInstance: true },
};

test('singleArg', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'singleArg',
      params: functions,
      instanceType: 'object',
    })
  ).toEqual(30);
});

test('namedArgs', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'namedArgs',
      params: [functions, 1, 2],
      instanceType: 'object',
    })
  ).toEqual(3);
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'namedArgs',
      params: { on: functions, x: 1, y: 2 },
      instanceType: 'object',
    })
  ).toEqual(3);
});

test('spreadArgs', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'spreadArgs',
      params: [functions, 1, 2, 3, 4],
      instanceType: 'object',
    })
  ).toEqual(10);
});

test('nameAndSpread', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'nameAndSpread',
      params: [functions, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      instanceType: 'object',
    })
  ).toEqual(21);
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'nameAndSpread',
      params: { on: functions, x: 1, y: 2, z: [3, 4, 5, 6, 7, 8, 9] },
      instanceType: 'object',
    })
  ).toEqual(21);
});

test('nameAndSpread - spread args must be an array', () => {
  expect(() =>
    runInstance({
      location,
      meta,
      operator,
      methodName: 'nameAndSpread',
      params: { on: functions, x: 1, y: 2, z: 'x' },
      instanceType: 'object',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _op.nameAndSpread takes an array as input argument for z.
              Received: {\\"_op.nameAndSpread\\":{\\"on\\":{\\"property\\":42},\\"x\\":1,\\"y\\":2,\\"z\\":\\"x\\"}} at locationId."
  `);
});

test('property', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'property',
      params: functions,
      instanceType: 'object',
    })
  ).toEqual(42);
});

test('returnInstance', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'returnInstance',
      params: [functions],
      instanceType: 'object',
    })
  ).toEqual(functions);
});

test('error', () => {
  expect(() =>
    runInstance({
      location,
      meta,
      operator,
      methodName: 'error',
      params: [functions],
      instanceType: 'object',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _op.error - Function error. Received: {\\"_op.error\\":[{\\"property\\":42}]} at locationId."`
  );
});

test('typeCheck', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'typeCheck',
      params: [functions],
      instanceType: 'object',
    })
  ).toEqual(true);
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'typeCheck',
      params: { on: functions },
      instanceType: 'object',
    })
  ).toEqual(true);
  expect(() =>
    runInstance({
      location,
      meta,
      operator,
      methodName: 'typeCheck',
      params: ['x'],
      instanceType: 'object',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _op.typeCheck must be evaluated on an object instance. For named args provide an object instance to the \\"on\\" property, for listed args provide and object instance as the first element in the operator argument array.
        Received: {\\"_op.typeCheck\\":[\\"x\\"]} at locationId."
  `);
});

test('combination', () => {
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'combination',
      params: [functions, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      instanceType: 'object',
    })
  ).toEqual(-21);
  expect(
    runInstance({
      location,
      meta,
      operator,
      methodName: 'combination',
      params: { on: functions, x: 1, y: 2, z: [3, 4, 5, 6, 7, 8, 9] },
      instanceType: 'object',
    })
  ).toEqual(-21);
  expect(() =>
    runInstance({
      location,
      meta,
      operator,
      methodName: 'combination',
      params: 'x',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _op.combination accepts one of the following types: array, object.
          Received: {\\"_op.combination\\":\\"x\\"} at locationId."
  `);
});

test('calling an undefined function', () => {
  expect(() =>
    runInstance({
      location,
      meta,
      operator,
      methodName: 'x',
      params: [],
      instanceType: 'object',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _op.x is not supported, use one of the following: singleArg, namedArgs, spreadArgs, nameAndSpread, property, typeCheck, combination, error, noFunction, returnInstance.
          Received: {\\"_op.x\\":[]} at locationId."
  `);
});

test('calling an undefined instance function', () => {
  expect(() =>
    runInstance({
      location,
      meta,
      operator,
      methodName: 'noFunction',
      params: [{}],
      instanceType: 'object',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _op must be evaluated using one of the following: singleArg, namedArgs, spreadArgs, nameAndSpread, property, typeCheck, combination, error, noFunction, returnInstance.
          Received: {\\"_op.noFunction\\":[{}]} at locationId."
  `);
});
