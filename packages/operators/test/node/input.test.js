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

/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const input = {
  string: 'input String',
  number: 500,
  arr: [{ a: 'input a1' }, { a: 'input a2' }],
};

test('_input in object', () => {
  const obj = { a: { _input: 'string' } };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'input String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input full input', () => {
  const obj = { _input: true };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(input);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input array', () => {
  const obj = { _input: 'arr' };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(input.arr);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input null', () => {
  const obj = { _input: null };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _input params must be of type string, boolean or object. Received: null at locationId.],
    ]
  `);
});

test('_input param object key', () => {
  const obj = {
    _input: {
      key: 'string',
    },
  };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual('input String');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object all', () => {
  const obj = {
    _input: {
      all: true,
    },
  };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(input);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object all and key', () => {
  const obj = {
    _input: {
      all: true,
      key: 'string',
    },
  };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(input);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object invalid', () => {
  const obj = {
    _state: {
      other: true,
    },
  };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _state.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_input param array', () => {
  const obj = {
    _state: ['string'],
  };
  const parser = new NodeParser({ state, input });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _state params must be of type string, boolean or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_input param object with string default', () => {
  const obj = {
    _input: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new NodeParser({
    input,
  });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object with zero default', () => {
  const obj = {
    _input: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new NodeParser({
    input,
  });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object with false default', () => {
  const obj = {
    _input: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new NodeParser({
    input,
  });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input param object with no default', () => {
  const obj = {
    _input: {
      key: 'notFound',
    },
  };
  const parser = new NodeParser({
    input,
  });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input replace key arrayIndices', () => {
  const obj = { a: { _input: 'arr.$.a' } };
  const parser = new NodeParser({
    input,
    arrayIndices: [1],
  });
  const res = parser.parse({ input: obj, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'input a2',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_input with contextId in node environment', () => {
  const input = {
    _input: {
      all: true,
      contextId: 'other',
    },
  };
  const parser = new NodeParser({ input });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: Accessing a context using contextId is only available in a client environment. Received: {"all":true,"contextId":"other"} at locationId.],
    ]
  `);
});
