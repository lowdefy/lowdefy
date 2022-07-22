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

import mql from './mql.js';

test('_mql.aggregate on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        pipeline: [
          {
            $sort: {
              id: 1,
            },
          },
        ],
      },
      methodName: 'aggregate',
    })
  ).toEqual([]);
});

test('_mql.aggregate sort as array params', () => {
  expect(
    mql({
      params: [
        [
          {
            id: 2,
          },
          {
            id: 1,
          },
        ],
        [
          {
            $sort: {
              id: 1,
            },
          },
        ],
      ],
      methodName: 'aggregate',
    })
  ).toEqual([
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);
});

test('_mql.aggregate sort as object params', () => {
  expect(
    mql({
      params: {
        on: [
          {
            id: 2,
          },
          {
            id: 1,
          },
        ],
        pipeline: [
          {
            $sort: {
              id: 1,
            },
          },
        ],
      },
      methodName: 'aggregate',
    })
  ).toEqual([
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);
});

test('_mql.aggregate group', () => {
  expect(
    mql({
      params: {
        on: [
          {
            id: 2,
          },
          {
            id: 1,
          },
        ],
        pipeline: [
          {
            $group: {
              _id: 0,
              count: { $sum: 1 },
            },
          },
        ],
      },
      methodName: 'aggregate',
    })
  ).toEqual([
    {
      _id: 0,
      count: 2,
    },
  ]);
});

test('_mql.aggregate empty pipeline', () => {
  expect(
    mql({
      params: {
        on: [
          {
            id: 2,
          },
          {
            id: 1,
          },
        ],
        pipeline: [],
      },
      methodName: 'aggregate',
    })
  ).toEqual([
    {
      id: 2,
    },
    {
      id: 1,
    },
  ]);
});

test('_mql.aggregate empty collection', () => {
  expect(
    mql({
      params: {
        on: [],
        pipeline: [
          {
            $sort: {
              id: 1,
            },
          },
        ],
      },
      methodName: 'aggregate',
    })
  ).toEqual([]);
});

test('_mql.aggregate on is string', () => {
  expect(() =>
    mql({
      params: {
        on: 'invalid',
        pipeline: [
          {
            $sort: {
              id: 1,
            },
          },
        ],
      },

      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.aggregate - Data must be of type array."`);
});

test('_mql.aggregate invalid', () => {
  expect(() =>
    mql({
      params: {
        on: [
          {
            id: 2,
          },

          {
            id: 1,
          },
        ],

        pipeline: [
          {
            $badOp: {
              id: 1,
            },
          },
        ],
      },

      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.aggregate - invalid aggregation operator $badOp"`);
});

test('_mql.aggregate on is object', () => {
  expect(() =>
    mql({
      params: {
        on: {
          id: 1,
        },

        pipeline: [
          {
            $sort: {
              id: 1,
            },
          },
        ],
      },

      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.aggregate - Data must be of type array."`);
});

test('_mql.aggregate pipeline not an array', () => {
  expect(() =>
    mql({
      params: {
        on: [
          {
            id: 2,
          },

          {
            id: 1,
          },
        ],

        pipeline: 'invalid',
      },

      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.aggregate - Pipeline must be of type array."`);
});

test('_mql.aggregate params not object or array', () => {
  expect(() =>
    mql({
      params: 'invalid',
      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_mql.aggregate accepts one of the following types: array, object."`
  );
});

test('_mql.expr $add on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        expr: { $add: ['$number', 2] },
      },
      methodName: 'expr',
    })
  ).toEqual(NaN);
});

test('_mql.expr $sum on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        expr: { $sum: ['$number', 2] },
      },
      methodName: 'expr',
    })
  ).toEqual(2);
});

test('_mql.expr $gt on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        expr: { $gt: ['$number', 2] },
      },
      methodName: 'expr',
    })
  ).toEqual(false);
});

test('_mql.expr add number', () => {
  expect(
    mql({
      params: {
        on: { number: 42 },
        expr: { $add: ['$number', 2] },
      },
      methodName: 'expr',
    })
  ).toEqual(44);
});

test('_mql.expr null', () => {
  expect(
    mql({
      params: {
        on: { number: 42 },
        expr: null,
      },
      methodName: 'expr',
    })
  ).toEqual(null);
});

test('_mql.expr invalid', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        expr: { $cond: ['$number'] },
      },

      methodName: 'expr',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.expr - $cond: invalid arguments"`);
});

