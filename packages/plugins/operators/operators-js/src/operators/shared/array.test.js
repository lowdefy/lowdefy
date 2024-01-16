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

import { ServerParser } from '@lowdefy/operators';

import _args from './args.js';
import _array from './array.js';
import _function from './function.js';
import _gt from './gt.js';
import _sum from './sum.js';

const operators = {
  _args,
  _array,
  _function,
  _gt,
  _sum,
};

const location = 'location';

const operatorPrefix = '_';

const parser = new ServerParser({ operators, payload: {}, secrets: {}, user: {} });

describe('_array.concat', () => {
  const methodName = 'concat';
  test('valid', () => {
    expect(
      _array({
        params: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        methodName,
        location,
      })
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect(
      _array({
        params: [null, null, null],
        methodName,
        location,
      })
    ).toEqual([null, null]);
    expect(
      _array({
        params: [
          ['b', 'c', 'a'],
          [1, 2, 3],
          ['x', 'y', ['z', 'z']],
        ],
        methodName,
        location,
      })
    ).toEqual(['b', 'c', 'a', 1, 2, 3, 'x', 'y', ['z', 'z']]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.concat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.concat\\":[1,2]} at location."
    `);
    expect(() =>
      _array({
        params: { on: [] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.concat accepts one of the following types: array.
            Received: {\\"_array.concat\\":{\\"on\\":[]}} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.concat accepts one of the following types: array.
            Received: {\\"_array.concat\\":null} at location."
    `);
  });
});

describe('_array.copyWithin', () => {
  const methodName = 'copyWithin';
  test('valid', () => {
    expect(
      _array({
        params: [[1, 2, 3], 0, 1],
        methodName,
        location,
      })
    ).toEqual([2, 3, 3]);
    expect(
      _array({
        params: { on: ['a', 'b', 'c', 'd', 'e'], target: 0, start: 2, end: 3 },
        methodName,
        location,
      })
    ).toEqual(['c', 'b', 'c', 'd', 'e']);
    expect(
      _array({
        params: { target: 0 },
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [null, 0, 1],
        methodName,
        location,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.copyWithin must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.copyWithin\\":{\\"on\\":1}} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.copyWithin accepts one of the following types: array, object.
            Received: {\\"_array.copyWithin\\":null} at location."
    `);
  });
});

describe('_array.every', () => {
  const methodName = 'every';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: [4, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      _array({
        params: [[4, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: null,
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual(true);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.every must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.every\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.every - 1 is not a function Received: {\\"_array.every\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.every accepts one of the following types: array, object.
            Received: {\\"_array.every\\":null} at location."
    `);
  });
});

describe('_array.fill', () => {
  const methodName = 'fill';
  test('valid', () => {
    expect(
      _array({
        params: [[1, 2, 3, 4, 5], 0, 1, 3],
        methodName,
        location,
      })
    ).toEqual([1, 0, 0, 4, 5]);
    expect(
      _array({
        params: { on: ['a', 'b', 'c', 'd'], value: 'x', start: 1, end: 3 },
        methodName,
        location,
      })
    ).toEqual(['a', 'x', 'x', 'd']);
    expect(
      _array({
        params: [[1, 2, 3, 4], 6],
        methodName,
        location,
      })
    ).toEqual([6, 6, 6, 6]);
    expect(
      _array({
        params: { value: 'x', start: 1, end: 2 },
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [null, 6],
        methodName,
        location,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: 'x',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.fill accepts one of the following types: array, object.
            Received: {\\"_array.fill\\":\\"x\\"} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.fill accepts one of the following types: array, object.
            Received: {\\"_array.fill\\":null} at location."
    `);
  });
});

describe('_array.filter', () => {
  const methodName = 'filter';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual([5, 6]);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual([5, 6]);
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.filter must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.filter\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.filter - 1 is not a function Received: {\\"_array.filter\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.filter accepts one of the following types: array, object.
            Received: {\\"_array.filter\\":null} at location."
    `);
  });
});

describe('_array.find', () => {
  const methodName = 'find';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual(undefined);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(5);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual(5);
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual(undefined);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.find must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.find\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.find - 1 is not a function Received: {\\"_array.find\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.find accepts one of the following types: array, object.
            Received: {\\"_array.find\\":null} at location."
    `);
  });
});

describe('_array.findIndex', () => {
  const methodName = 'findIndex';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(1);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual(1);
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.findIndex must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.findIndex\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.findIndex - 1 is not a function Received: {\\"_array.findIndex\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.findIndex accepts one of the following types: array, object.
            Received: {\\"_array.findIndex\\":null} at location."
    `);
  });
});

describe('_array.flat', () => {
  const methodName = 'flat';
  test('valid', () => {
    expect(
      _array({
        params: [null],
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [[1, 2, [3], [[4]]]],
        methodName,
        location,
      })
    ).toEqual([1, 2, 3, [4]]);
    expect(
      _array({
        params: { on: ['b', 'c', ['a'], [['c', ['v']]]], depth: 2 },
        methodName,
        location,
      })
    ).toEqual(['b', 'c', 'a', 'c', ['v']]);
    expect(
      _array({
        params: { depth: 1 },
        methodName,
        location,
      })
    ).toEqual([]);
  });
  expect(
    _array({
      params: { on: null },
      methodName,
      location,
    })
  ).toEqual([]);
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.flat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.flat\\":[1,2,3]} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.flat accepts one of the following types: array, object.
            Received: {\\"_array.flat\\":null} at location."
    `);
  });
});

describe('_array.includes', () => {
  const methodName = 'includes';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1],
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      _array({
        params: [[1, 2, 3], 2],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], value: 'c' },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], value: 'e' },
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      _array({
        params: { value: 1 },
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      _array({
        params: [null, 2],
        methodName,
        location,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.includes must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.includes\\":[1,2,3]} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.includes accepts one of the following types: array, object.
            Received: {\\"_array.includes\\":null} at location."
    `);
  });
});

