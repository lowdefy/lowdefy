/*
  Copyright 2020 Lowdefy, Inc

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

import WebParser from '../../src/webParser';

const args = {
  string: 'args',
  arr: [{ a: 'args1' }, { a: 'args2' }],
};

const context = {
  config: {
    string: 'config',
    arr: [{ a: 'config1' }, { a: 'config2' }],
  },
  input: {
    string: 'input',
    arr: [{ a: 'input1' }, { a: 'input2' }],
  },
  lowdefyGlobal: {
    string: 'global',
    arr: [{ a: 'global1' }, { a: 'global2' }],
  },
  menus: [
    {
      menuId: 'default',
    },
    {
      menuId: 'm_1',
    },
    {
      menuId: 'm_2',
    },
  ],
  mutations: {
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'mutation String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'mutation a1' }, { a: 'mutation a2' }] },
  },
  requests: {
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
  },
  state: {
    string: 'state',
    number: 42,
    arr: [{ a: 'state1' }, { a: 'state2' }],
    boolean: true,
  },
  urlQuery: {
    string: 'urlQuery',
    arr: [{ a: 'urlQuery1' }, { a: 'urlQuery2' }],
  },
};

const contexts = {};

const arrayIndices = [1];

test('_type with on, pass', () => {
  const input = { _type: { type: 'string', on: 'a' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with on, fail', () => {
  const input = { _type: { type: 'number', on: 'b' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, pass', () => {
  const input = { _type: { type: 'string', key: 'string' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with key, fail', () => {
  const input = { _type: { type: 'number', key: 'string' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with null on pass', () => {
  const input = { _type: { type: 'null', on: null } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
test('_type with null on fail', () => {
  const input = { _type: { type: 'boolean', on: null } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', () => {
  const input = { _type: { type: 'string', key: 'notThere' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with nonexistent key', () => {
  const input = { _type: { type: 'string', key: null } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type null', () => {
  const input = { _type: null };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _type.type must be a string. Received: null at locationId.],
    ]
  `);
});

test('_type with non-string on', () => {
  const input = { _type: { type: 'number', on: 5 } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with location given to parse in state pass', () => {
  const input = { _type: 'string' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'string', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with location given to parse in state fail', () => {
  const input = { _type: 'boolean' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'string', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with location given to parse not in state', () => {
  const input = { _type: 'string' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'string2', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type with unknown type', () => {
  const input = { _type: 'strings' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'string', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: "strings" is not a valid _type test. Received: "strings" at string.],
    ]
  `);
});

test('_type boolean with location given to parse in state pass', () => {
  const input = { _type: 'boolean' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'boolean', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type number with location given to parse in state pass', () => {
  const input = { _type: 'number' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'number', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type primitive with location given to parse in state pass', () => {
  const input = { _type: 'primitive' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'number', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type integer with location given to parse in state pass', () => {
  const input = { _type: 'integer' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'number', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type none with location given to parse in state pass', () => {
  const input = { _type: 'none' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type undefined with location given to parse in state pass', () => {
  const input = { _type: 'undefined' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type object with location given to parse in state pass', () => {
  const input = { _type: 'object' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'arr.$', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type string with location given to parse nested array in state pass', () => {
  const input = { _type: 'string' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'arr.$.a', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type array with location given to parse in state pass', () => {
  const input = { _type: 'array' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'arr', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date with on packed date pass', () => {
  const input = { _type: { type: 'date', on: { _date: Date.now() } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on string date fail', () => {
  const input = { _type: { type: 'date', on: '2019-11-28T08:10:09.844Z' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_type date on date object pass', () => {
  const input = { _type: { type: 'date', on: new Date() } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: '1', arrayIndices });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
