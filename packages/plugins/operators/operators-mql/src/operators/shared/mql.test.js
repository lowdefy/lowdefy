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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.aggregate - Data must be of type array. Received: {\\"_mql.aggregate\\":{\\"on\\":\\"invalid\\",\\"pipeline\\":[{\\"$sort\\":{\\"id\\":1}}]}} at locationId."`
  );
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
      location: 'locationId',
      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.aggregate - invalid pipeline operator $badOp Received: {\\"_mql.aggregate\\":{\\"on\\":[{\\"id\\":2},{\\"id\\":1}],\\"pipeline\\":[{\\"$badOp\\":{\\"id\\":1}}]}} at locationId."`
  );
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
      location: 'locationId',
      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.aggregate - Data must be of type array. Received: {\\"_mql.aggregate\\":{\\"on\\":{\\"id\\":1},\\"pipeline\\":[{\\"$sort\\":{\\"id\\":1}}]}} at locationId."`
  );
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
      location: 'locationId',
      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.aggregate - Pipeline must be of type array. Received: {\\"_mql.aggregate\\":{\\"on\\":[{\\"id\\":2},{\\"id\\":1}],\\"pipeline\\":\\"invalid\\"}} at locationId."`
  );
});

test('_mql.aggregate params not object or array', () => {
  expect(() =>
    mql({
      params: 'invalid',
      location: 'locationId',
      methodName: 'aggregate',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _mql.aggregate accepts one of the following types: array, object.
          Received: {\\"_mql.aggregate\\":\\"invalid\\"} at locationId."
  `);
});

test('_mql.expr $add on: null', () => {
  expect(
    mql({
      params: {
        on: null,
        expr: { $add: ['$number', 2] },
      },
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
      methodName: 'expr',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.expr - $cond: invalid arguments Received: {\\"_mql.expr\\":{\\"on\\":{\\"number\\":42},\\"expr\\":{\\"$cond\\":[\\"$number\\"]}}} at locationId."`
  );
});

test('_mql.expr invalid on', () => {
  expect(() =>
    mql({
      params: {
        on: 'invalid',
        expr: { $cond: ['$number'] },
      },
      location: 'locationId',
      methodName: 'expr',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.expr - Data must be of type object. Received: {\\"_mql.expr\\":{\\"on\\":\\"invalid\\",\\"expr\\":{\\"$cond\\":[\\"$number\\"]}}} at locationId."`
  );
});

test('_mql.expr logic', () => {
  expect(
    mql({
      params: {
        on: { number: 42, booleanTrue: true },
        expr: { $and: [{ $gt: ['$number', 41] }, '$booleanTrue'] },
      },
      location: 'locationId',
      methodName: 'expr',
    })
  ).toEqual(true);
  expect(
    mql({
      params: {
        on: { number: 42, booleanFalse: false },
        expr: { $and: [{ $gt: ['$number', 41] }, '$booleanFalse'] },
      },
      location: 'locationId',
      methodName: 'expr',
    })
  ).toEqual(false);
  expect(
    mql({
      params: {
        on: { number: 42, booleanTrue: true },
        expr: { $and: [{ $gt: ['$number', 42] }, '$booleanTrue'] },
      },
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
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
      location: 'locationId',
      methodName: 'test',
    })
  ).toEqual(true);
});

test('_mql.test array params', () => {
  expect(
    mql({
      params: [{ value: 30 }, { value: { $lt: 31 } }],
      location: 'locationId',
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
      location: 'locationId',
      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.test - Query test must be of type object. Received: {\\"_mql.test\\":{\\"on\\":{\\"number\\":42},\\"test\\":\\"invalid\\"}} at locationId."`
  );
});

test('_mql.test invalid params', () => {
  expect(() =>
    mql({
      params: 'invalid',
      location: 'locationId',
      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _mql.test accepts one of the following types: array, object.
          Received: {\\"_mql.test\\":\\"invalid\\"} at locationId."
  `);
});

test('_mql.test null', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        test: null,
      },
      location: 'locationId',
      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.test - Query test must be of type object. Received: {\\"_mql.test\\":{\\"on\\":{\\"number\\":42},\\"test\\":null}} at locationId."`
  );
});

test('_mql.test invalid test', () => {
  expect(() =>
    mql({
      params: {
        on: { string: 'value' },
        test: { string: { $badOp: 'Some String' } },
      },
      location: 'locationId',
      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.test - unknown operator $badOp Received: {\\"_mql.test\\":{\\"on\\":{\\"string\\":\\"value\\"},\\"test\\":{\\"string\\":{\\"$badOp\\":\\"Some String\\"}}}} at locationId."`
  );
});

test('_mql.test invalid on', () => {
  expect(() =>
    mql({
      params: {
        on: 'invalid',
        test: { $cond: ['$number'] },
      },
      location: 'locationId',
      methodName: 'test',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _mql.test - Data must be of type object. Received: {\\"_mql.test\\":{\\"on\\":\\"invalid\\",\\"test\\":{\\"$cond\\":[\\"$number\\"]}}} at locationId."`
  );
});

test('_mql invalid method name', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        test: { number: 42 },
      },
      location: 'locationId',
      methodName: 'invalid',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _mql.invalid is not supported, use one of the following: aggregate, expr, test.
          Received: {\\"_mql.invalid\\":{\\"on\\":{\\"number\\":42},\\"test\\":{\\"number\\":42}}} at locationId."
  `);
});

test('_mql undefined method name', () => {
  expect(() =>
    mql({
      params: {
        on: { number: 42 },
        test: { number: 42 },
      },
      location: 'locationId',
    })
  ).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _mql requires a valid method name, use one of the following: aggregate, expr, test.
            Received: {\\"_mql.undefined\\":{\\"on\\":{\\"number\\":42},\\"test\\":{\\"number\\":42}}} at locationId."
  `);
});
