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

import { NodeParser } from '@lowdefy/operators';

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

const operatorPrefix = '_';

const parser = new NodeParser({ operators, payload: {}, secrets: {}, user: {} });

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
      })
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect(
      _array({
        params: [null, null, null],
        methodName,
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
      })
    ).toEqual(['b', 'c', 'a', 1, 2, 3, 'x', 'y', ['z', 'z']]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.concat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [] },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.concat accepts one of the following types: array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.concat accepts one of the following types: array."`
    );
  });
});

describe('_array.copyWithin', () => {
  const methodName = 'copyWithin';
  test('valid', () => {
    expect(
      _array({
        params: [[1, 2, 3], 0, 1],
        methodName,
      })
    ).toEqual([2, 3, 3]);
    expect(
      _array({
        params: { on: ['a', 'b', 'c', 'd', 'e'], target: 0, start: 2, end: 3 },
        methodName,
      })
    ).toEqual(['c', 'b', 'c', 'd', 'e']);
    expect(
      _array({
        params: { target: 0 },
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [null, 0, 1],
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.copyWithin must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.copyWithin accepts one of the following types: array, object."`
    );
  });
});

describe('_array.every', () => {
  const methodName = 'every';
  const callback = _function({
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: [4, 5, 6],
          callback,
        },
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
      })
    ).toEqual(false);
    expect(
      _array({
        params: [[4, 5, 6], callback],
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: null,
          callback,
        },
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual(true);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.every must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.every - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.every accepts one of the following types: array, object."`
    );
  });
});

describe('_array.fill', () => {
  const methodName = 'fill';
  test('valid', () => {
    expect(
      _array({
        params: [[1, 2, 3, 4, 5], 0, 1, 3],
        methodName,
      })
    ).toEqual([1, 0, 0, 4, 5]);
    expect(
      _array({
        params: { on: ['a', 'b', 'c', 'd'], value: 'x', start: 1, end: 3 },
        methodName,
      })
    ).toEqual(['a', 'x', 'x', 'd']);
    expect(
      _array({
        params: [[1, 2, 3, 4], 6],
        methodName,
      })
    ).toEqual([6, 6, 6, 6]);
    expect(
      _array({
        params: { value: 'x', start: 1, end: 2 },
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [null, 6],
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.fill accepts one of the following types: array, object."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.fill accepts one of the following types: array, object."`
    );
  });
});

describe('_array.filter', () => {
  const methodName = 'filter';
  const callback = _function({
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
      })
    ).toEqual([5, 6]);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
      })
    ).toEqual([5, 6]);
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.filter must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.filter - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.filter accepts one of the following types: array, object."`
    );
  });
});

describe('_array.find', () => {
  const methodName = 'find';
  const callback = _function({
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual(undefined);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
      })
    ).toEqual(5);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
      })
    ).toEqual(5);
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual(undefined);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.find must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.find - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.find accepts one of the following types: array, object."`
    );
  });
});

describe('_array.findIndex', () => {
  const methodName = 'findIndex';
  const callback = _function({
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
      })
    ).toEqual(1);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
      })
    ).toEqual(1);
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.findIndex must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.findIndex - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.findIndex accepts one of the following types: array, object."`
    );
  });
});

describe('_array.flat', () => {
  const methodName = 'flat';
  test('valid', () => {
    expect(
      _array({
        params: [null],
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [[1, 2, [3], [[4]]]],
        methodName,
      })
    ).toEqual([1, 2, 3, [4]]);
    expect(
      _array({
        params: { on: ['b', 'c', ['a'], [['c', ['v']]]], depth: 2 },
        methodName,
      })
    ).toEqual(['b', 'c', 'a', 'c', ['v']]);
    expect(
      _array({
        params: { depth: 1 },
        methodName,
      })
    ).toEqual([]);
  });
  expect(
    _array({
      params: { on: null },
      methodName,
    })
  ).toEqual([]);
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.flat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.flat accepts one of the following types: array, object."`
    );
  });
});

