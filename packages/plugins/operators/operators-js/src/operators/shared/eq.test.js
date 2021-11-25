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

const arr0 = [0, 0];
const arr1 = [0, 1];
const arr2 = [1, 2];
const arr3 = [1, 2, 3];
const arr30 = [1, 2, 3, 0];
const string = 'hello';
const Null = null;
const True = true;
const False = false;

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