describe('_array.indexOf', () => {
  const methodName = 'indexOf';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1],
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: [[1, 2, 3], 2],
        methodName,
        location,
      })
    ).toEqual(1);
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], value: 'c' },
        methodName,
        location,
      })
    ).toEqual(2);
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], value: 'e' },
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: { value: 1 },
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: { on: null, value: 'c' },
        methodName,
        location,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.indexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.indexOf\\":[1,2,3]} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.indexOf accepts one of the following types: array, object.
            Received: {\\"_array.indexOf\\":null} at location."
    `);
  });
});

describe('_array.join', () => {
  const methodName = 'join';
  test('valid', () => {
    expect(
      _array({
        params: [null, '-'],
        methodName,
        location,
      })
    ).toEqual('');
    expect(
      _array({
        params: [[1, 2, 3], '-'],
        methodName,
        location,
      })
    ).toEqual('1-2-3');
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], separator: '. ' },
        methodName,
        location,
      })
    ).toEqual('a. b. c');
    expect(
      _array({
        params: { separator: '.' },
        methodName,
        location,
      })
    ).toEqual('');
    expect(
      _array({
        params: [null, '-'],
        methodName,
        location,
      })
    ).toEqual('');
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.join must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.join\\":[1,2,3]} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.join accepts one of the following types: array, object.
            Received: {\\"_array.join\\":null} at location."
    `);
  });
});