describe('_array.includes', () => {
  const methodName = 'includes';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1],
        methodName,
      })
    ).toEqual(false);
    expect(
      _array({
        params: [[1, 2, 3], 2],
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], value: 'c' },
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], value: 'e' },
        methodName,
      })
    ).toEqual(false);
    expect(
      _array({
        params: { value: 1 },
        methodName,
      })
    ).toEqual(false);
    expect(
      _array({
        params: [null, 2],
        methodName,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.includes must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.includes accepts one of the following types: array, object."`
    );
  });
});

describe('_array.indexOf', () => {
  const methodName = 'indexOf';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1],
        methodName,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: [[1, 2, 3], 2],
        methodName,
      })
    ).toEqual(1);
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], value: 'c' },
        methodName,
      })
    ).toEqual(2);
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], value: 'e' },
        methodName,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: { value: 1 },
        methodName,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: { on: null, value: 'c' },
        methodName,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.indexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.indexOf accepts one of the following types: array, object."`
    );
  });
});

describe('_array.join', () => {
  const methodName = 'join';
  test('valid', () => {
    expect(
      _array({
        params: [null, '-'],
        methodName,
      })
    ).toEqual('');
    expect(
      _array({
        params: [[1, 2, 3], '-'],
        methodName,
      })
    ).toEqual('1-2-3');
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], separator: '. ' },
        methodName,
      })
    ).toEqual('a. b. c');
    expect(
      _array({
        params: { separator: '.' },
        methodName,
      })
    ).toEqual('');
    expect(
      _array({
        params: [null, '-'],
        methodName,
      })
    ).toEqual('');
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.join must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.join accepts one of the following types: array, object."`
    );
  });
});

describe('_array.lastIndexOf', () => {
  const methodName = 'lastIndexOf';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1],
        methodName,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: [[1, 2, 3, 2], 2],
        methodName,
      })
    ).toEqual(3);
    expect(
      _array({
        params: { on: ['c', 'a', 'c', 'b', 'c', 'x'], value: 'c' },
        methodName,
      })
    ).toEqual(4);
    expect(
      _array({
        params: { on: ['a', 'b', 'c'], value: 'e' },
        methodName,
      })
    ).toEqual(-1);
    expect(
      _array({
        params: { value: 1 },
        methodName,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2, 3],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.lastIndexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.lastIndexOf accepts one of the following types: array, object."`
    );
  });
});

describe('_array.map', () => {
  const methodName = 'map';
  const callback = _function({
    operatorPrefix,
    params: { __sum: [{ __args: '0' }, 1] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
      })
    ).toEqual([2, 6, 7]);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
      })
    ).toEqual([2, 6, 7]);
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: { on: null, callback },
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.map must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.map - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.map accepts one of the following types: array, object."`
    );
  });
});

describe('_array.reduce', () => {
  const methodName = 'reduce';
  const callback = _function({
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
      })
    ).toEqual(20);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
      })
    ).toEqual(12);
    expect(
      _array({
        params: [null, callback, 0],
        methodName,
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
      })
    ).toEqual(8);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [null, callback],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduce - Reduce of empty array with no initial value"`
    );
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduce must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.reduce - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduce accepts one of the following types: array, object."`
    );
  });
});

describe('_array.reduceRight', () => {
  const methodName = 'reduceRight';
  const callback = _function({
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
      })
    ).toEqual(20);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
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
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      expect(
        _array({
          params: [null, callback],
          methodName,
        })
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduceRight - Reduce of empty array with no initial value"`
    );
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduceRight must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.reduceRight - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduceRight accepts one of the following types: array, object."`
    );
  });
});

