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

import object from './object.js';

describe('_object.hasOwnProperty', () => {
  const methodName = 'hasOwnProperty';
  test('valid', () => {
    expect(
      object({
        params: [{ a: 1 }, 'a'],
        methodName,
      })
    ).toEqual(true);
    expect(
      object({
        params: [null, 'a'],
        methodName,
      })
    ).toEqual(false);
    expect(
      object({
        params: { on: { a: 1 }, prop: 'a' },
        methodName,
      })
    ).toEqual(true);
    expect(
      object({
        params: { on: { a: 1 }, prop: 'b' },
        methodName,
      })
    ).toEqual(false);
    expect(
      object({
        params: { value: 'x', start: 1, end: 2 },
        methodName,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      object({
        params: [1, { a: 1 }],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.hasOwnProperty must be evaluated on an object instance. For named args provide an object instance to the \\"on\\" property, for listed args provide and object instance as the first element in the operator argument array."`
    );
    expect(() =>
      object({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.hasOwnProperty accepts one of the following types: array, object."`
    );
    expect(() =>
      object({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.hasOwnProperty accepts one of the following types: array, object."`
    );
  });
});

describe('_object.entries', () => {
  const methodName = 'entries';
  test('valid', () => {
    expect(
      object({
        params: { a: 1, b: 2 },
        methodName,
      })
    ).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });
  test('handle null', () => {
    expect(
      object({
        params: null,
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      object({
        params: [],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.entries accepts one of the following types: object, null."`
    );
    expect(() =>
      object({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.entries accepts one of the following types: object, null."`
    );
  });
});

describe('_object.fromEntries', () => {
  const methodName = 'fromEntries';
  test('valid', () => {
    expect(
      object({
        params: [
          ['a', 1],
          ['b', 2],
        ],
        methodName,
      })
    ).toEqual({ a: 1, b: 2 });
  });
  test('handle null', () => {
    expect(
      object({
        params: null,
        methodName,
      })
    ).toEqual({});
  });
  test('throw', () => {
    expect(() =>
      object({
        params: {},
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.fromEntries accepts one of the following types: array, null."`
    );
    expect(() =>
      object({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.fromEntries accepts one of the following types: array, null."`
    );
  });
});

describe('_object.keys', () => {
  const methodName = 'keys';
  test('valid', () => {
    expect(
      object({
        params: { a: 1, b: 1 },
        methodName,
      })
    ).toEqual(['a', 'b']);
  });
  test('handle null', () => {
    expect(
      object({
        params: null,
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      object({
        params: [],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.keys accepts one of the following types: object, null."`
    );
    expect(() =>
      object({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.keys accepts one of the following types: object, null."`
    );
  });
});

describe('_object.values', () => {
  const methodName = 'values';
  test('valid', () => {
    expect(
      object({
        params: { a: 1, b: 2 },
        methodName,
      })
    ).toEqual([1, 2]);
  });
  test('handle null', () => {
    expect(
      object({
        params: null,
        methodName,
      })
    ).toEqual([]);
  });
  test('throw', () => {
    expect(() =>
      object({
        params: [],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.values accepts one of the following types: object, null."`
    );
    expect(() =>
      object({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.values accepts one of the following types: object, null."`
    );
  });
});

describe('_object.assign', () => {
  const methodName = 'assign';
  test('valid', () => {
    expect(
      object({
        params: [
          { a: 1, b: 2 },
          { a: 2, c: 3 },
        ],
        methodName,
      })
    ).toEqual({ a: 2, b: 2, c: 3 });
    expect(
      object({
        params: [{ a: 1, b: 2 }, 2, 'a', { b: 3 }],
        methodName,
      })
    ).toEqual({ 0: 'a', a: 1, b: 3 });
    expect(
      object({
        params: [],
        methodName,
      })
    ).toEqual({});
  });
  test('throw', () => {
    expect(() =>
      object({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.assign accepts one of the following types: array."`
    );
    expect(() =>
      object({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.assign accepts one of the following types: array."`
    );
  });
});

// NOTE: Explicitly test for assign values.
// One of the properties of property descriptors is enumerable, which has the default value false.
// If a property is non-enumerable, Node.js chooses not to display the property, thats it.
// https://stackoverflow.com/a/50951216/2453657
describe('_object.defineProperty', () => {
  const methodName = 'defineProperty';
  test('valid', () => {
    let obj = { a: 1 };
    object({
      params: { on: obj, key: 'new', descriptor: { value: 6 } },
      methodName,
    });
    expect(obj).toEqual({ a: 1, new: 6 });
    expect(Object.keys(obj)).toEqual(['a', 'new']);
    obj = { a: 2 };
    object({
      params: [obj, 'newer', { value: 6 }],
      methodName,
    });
    expect(obj).toEqual({ a: 2, newer: 6 });
    obj = { a: 3 };
    object({
      params: [obj, 'x', { value: 6, enumerable: false, configurable: false }],
      methodName,
    });
    expect(obj).toEqual({ a: 3 });
    expect(obj.x).toEqual(6);
    expect(
      object({
        params: [],
        methodName,
      })
    ).toEqual({});
  });
  test('throw', () => {
    expect(() =>
      object({
        params: 'x',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.defineProperty accepts one of the following types: array, object."`
    );
    expect(() =>
      object({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_object.defineProperty accepts one of the following types: array, object."`
    );
  });
});

test('_object called with no method or params', () => {
  expect(() => object({})).toThrowErrorMatchingInlineSnapshot(
    `"_object requires a valid method name, use one of the following: assign, defineProperty, entries, fromEntries, keys, values."`
  );
});

test('_object invalid method', () => {
  expect(() => object({ params: [{ a: 1 }], methodName: 'X' })).toThrowErrorMatchingInlineSnapshot(
    `"_object.X is not supported, use one of the following: assign, defineProperty, entries, fromEntries, keys, values."`
  );
});

test('_object invalid method args', () => {
  expect(() => object({ params: 'X', methodName: 'flat' })).toThrowErrorMatchingInlineSnapshot(
    `"_object.flat is not supported, use one of the following: assign, defineProperty, entries, fromEntries, keys, values."`
  );
});
