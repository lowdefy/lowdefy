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

const lowdefyGlobal = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const args = {};

test('_global in object', () => {
  const input = { a: { _global: 'string' } };
  const parser = new NodeParser({ lowdefyGlobal });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Some String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global full lowdefyGlobal', () => {
  const input = { _global: true };
  const parser = new NodeParser({ lowdefyGlobal });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(lowdefyGlobal);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global null', () => {
  const input = { _global: null };
  const parser = new NodeParser({ lowdefyGlobal });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _global params must be of type string, boolean or object. Received: null at locationId.],
    ]
  `);
});

test('_global param object key', () => {
  const input = {
    _global: {
      key: 'string',
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('Some String');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global param object all', () => {
  const input = {
    _global: {
      all: true,
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(lowdefyGlobal);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global param object all and key', () => {
  const input = {
    _global: {
      all: true,
      key: 'string',
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(lowdefyGlobal);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global param object invalid', () => {
  const input = {
    _global: {
      other: true,
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _global.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_global param array', () => {
  const input = {
    _global: ['string'],
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _global params must be of type string, boolean or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_global param object with string default', () => {
  const input = {
    _global: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global param object with zero default', () => {
  const input = {
    _global: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global param object with false default', () => {
  const input = {
    _global: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global param object with no default', () => {
  const input = {
    _global: {
      key: 'notFound',
    },
  };
  const parser = new NodeParser({
    lowdefyGlobal,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_global replace key arrayIndices', () => {
  const input = { a: { _global: 'arr.$.a' } };
  const parser = new NodeParser({
    lowdefyGlobal,
    arrayIndices: [1],
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'a2',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