test('_mql.expr invalid on', () => {
  expect(() =>
    mql({
      params: {
        on: 'invalid',
        expr: { $cond: ['$number'] },
      },

      methodName: 'expr',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.expr - Data must be of type object."`);
});

test('_mql.expr logic', () => {
  expect(
    mql({
      params: {
        on: { number: 42, booleanTrue: true },
        expr: { $and: [{ $gt: ['$number', 41] }, '$booleanTrue'] },
      },
      methodName: 'expr',
    })
  ).toEqual(true);
  expect(
    mql({
      params: {
        on: { number: 42, booleanFalse: false },
        expr: { $and: [{ $gt: ['$number', 41] }, '$booleanFalse'] },
      },
      methodName: 'expr',
    })
  ).toEqual(false);
  expect(
    mql({
      params: {
        on: { number: 42, booleanTrue: true },
        expr: { $and: [{ $gt: ['$number', 42] }, '$booleanTrue'] },
      },
      methodName: 'expr',
    })
  ).toEqual(false);
});

test('_mql.test on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        test: { string: { $eq: 'Some String' } },
      },
      methodName: 'test',
    })
  ).toEqual(false);
});

test('_mql.test $eq on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        test: { string: { $eq: 'Some String' } },
      },
      methodName: 'test',
    })
  ).toEqual(false);
});

test('_mql.test $ne on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        test: { string: { $ne: 'Some String' } },
      },
      methodName: 'test',
    })
  ).toEqual(true);
});

test('_mql.test string equal', () => {
  expect(
    mql({
      params: {
        on: { string: 'Some String' },
        test: { string: { $eq: 'Some String' } },
      },
      methodName: 'test',
    })
  ).toEqual(true);
});

test('_mql.test string equal shorthand', () => {
  expect(
    mql({
      params: {
        on: { string: 'Some String' },
        test: { string: 'Some String' },
      },
      methodName: 'test',
    })
  ).toEqual(true);
});

test('_mql.test string not equal', () => {
  expect(
    mql({
      params: {
        on: { string: 'Some String' },
        test: { string: 'Some Other String' },
      },
      methodName: 'test',
    })
  ).toEqual(false);
});

test('_mql.test number equal', () => {
  expect(
    mql({
      params: {
        on: { number: 42 },
        test: { number: { $eq: 42 } },
      },
      methodName: 'test',
    })
  ).toEqual(true);
});

test('_mql.test number not equal', () => {
  expect(
    mql({
      params: {
        on: { number: 42 },
        test: { number: 40 },
      },
      methodName: 'test',
    })
  ).toEqual(false);
});

test('_mql.test number greater than', () => {
  expect(
    mql({
      params: {
        on: { number: 42 },
        test: { number: { $gt: 1 } },
      },
      methodName: 'test',
    })
  ).toEqual(true);
});

test('_mql.test array params', () => {
  expect(
    mql({
      params: [{ value: 30 }, { value: { $lt: 31 } }],
      methodName: 'test',
    })
  ).toEqual(true);
});

test('_mql.test invalid expr', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        test: 'invalid',
      },

      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.test - Query test must be of type object."`);
});

test('_mql.test invalid params', () => {
  expect(() =>
    mql({
      params: 'invalid',
      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_mql.test accepts one of the following types: array, object."`
  );
});

test('_mql.test null', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        test: null,
      },

      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.test - Query test must be of type object."`);
});

test('_mql.test invalid test', () => {
  expect(() =>
    mql({
      params: {
        on: { string: 'value' },
        test: { string: { $badOp: 'Some String' } },
      },

      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.test - unknown operator $badOp"`);
});

test('_mql.test invalid on', () => {
  expect(() =>
    mql({
      params: {
        on: 'invalid',
        test: { $cond: ['$number'] },
      },

      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(`"_mql.test - Data must be of type object."`);
});

test('_mql invalid method name', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        test: { number: 42 },
      },

      methodName: 'invalid',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_mql.invalid is not supported, use one of the following: aggregate, expr, test."`
  );
});

test('_mql undefined method name', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        test: { number: 42 },
      },
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_mql requires a valid method name, use one of the following: aggregate, expr, test."`
  );
});