describe('_array.lastIndexOf', () => {
  const methodName = 'lastIndexOf';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1],
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: [[1, 2, 3, 2], 2],
        methodName,
        location,
      })
    ).toEqual(3);
    expect(
      _array({
        params: { on: ['c', 'a', 'c', 'b', 'c', 'x'], value: 'c' },
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], value: 'e' },
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: { value: 1 },
        methodName,
        location,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.lastIndexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.lastIndexOf\\":[1,2,3]} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.lastIndexOf accepts one of the following types: array, object.
            Received: {\\"_array.lastIndexOf\\":null} at location."
    `);
  });
});

describe('_array.map', () => {
  const methodName = 'map';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __sum: [{ __args: '0' }, 1] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual([2, 6, 7]);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual([2, 6, 7]);
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: { on: null, callback },
        methodName,
        location,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.map must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.map\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.map - 1 is not a function Received: {\\"_array.map\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.map accepts one of the following types: array, object.
            Received: {\\"_array.map\\":null} at location."
    `);
  });
});

describe('_array.reduce', () => {
  const methodName = 'reduce';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __sum: [{ __args: '0' }, { __args: '1' }] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(12);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
          initialValue: 8,
        },
        methodName,
        location,
      })
    ).toEqual(20);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual(12);
    expect(
      _array({
        params: [null, callback, 0],
        methodName,
        location,
      })
    ).toEqual(0);
    expect(
      _array({
        params: {
          on: null,
          callback,
          initialValue: 8,
        },
        methodName,
        location,
      })
    ).toEqual(8);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.reduce - Reduce of empty array with no initial value Received: {\\"_array.reduce\\":[null,null]} at location."`
    );
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reduce must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.reduce\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.reduce - 1 is not a function Received: {\\"_array.reduce\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reduce accepts one of the following types: array, object.
            Received: {\\"_array.reduce\\":null} at location."
    `);
  });
});

describe('_array.reduceRight', () => {
  const methodName = 'reduceRight';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __sum: [{ __args: '0' }, { __args: '1' }] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(12);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
          initialValue: 8,
        },
        methodName,
        location,
      })
    ).toEqual(20);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual(12);
    expect(
      _array({
        params: {
          on: null,
          callback,
          initialValue: 0,
        },
        methodName,
        location,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      expect(
        _array({
          params: [null, callback],
          methodName,
          location,
        })
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.reduceRight - Reduce of empty array with no initial value Received: {\\"_array.reduceRight\\":[null,null]} at location."`
    );
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reduceRight must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.reduceRight\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.reduceRight - 1 is not a function Received: {\\"_array.reduceRight\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reduceRight accepts one of the following types: array, object.
            Received: {\\"_array.reduceRight\\":null} at location."
    `);
  });
});

describe('_array.reverse', () => {
  const methodName = 'reverse';
  test('valid', () => {
    expect(
      _array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toEqual([3, 2, 1]);
    expect(
      _array({
        params: null,
        methodName,
        location,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: [1, 2, 3] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reverse accepts one of the following types: array, null.
            Received: {\\"_array.reverse\\":{\\"on\\":[1,2,3]}} at location."
    `);
    expect(() =>
      _array({
        params: '[1, 2, 3]',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reverse accepts one of the following types: array, null.
            Received: {\\"_array.reverse\\":\\"[1, 2, 3]\\"} at location."
    `);
  });
});

describe('_array.slice', () => {
  const methodName = 'slice';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1, 2],
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [[1, 2, 3, 4, 5], 1, 3],
        methodName,
        location,
      })
    ).toEqual([2, 3]);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], start: 1 },
        methodName,
        location,
      })
    ).toEqual(['c', 'a']);
    expect(
      _array({
        params: { start: 1 },
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [null, 1, 3],
        methodName,
        location,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: 1,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.slice accepts one of the following types: array, object.
            Received: {\\"_array.slice\\":1} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.slice accepts one of the following types: array, object.
            Received: {\\"_array.slice\\":null} at location."
    `);
  });
});

