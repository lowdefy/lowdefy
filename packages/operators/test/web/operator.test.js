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
    arr: [{ a: 'state1' }, { a: 'state2' }],
  },
  urlQuery: {
    string: 'urlQuery',
    arr: [{ a: 'urlQuery1' }, { a: 'urlQuery2' }],
  },
};

const contexts = {};

const arrayIndices = [1];

test('_operator, _state', () => {
  const input = { a: { _operator: { name: '_state', params: 'string' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'state',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_operator.name invalid', () => {
  const input = { a: { _operator: { name: '_a' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator - Invalid operator name. Received: {"name":"_a"} at locationId.],
    ]
  `);
});

test('_operator.name not a string', () => {
  const input = { a: { _operator: { name: 1 } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name must be a valid operator name as string. Received: {"name":1} at locationId.],
    ]
  `);
});

test('_operator with value not a object', () => {
  const input = { a: { _operator: 'a' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name must be a valid operator name as string. Received: "a" at locationId.],
    ]
  `);
});

test('_operator cannot be set to _operator', () => {
  const input = { a: { _operator: { name: '_operator' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name cannot be set to _operator to infinite avoid loop reference. Received: {"name":"_operator"} at locationId.],
    ]
  `);
});

test('_operator, _not with no params', () => {
  const input = { a: { _operator: { name: '_not' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: true });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_operator, _json.parse with params', () => {
  const input = { a: { _operator: { name: '_json.parse', params: '[{ "a": "a1"}]' } } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: [{ a: 'a1' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