describe('_array.reverse', () => {
  const methodName = 'reverse';
  test('valid', () => {
    expect(
      _array({
        params: [1, 2, 3],
        methodName,
      })
    ).toEqual([3, 2, 1]);
    expect(
      _array({
        params: null,
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: [1, 2, 3] },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reverse accepts one of the following types: array, null."`
    );
    expect(() =>
      _array({
        params: '[1, 2, 3]',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reverse accepts one of the following types: array, null."`
    );
  });
});

describe('_array.slice', () => {
  const methodName = 'slice';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1, 2],
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [[1, 2, 3, 4, 5], 1, 3],
        methodName,
      })
    ).toEqual([2, 3]);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], start: 1 },
        methodName,
      })
    ).toEqual(['c', 'a']);
    expect(
      _array({
        params: { start: 1 },
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [null, 1, 3],
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: 1,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.slice accepts one of the following types: array, object."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.slice accepts one of the following types: array, object."`
    );
  });
});

describe('_array.splice', () => {
  const methodName = 'splice';
  test('valid', () => {
    expect(
      _array({
        params: [null, 1, 0],
        methodName,
      })
    ).toEqual([]);
    expect(
      _array({
        params: [['b', 'c', 'a'], 1, 0, 1, 2, 3],
        methodName,
      })
    ).toEqual(['b', 1, 2, 3, 'c', 'a']);
    expect(
      _array({
        params: { on: ['b', 'c', 'a'], start: 1, end: 0, insert: [1, 2, 3] },
        methodName,
      })
    ).toEqual(['b', 1, 2, 3, 'c', 'a']);
    expect(
      _array({
        params: [null, 1, 0, 1, 2, 3],
        methodName,
      })
    ).toEqual([1, 2, 3]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { start: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.splice takes an array as input argument for insert."`
    );
    expect(() =>
      _array({
        params: 1,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.splice accepts one of the following types: array, object."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.splice accepts one of the following types: array, object."`
    );
  });
});

describe('_array.some', () => {
  const methodName = 'some';
  const callback = _function({
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('valid', () => {
    expect(
      _array({
        params: [null, callback],
        methodName,
      })
    ).toEqual(false);
    expect(
      _array({
        params: {
          on: [1, 2, 2],
          callback,
        },
        methodName,
      })
    ).toEqual(false);
    expect(
      _array({
        params: {
          on: [1, 5, 6],
          callback,
        },
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: [[1, 5, 6], callback],
        methodName,
      })
    ).toEqual(true);
    expect(
      _array({
        params: {
          on: null,
          callback,
        },
        methodName,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.some must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(`"_array.some - 1 is not a function"`);
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.some accepts one of the following types: array, object."`
    );
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
      })
    ).toEqual([]);
    expect(
      _array({
        params: [[4, 1, 2, 3]],
        methodName,
      })
    ).toEqual([1, 2, 3, 4]);
    expect(
      _array({
        params: [['b', 'e', 'c', 'a']],
        methodName,
      })
    ).toEqual(['a', 'b', 'c', 'e']);
    expect(
      _array({
        params: [['b', 'e', 'c', 'a']],
        methodName,
      })
    ).toEqual(['a', 'b', 'c', 'e']);
    expect(
      _array({
        params: [null],
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.sort must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide and array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [] },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.sort accepts one of the following types: array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.sort accepts one of the following types: array."`
    );
  });
});

describe('_array.length', () => {
  const methodName = 'length';
  test('valid', () => {
    expect(
      _array({
        params: null,
        methodName,
      })
    ).toEqual(0);
    expect(
      _array({
        params: [[1, 2, 3], 2],
        methodName,
      })
    ).toEqual(2);
    expect(
      _array({
        params: [1, 2, 3, 4],
        methodName,
      })
    ).toEqual(4);
    expect(
      _array({
        params: [],
        methodName,
      })
    ).toEqual(0);
    expect(
      _array({
        params: null,
        methodName,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      _array({
        params: { on: [1] },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.length accepts one of the following types: array, null."`
    );
    expect(() =>
      _array({
        params: '1',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.length accepts one of the following types: array, null."`
    );
  });
});

test('_array called with no method or params', () => {
  expect(() => _array({})).toThrowErrorMatchingInlineSnapshot(
    `"_array.undefined is not supported, use one of the following: concat, copyWithin, every, fill, filter, find, findIndex, flat, includes, indexOf, join, lastIndexOf, map, reduce, reduceRight, reverse, slice, some, sort, splice, length."`
  );
});

test('_array invalid method', () => {
  expect(() => _array({ params: [['a']], methodName: 'X' })).toThrowErrorMatchingInlineSnapshot(
    `"_array.X is not supported, use one of the following: concat, copyWithin, every, fill, filter, find, findIndex, flat, includes, indexOf, join, lastIndexOf, map, reduce, reduceRight, reverse, slice, some, sort, splice, length."`
  );
});
