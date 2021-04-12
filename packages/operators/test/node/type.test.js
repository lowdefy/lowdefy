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

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
  boolean: true,
};

console.error = () => {};

test('_type with on, pass', async () => {
  const input = { _type: { type: 'string', on: 'a' } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with on, fail', async () => {
  const input = { _type: { type: 'number', on: 'b' } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, pass', async () => {
  const input = { _type: { type: 'string', key: 'string' } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, fail', async () => {
  const input = { _type: { type: 'number', key: 'string' } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with null on pass', async () => {
  const input = { _type: { type: 'null', on: null } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
test('_type with null on fail', async () => {
  const input = { _type: { type: 'boolean', on: null } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', async () => {
  const input = { _type: { type: 'string', key: 'notThere' } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', async () => {
  const input = { _type: { type: 'string', key: null } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type null', async () => {
  const input = { _type: null };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _type.type must be a string. Received: null at locationId.],
    ]
  `);
});

test('_type with non-string on', async () => {
  const input = { _type: { type: 'number', on: 5 } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with unknown type', async () => {
  const input = { _type: 'strings' };
  const parser = new NodeParser({ state, arrayIndices: [] });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: "strings" is not a valid _type test. Received: "strings" at locationId.],
    ]
  `);
});

test('_type date with on packed date pass', async () => {
  const input = { _type: { type: 'date', on: { _date: Date.now() } } };
  const parser = new NodeParser({ state, arrayIndices: [] });
  await parser.init();
  const res = parser.parse({ input, id: '1', location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on string date fail', async () => {
  const input = { _type: { type: 'date', on: '2019-11-28T08:10:09.844Z' } };
  const parser = new NodeParser({ state, arrayIndices: [] });
  await parser.init();
  const res = parser.parse({ input, id: '1', location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on date object pass', async () => {
  const input = { _type: { type: 'date', on: new Date() } };
  const parser = new NodeParser({ state, arrayIndices: [] });
  await parser.init();
  const res = parser.parse({ input, id: '1', location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