describe('_array.splice', () => {
  const methodName = 'splice';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1, 0],
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [['b', 'c', 'a'], 1, 0, 1, 2, 3],
        methodName,
        location,
      })
    ).toEqual(['b', 1, 2, 3, 'c', 'a']);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], start: 1, end: 0, insert: [1, 2, 3] },
        methodName,
        location,
      })
    ).toEqual(['b', 1, 2, 3, 'c', 'a']);
    expect(
      _array({
        params: [null, 1, 0, 1, 2, 3],
        methodName,
        location,
      })
    ).toEqual([1, 2, 3]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { start: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.splice takes an array as input argument for insert.
                Received: {\\"_array.splice\\":{\\"start\\":1}} at location."
    `);
    expect(() =>
      _array({
        params: 1,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.splice accepts one of the following types: array, object.
            Received: {\\"_array.splice\\":1} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.splice accepts one of the following types: array, object.
            Received: {\\"_array.splice\\":null} at location."
    `);
  });
});

describe('_array.some', () => {
  const methodName = 'some';
  const callback = _function({
    location,
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      _array({
        params: {
          on: [1, 2, 2],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: null,
          callback,
        },
        methodName,
        location,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.some must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.some\\":{\\"on\\":0}} at location."
    `);
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _array.some - 1 is not a function Received: {\\"_array.some\\":{\\"on\\":[],\\"callback\\":1}} at location."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.some accepts one of the following types: array, object.
            Received: {\\"_array.some\\":null} at location."
    `);
  });
});

// TODO: Is this correct? Should it not be singleArg? Reverse is singleArg
describe('_array.sort', () => {
  const methodName = 'sort';
  test('valid', () => {
    expect(
      _array({
        params: [null],
        methodName,
        location,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [[4, 1, 2, 3]],
        methodName,
        location,
      })
    ).toEqual([1, 2, 3, 4]);
    expect(
      _array({
        params: [['b', 'e', 'c', 'a']],
        methodName,
        location,
      })
    ).toEqual(['a', 'b', 'c', 'e']);
    expect(
      _array({
        params: [['b', 'e', 'c', 'a']],
        methodName,
        location,
      })
    ).toEqual(['a', 'b', 'c', 'e']);
    expect(
      _array({
        params: [null],
        methodName,
        location,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.sort must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.sort\\":[1,2]} at location."
    `);
    expect(() =>
      _array({
        params: { on: [] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.sort accepts one of the following types: array.
            Received: {\\"_array.sort\\":{\\"on\\":[]}} at location."
    `);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.sort accepts one of the following types: array.
            Received: {\\"_array.sort\\":null} at location."
    `);
  });
});

describe('_array.length', () => {
  const methodName = 'length';
  test('valid', () => {
    expect(
      _array({
        params: null,
        methodName,
        location,
      })
    ).toEqual(0);
    expect(
      _array({
        params: [[1, 2, 3], 2],
        methodName,
        location,
      })
    ).toEqual(2);
    expect(
      _array({
        params: [1, 2, 3, 4],
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      _array({
        params: [],
        methodName,
        location,
      })
    ).toEqual(0);
    expect(
      _array({
        params: null,
        methodName,
        location,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: [1] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.length accepts one of the following types: array, null.
            Received: {\\"_array.length\\":{\\"on\\":[1]}} at location."
    `);
    expect(() =>
      _array({
        params: '1',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.length accepts one of the following types: array, null.
            Received: {\\"_array.length\\":\\"1\\"} at location."
    `);
  });
});

test('_array called with no method or params', () => {
  expect(() => _array({ location: 'location' })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _array.undefined is not supported, use one of the following: concat, copyWithin, every, fill, filter, find, findIndex, flat, includes, indexOf, join, lastIndexOf, map, reduce, reduceRight, reverse, slice, some, sort, splice, length.
          Received: {\\"_array.undefined\\":undefined} at location."
  `);
});

test('_array invalid method', () => {
  expect(() => _array({ params: [['a']], methodName: 'X', location: 'location' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _array.X is not supported, use one of the following: concat, copyWithin, every, fill, filter, find, findIndex, flat, includes, indexOf, join, lastIndexOf, map, reduce, reduceRight, reverse, slice, some, sort, splice, length.
          Received: {\\"_array.X\\":[[\\"a\\"]]} at location."
  `);
});
