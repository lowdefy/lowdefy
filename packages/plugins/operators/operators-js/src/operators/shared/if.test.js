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
import { NodeParser } from '@lowdefy/operators';

console.error = () => {};

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
