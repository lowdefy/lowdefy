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

import WebParser from '../../src/webParser.js';
import { context } from '../testContext.js';

const arrayIndices = [1];

console.error = () => {};

test('_type with on, pass', async () => {
  const input = { _type: { type: 'string', on: 'a' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with on, fail', async () => {
  const input = { _type: { type: 'number', on: 'b' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, pass', async () => {
  const input = { _type: { type: 'string', key: 'string' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, fail', async () => {
  const input = { _type: { type: 'number', key: 'string' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with null on pass', async () => {
  const input = { _type: { type: 'null', on: null } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
test('_type with null on fail', async () => {
  const input = { _type: { type: 'boolean', on: null } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', async () => {
  const input = { _type: { type: 'string', key: 'notThere' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', async () => {
  const input = { _type: { type: 'string', key: null } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type null', async () => {
  const input = { _type: null };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _type.type must be a string. Received: null at locationId.],
    ]
  `);
});

test('_type with non-string on', async () => {
  const input = { _type: { type: 'number', on: 5 } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with location given to parse in state pass', async () => {
  const input = { _type: 'string' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'string', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with location given to parse in state fail', async () => {
  const input = { _type: 'boolean' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'string', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with location given to parse not in state', async () => {
  const input = { _type: 'string' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'string2', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with unknown type', async () => {
  const input = { _type: 'strings' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'string', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: "strings" is not a valid _type test. Received: "strings" at string.],
    ]
  `);
});

test('_type boolean with location given to parse in state pass', async () => {
  const input = { _type: 'boolean' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'boolean', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type number with location given to parse in state pass', async () => {
  const input = { _type: 'number' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'number', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type primitive with location given to parse in state pass', async () => {
  const input = { _type: 'primitive' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'number', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type integer with location given to parse in state pass', async () => {
  const input = { _type: 'integer' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'number', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type none with location given to parse in state pass', async () => {
  const input = { _type: 'none' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type undefined with location given to parse in state pass', async () => {
  const input = { _type: 'undefined' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type object with location given to parse in state pass', async () => {
  const input = { _type: 'object' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'arr.$', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type string with location given to parse nested array in state pass', async () => {
  const input = { _type: 'string' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'arr.$.a', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type array with location given to parse in state pass', async () => {
  const input = { _type: 'array' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'arr', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date with on packed date pass', async () => {
  const input = { _type: { type: 'date', on: { _date: Date.now() } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on string date fail', async () => {
  const input = { _type: { type: 'date', on: '2019-11-28T08:10:09.844Z' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on date object pass', async () => {
  const input = { _type: { type: 'date', on: new Date() } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
