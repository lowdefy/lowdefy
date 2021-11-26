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
