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

import WebParser from '../../src/webParser';

const root = {
  input: {
    own: {
      string: 'input',
      arr: [{ a: 'input1' }, { a: 'input2' }],
    },
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
  urlQuery: {
    string: 'urlQuery',
    arr: [{ a: 'urlQuery1' }, { a: 'urlQuery2' }],
  },
};

const context = {
  config: {
    string: 'config',
    arr: [{ a: 'config1' }, { a: 'config2' }],
  },
  requests: {
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
  },
  root,
  eventLog: [
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ],
  state: {
    string: 'state',
    arr: [{ a: 'state1' }, { a: 'state2' }],
  },
};

const contexts = {};

const arrayIndices = [1];

test('_event_log in array', () => {
  const input = { a: { _event_log: '1.blockId' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'block_b',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log full state', () => {
  const input = { _event_log: true };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log null', () => {
  const input = { _event_log: null };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _event_log params must be of type string, integer, boolean or object. Received: null at locationId.],
    ]
  `);
});

test('_event_log param object key', () => {
  const input = {
    _event_log: {
      key: '0.actionName',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('name_a');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object all', () => {
  const input = {
    _event_log: {
      all: true,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object all and key', () => {
  const input = {
    _event_log: {
      all: true,
      key: 'string',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a',
      actionName: 'name_a',
      response: [{ data: ['a', 'b'] }],
      ts: new Date(0),
      status: 'success',
    },
    {
      blockId: 'block_b',
      actionName: 'name_b',
      ts: new Date(1),
      error: [{ error: 'error', message: 'broken', name: 'e' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object invalid', () => {
  const input = {
    _event_log: {
      other: true,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _event_log.key must be of type string or integer. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_event_log param array', () => {
  const input = {
    _event_log: ['string'],
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _event_log params must be of type string, integer, boolean or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_event_log param object with string default', () => {
  const input = {
    _event_log: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object with zero default', () => {
  const input = {
    _event_log: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object with false default', () => {
  const input = {
    _event_log: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object with no default', () => {
  const input = {
    _event_log: {
      key: 'notFound',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
