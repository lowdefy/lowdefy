/*
  Copyright 2020-2021 Lowdefy, Inc

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

import NodeParser from '../../src/nodeParser';

const arr0 = [0, 0];
const arr1 = [0, 1];
const arr2 = [1, 2];
const arr3 = [1, 2, 3];
const arr30 = [1, 2, 3, 0];
const string = 'hello';
const Null = null;
const True = true;
const False = false;

console.error = () => {};

test('_not', async () => {
  const parser = new NodeParser();
  await parser.init();
  let res = parser.parse({ input: { _not: arr0 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: arr1 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: arr2 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: arr3 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: arr30 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: string }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: Null }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: True }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _not: False }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_and', async () => {
  const parser = new NodeParser();
  await parser.init();
  let res = parser.parse({ input: { _and: arr0 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _and: arr1 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _and: arr2 }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _and: arr3 }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _and: arr30 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _and: string }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _and takes an array type. Received: "hello" at locationId.],
    ]
  `);
  res = parser.parse({ input: { _and: Null }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _and takes an array type. Received: null at locationId.],
    ]
  `);
  res = parser.parse({ input: { _and: True }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _and takes an array type. Received: true at locationId.],
    ]
  `);
  res = parser.parse({ input: { _and: False }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _and takes an array type. Received: false at locationId.],
    ]
  `);
});

test('_or', async () => {
  const parser = new NodeParser();
  await parser.init();
  let res = parser.parse({ input: { _or: arr0 }, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _or: arr1 }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _or: arr2 }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _or: arr3 }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _or: arr30 }, location: 'locationId' });
  expect(res.output).toEqual(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _or: string }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _or takes an array type. Received: "hello" at locationId.],
    ]
  `);
  res = parser.parse({ input: { _or: Null }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _or takes an array type. Received: null at locationId.],
    ]
  `);
  res = parser.parse({ input: { _or: True }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _or takes an array type. Received: true at locationId.],
    ]
  `);
  res = parser.parse({ input: { _or: False }, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _or takes an array type. Received: false at locationId.],
    ]
  `);
});

test('_eq', async () => {
  const parser = new NodeParser();
  await parser.init();
  let res = parser.parse({ input: { _eq: [1, 1] }, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _eq: [0, 1] }, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _eq: ['1', '1'] }, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _eq: ['0', '1'] }, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({ input: { _eq: [0] }, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _eq takes an array of length 2 as input. Received: [0] at locationId.],
    ]
  `);
  res = parser.parse({ input: { _eq: [0, 1, 2] }, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _eq takes an array of length 2 as input. Received: [0,1,2] at locationId.],
    ]
  `);
  res = parser.parse({ input: { _eq: 1 }, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _eq takes an array type as input. Received: 1 at locationId.],
    ]
  `);
});

test('_if', async () => {
  const parser = new NodeParser();
  await parser.init();
  let res = parser.parse({
    input: {
      _if: {
        test: true,
        then: 1,
        else: 2,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(1);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({
    input: {
      _if: {
        test: false,
        then: 1,
        else: 2,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(2);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({
    input: {
      _if: {
        then: 1,
        else: 2,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _if takes a boolean type for parameter test. Received: {"then":1,"else":2} at locationId.],
    ]
  `);
  res = parser.parse({
    input: {
      _if: {
        test: false,
        then: 1,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(undefined);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({
    input: {
      _if: {
        test: true,
        else: 2,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(undefined);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
  res = parser.parse({
    input: {
      _if: {
        test: {
          a: [1, 3],
        },
        then: 1,
        else: 2,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _if takes a boolean type for parameter test. Received: {"test":{"a":[1,3]},"then":1,"else":2} at locationId.],
    ]
  `);
  res = parser.parse({
    input: {
      _if: {
        test: 'True',
        then: 1,
        else: 2,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _if takes a boolean type for parameter test. Received: {"test":"True","then":1,"else":2} at locationId.],
    ]
  `);
  res = parser.parse({
    input: {
      _if: {
        test: 1,
        then: 1,
        else: 2,
      },
    },
    location: 'locationId',
  });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _if takes a boolean type for parameter test. Received: {"test":1,"then":1,"else":2} at locationId.],
    ]
  `);
});
