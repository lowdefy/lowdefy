/*
  Copyright 2020-2026 Lowdefy, Inc

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

const serverParser = new ServerParser({ operators, secrets: {}, user: {} });

// Operators receive a parser bound to the calling frame; mirror that for the callbacks built here.
const parser = {
  parse: (callOptions) => serverParser.parse({ location, ...callOptions }),
};

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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.concat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.concat accepts one of the following types: array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.copyWithin must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.copyWithin accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.every must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.fill accepts one of the following types: array, object."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.fill accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.filter must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.filter accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.find must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.find accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.findIndex must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.flat must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.includes must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.indexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.join must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.lastIndexOf must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.lastIndexOf accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.map must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.map accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(`"Reduce of empty array with no initial value"`);
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduce must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduce accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(`"Reduce of empty array with no initial value"`);
    expect(() =>
      _array({
        params: { on: 0 },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reduceRight must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.reverse accepts one of the following types: array, null."`
    );
    expect(() =>
      _array({
        params: '[1, 2, 3]',
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.slice accepts one of the following types: array, object."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.splice takes an array as input argument for insert."`
    );
    expect(() =>
      _array({
        params: 1,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.splice accepts one of the following types: array, object."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.splice accepts one of the following types: array, object."`
    );
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.some must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [], callback: 1 },
        methodName,
        location,
      })
    ).toThrow(/(number )?1 is not a function/);
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.sort must be evaluated on an array instance. For named args provide an array instance to the \\"on\\" property, for listed args provide an array instance as the first element in the operator argument array."`
    );
    expect(() =>
      _array({
        params: { on: [] },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.sort accepts one of the following types: array."`
    );
    expect(() =>
      _array({
        params: null,
        methodName,
        location,
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
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.length accepts one of the following types: array, null."`
    );
    expect(() =>
      _array({
        params: '1',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.length accepts one of the following types: array, null."`
    );
  });
});

test('_array called with no method or params', () => {
  expect(() => _array({ location: 'location' })).toThrowErrorMatchingInlineSnapshot(
    `"_array requires a method. Use one of the following: at, concat, copyWithin, every, fill, filter, find, findIndex, findLast, findLastIndex, flat, flatMap, from, includes, indexOf, join, lastIndexOf, map, pop, push, reduce, reduceRight, reverse, shift, slice, some, sort, splice, unshift, length."`
  );
});

test('_array invalid method', () => {
  expect(() =>
    _array({ params: [['a']], methodName: 'X', location: 'location' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_array.X is not supported, use one of the following: at, concat, copyWithin, every, fill, filter, find, findIndex, findLast, findLastIndex, flat, flatMap, from, includes, indexOf, join, lastIndexOf, map, pop, push, reduce, reduceRight, reverse, shift, slice, some, sort, splice, unshift, length."`
  );
});

describe('_array.push', () => {
  const methodName = 'push';
  test('push returns the array with items appended', () => {
    expect(_array({ params: [[1, 2], 3, 4], methodName, location })).toEqual([1, 2, 3, 4]);
    expect(_array({ params: { on: [1, 2], items: [3, 4] }, methodName, location })).toEqual([
      1, 2, 3, 4,
    ]);
    expect(_array({ params: { on: null, items: ['a'] }, methodName, location })).toEqual(['a']);
  });
  test('push throws when items is not an array', () => {
    expect(() =>
      _array({ params: { on: [1], items: 2 }, methodName, location })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.push takes an array as input argument for items."`
    );
  });
});

describe('_array.unshift', () => {
  const methodName = 'unshift';
  test('unshift returns the array with items prepended', () => {
    expect(_array({ params: [[3, 4], 1, 2], methodName, location })).toEqual([1, 2, 3, 4]);
    expect(_array({ params: { on: [3], items: [1, 2] }, methodName, location })).toEqual([1, 2, 3]);
  });
});

describe('_array.pop', () => {
  const methodName = 'pop';
  test('pop returns the array without its last item', () => {
    expect(_array({ params: [1, 2, 3], methodName, location })).toEqual([1, 2]);
    expect(_array({ params: null, methodName, location })).toEqual([]);
  });
  test('pop throws for an object', () => {
    expect(() =>
      _array({ params: { on: [1] }, methodName, location })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_array.pop accepts one of the following types: array, null."`
    );
  });
});

describe('_array.shift', () => {
  const methodName = 'shift';
  test('shift returns the array without its first item', () => {
    expect(_array({ params: [1, 2, 3], methodName, location })).toEqual([2, 3]);
    expect(_array({ params: null, methodName, location })).toEqual([]);
  });
});

describe('_array.at', () => {
  const methodName = 'at';
  test('at returns the item at an index, counting back from the end for negative indices', () => {
    expect(_array({ params: [['a', 'b', 'c'], 0], methodName, location })).toEqual('a');
    expect(_array({ params: { on: ['a', 'b', 'c'], index: -1 }, methodName, location })).toEqual(
      'c'
    );
    expect(_array({ params: [['a'], 5], methodName, location })).toBeUndefined();
  });
});

describe('_array.findLast and _array.findLastIndex', () => {
  const callback = _function({
    location,
    operatorPrefix,
    params: { __gt: [{ __args: '0' }, 3] },
    parser,
  });
  test('findLast returns the last item passing the callback', () => {
    expect(_array({ params: [[5, 1, 6, 2], callback], methodName: 'findLast', location })).toEqual(
      6
    );
    expect(
      _array({ params: { on: [1, 2], callback }, methodName: 'findLast', location })
    ).toBeUndefined();
  });
  test('findLastIndex returns the index of the last item passing the callback', () => {
    expect(
      _array({ params: [[5, 1, 6, 2], callback], methodName: 'findLastIndex', location })
    ).toEqual(2);
    expect(
      _array({ params: { on: [1, 2], callback }, methodName: 'findLastIndex', location })
    ).toEqual(-1);
  });
});

describe('_array.flatMap', () => {
  const callback = _function({
    location,
    operatorPrefix,
    params: [{ __args: '0' }, { __args: '0' }],
    parser,
  });
  test('flatMap maps each item and flattens the result one level', () => {
    expect(_array({ params: [[1, 2], callback], methodName: 'flatMap', location })).toEqual([
      1, 1, 2, 2,
    ]);
    expect(_array({ params: { on: null, callback }, methodName: 'flatMap', location })).toEqual([]);
  });
});

describe('_array.from', () => {
  const methodName = 'from';
  const indexCallback = _function({
    location,
    operatorPrefix,
    params: { __args: '1' },
    parser,
  });
  test('from creates an array of length n from { length: n }', () => {
    expect(_array({ params: [{ length: 3 }], methodName, location })).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
    expect(
      _array({ params: { on: { length: 4 }, callback: indexCallback }, methodName, location })
    ).toEqual([0, 1, 2, 3]);
  });
  test('from copies an array or splits a string into characters', () => {
    expect(_array({ params: [[1, 2]], methodName, location })).toEqual([1, 2]);
    expect(_array({ params: { on: 'abc' }, methodName, location })).toEqual(['a', 'b', 'c']);
  });
  test('from throws for a non array or object param', () => {
    expect(() => _array({ params: 3, methodName, location })).toThrowErrorMatchingInlineSnapshot(
      `"_array.from accepts one of the following types: array, object."`
    );
  });
});
