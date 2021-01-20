/*
  Copyright 2020 Lowdefy, Inc

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

import array from '../../src/common/array';

const location = 'locationId';

describe('_array.concat', () => {
  const methodName = 'concat';
  test('valid', () => {
    expect(
      array({
        params: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        methodName,
        location,
      })
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect(
      array({
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
      array({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.concat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.concat\\":[1,2]} at locationId."
    `);
    expect(() =>
      array({
        params: { on: [] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.concat accepts one of the following types: array.
            Received: {\\"_array.concat\\":{\\"on\\":[]}} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.concat accepts one of the following types: array.
            Received: {\\"_array.concat\\":null} at locationId."
    `);
  });
});

describe('_array.copyWithin', () => {
  const methodName = 'copyWithin';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3], 0, 1],
        methodName,
        location,
      })
    ).toEqual([2, 3, 3]);
    expect(
      array({
        params: { on: ['a', 'b', 'c', 'd', 'e'], target: 0, start: 2, end: 3 },
        methodName,
        location,
      })
    ).toEqual(['c', 'b', 'c', 'd', 'e']);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { target: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.copyWithin must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.copyWithin\\":{\\"target\\":0}} at locationId."
    `);
    expect(() =>
      array({
        params: { on: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.copyWithin must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.copyWithin\\":{\\"on\\":1}} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.copyWithin accepts one of the following types: array, object.
            Received: {\\"_array.copyWithin\\":null} at locationId."
    `);
  });
});

describe('_array.fill', () => {
  const methodName = 'fill';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3, 4, 5], 0, 1, 3],
        methodName,
        location,
      })
    ).toEqual([1, 0, 0, 4, 5]);
    expect(
      array({
        params: { on: ['a', 'b', 'c', 'd'], value: 'x', start: 1, end: 3 },
        methodName,
        location,
      })
    ).toEqual(['a', 'x', 'x', 'd']);
    expect(
      array({
        params: [[1, 2, 3, 4], 6],
        methodName,
        location,
      })
    ).toEqual([6, 6, 6, 6]);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { value: 'x', start: 1, end: 2 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.fill must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.fill\\":{\\"value\\":\\"x\\",\\"start\\":1,\\"end\\":2}} at locationId."
    `);
    expect(() =>
      array({
        params: 'x',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.fill accepts one of the following types: array, object.
            Received: {\\"_array.fill\\":\\"x\\"} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.fill accepts one of the following types: array, object.
            Received: {\\"_array.fill\\":null} at locationId."
    `);
  });
});

describe('_array.flat', () => {
  const methodName = 'flat';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, [3], [[4]]]],
        methodName,
        location,
      })
    ).toEqual([1, 2, 3, [4]]);
    expect(
      array({
        params: { on: ['b', 'c', ['a'], [['c', ['v']]]], depth: 2 },
        methodName,
        location,
      })
    ).toEqual(['b', 'c', 'a', 'c', ['v']]);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { depth: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.flat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.flat\\":{\\"depth\\":1}} at locationId."
    `);
    expect(() =>
      array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.flat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.flat\\":[1,2,3]} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.flat accepts one of the following types: array, object.
            Received: {\\"_array.flat\\":null} at locationId."
    `);
  });
});

describe('_array.includes', () => {
  const methodName = 'includes';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3], 2],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      array({
        params: { on: ['b', 'c', 'a'], value: 'c' },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      array({
        params: { on: ['b', 'c', 'a'], value: 'e' },
        methodName,
        location,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { value: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.includes must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.includes\\":{\\"value\\":1}} at locationId."
    `);
    expect(() =>
      array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.includes must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.includes\\":[1,2,3]} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.includes accepts one of the following types: array, object.
            Received: {\\"_array.includes\\":null} at locationId."
    `);
  });
});

describe('_array.indexOf', () => {
  const methodName = 'indexOf';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3], 2],
        methodName,
        location,
      })
    ).toEqual(1);
    expect(
      array({
        params: { on: ['a', 'b', 'c'], value: 'c' },
        methodName,
        location,
      })
    ).toEqual(2);
    expect(
      array({
        params: { on: ['a', 'b', 'c'], value: 'e' },
        methodName,
        location,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { value: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.indexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.indexOf\\":{\\"value\\":1}} at locationId."
    `);
    expect(() =>
      array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.indexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.indexOf\\":[1,2,3]} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.indexOf accepts one of the following types: array, object.
            Received: {\\"_array.indexOf\\":null} at locationId."
    `);
  });
});

describe('_array.join', () => {
  const methodName = 'join';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3], '-'],
        methodName,
        location,
      })
    ).toEqual('1-2-3');
    expect(
      array({
        params: { on: ['a', 'b', 'c'], separator: '. ' },
        methodName,
        location,
      })
    ).toEqual('a. b. c');
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { separator: '.' },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.join must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.join\\":{\\"separator\\":\\".\\"}} at locationId."
    `);
    expect(() =>
      array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.join must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.join\\":[1,2,3]} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.join accepts one of the following types: array, object.
            Received: {\\"_array.join\\":null} at locationId."
    `);
  });
});

describe('_array.lastIndexOf', () => {
  const methodName = 'lastIndexOf';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3, 2], 2],
        methodName,
        location,
      })
    ).toEqual(3);
    expect(
      array({
        params: { on: ['c', 'a', 'c', 'b', 'c', 'x'], value: 'c' },
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      array({
        params: { on: ['a', 'b', 'c'], value: 'e' },
        methodName,
        location,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { value: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.lastIndexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.lastIndexOf\\":{\\"value\\":1}} at locationId."
    `);
    expect(() =>
      array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.lastIndexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.lastIndexOf\\":[1,2,3]} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.lastIndexOf accepts one of the following types: array, object.
            Received: {\\"_array.lastIndexOf\\":null} at locationId."
    `);
  });
});

describe('_array.reverse', () => {
  const methodName = 'reverse';
  test('valid', () => {
    expect(
      array({
        params: [1, 2, 3],
        methodName,
        location,
      })
    ).toEqual([3, 2, 1]);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { on: [1, 2, 3] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reverse accepts one of the following types: array.
            Received: {\\"_array.reverse\\":{\\"on\\":[1,2,3]}} at locationId."
    `);
    expect(() =>
      array({
        params: '[1, 2, 3]',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reverse accepts one of the following types: array.
            Received: {\\"_array.reverse\\":\\"[1, 2, 3]\\"} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.reverse accepts one of the following types: array.
            Received: {\\"_array.reverse\\":null} at locationId."
    `);
  });
});

describe('_array.slice', () => {
  const methodName = 'slice';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3, 4, 5], 1, 3],
        methodName,
        location,
      })
    ).toEqual([2, 3]);
    expect(
      array({
        params: { on: ['b', 'c', 'a'], start: 1 },
        methodName,
        location,
      })
    ).toEqual(['c', 'a']);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { start: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.slice must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.slice\\":{\\"start\\":1}} at locationId."
    `);
    expect(() =>
      array({
        params: 1,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.slice accepts one of the following types: array, object.
            Received: {\\"_array.slice\\":1} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.slice accepts one of the following types: array, object.
            Received: {\\"_array.slice\\":null} at locationId."
    `);
  });
});

describe('_array.splice', () => {
  const methodName = 'splice';
  test('valid', () => {
    expect(
      array({
        params: [['b', 'c', 'a'], 1, 0, 1, 2, 3],
        methodName,
        location,
      })
    ).toEqual(['b', 1, 2, 3, 'c', 'a']);
    expect(
      array({
        params: { on: ['b', 'c', 'a'], start: 1, end: 0, insert: [1, 2, 3] },
        methodName,
        location,
      })
    ).toEqual(['b', 1, 2, 3, 'c', 'a']);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { start: 1 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.splice takes an array as input argument for insert.
                Received: {\\"_array.splice\\":{\\"start\\":1}} at locationId."
    `);
    expect(() =>
      array({
        params: 1,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.splice accepts one of the following types: array, object.
            Received: {\\"_array.splice\\":1} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.splice accepts one of the following types: array, object.
            Received: {\\"_array.splice\\":null} at locationId."
    `);
  });
});

describe('_array.sort', () => {
  const methodName = 'sort';
  test('valid', () => {
    expect(
      array({
        params: [[4, 1, 2, 3]],
        methodName,
        location,
      })
    ).toEqual([1, 2, 3, 4]);
    expect(
      array({
        params: [['b', 'e', 'c', 'a']],
        methodName,
        location,
      })
    ).toEqual(['a', 'b', 'c', 'e']);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.sort must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array.
          Received: {\\"_array.sort\\":[1,2]} at locationId."
    `);
    expect(() =>
      array({
        params: { on: [] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.sort accepts one of the following types: array.
            Received: {\\"_array.sort\\":{\\"on\\":[]}} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.sort accepts one of the following types: array.
            Received: {\\"_array.sort\\":null} at locationId."
    `);
  });
});

describe('_array.length', () => {
  const methodName = 'length';
  test('valid', () => {
    expect(
      array({
        params: [[1, 2, 3], 2],
        methodName,
        location,
      })
    ).toEqual(2);
    expect(
      array({
        params: [1, 2, 3, 4],
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      array({
        params: [],
        methodName,
        location,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      array({
        params: { on: [1] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.length accepts one of the following types: array.
            Received: {\\"_array.length\\":{\\"on\\":[1]}} at locationId."
    `);
    expect(() =>
      array({
        params: '1',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.length accepts one of the following types: array.
            Received: {\\"_array.length\\":\\"1\\"} at locationId."
    `);
    expect(() =>
      array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _array.length accepts one of the following types: array.
            Received: {\\"_array.length\\":null} at locationId."
    `);
  });
});

test('_array called with no method or params', () => {
  expect(() => array({ location: 'locationId' })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _array.undefined is not supported, use one of the following: concat, copyWithin, fill, flat, includes, indexOf, join, lastIndexOf, reverse, slice, sort, splice, length.
          Received: {\\"_array.undefined\\":undefined} at locationId."
  `);
});

test('_array invalid method', () => {
  expect(() => array({ params: [['a']], methodName: 'X', location: 'locationId' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _array.X is not supported, use one of the following: concat, copyWithin, fill, flat, includes, indexOf, join, lastIndexOf, reverse, slice, sort, splice, length.
          Received: {\\"_array.X\\":[[\\"a\\"]]} at locationId."
  `);
});
