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
import WebParser from '../../../src/webParser';

const lowdefy = {
  inputs: {
    own: {
      string: 'input',
      arr: [{ a: 'input1' }, { a: 'input2' }],
    },
    other: {
      string: 'input-other',
      arr: [{ a: 'input1-other' }, { a: 'input2-other' }],
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
  id: 'own',
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
  lowdefy,
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
  updateListeners: new Set(),
};

const otherContext = {
  id: 'other',
  config: {
    string: 'config',
    arr: [{ a: 'config1' }, { a: 'config2' }],
  },
  requests: {
    not_loaded: { loading: true, response: 'fail-other' },
    string: { loading: false, response: 'request String-other' },
    number: { loading: false, response: 600 },
    arr: { loading: false, response: [{ a: 'request a1-other' }, { a: 'request a2-other' }] },
  },
  lowdefy,
  eventLog: [
    {
      blockId: 'block_a-other',
      actionName: 'name_a-other',
      response: [{ data: ['a-other', 'b-other'] }],
      ts: new Date(10),
      status: 'success-other',
    },
    {
      blockId: 'block_b-other',
      actionName: 'name_b-other',
      ts: new Date(11),
      error: [{ error: 'error-other', message: 'broken-other', name: 'e-other' }],
    },
  ],
  state: {
    string: 'state-other',
    arr: [{ a: 'state1-other' }, { a: 'state2-other' }],
  },
  updateListeners: new Set(),
};

const contexts = {
  own: context,
  other: otherContext,
};

const arrayIndices = [1];

console.error = () => {};

test('_event_log, other context contextId not a string', () => {
  const input = { _event_log: { key: 'string', contextId: 1 } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _event_log.contextId must be of type string. Received: {"key":"string","contextId":1} at locationId.],
    ]
  `);
});

test('_event_log, other context contextId not found', () => {
  const input = { _event_log: { key: 'string', contextId: 'not_there' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: Context not_there not found. Received: {"key":"string","contextId":"not_there"} at locationId.],
    ]
  `);
});

test('_event_log param object key', () => {
  const input = {
    _event_log: {
      key: '0.blockId',
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('block_a-other');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log full state', () => {
  const input = { _event_log: { contextId: 'other' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a-other',
      actionName: 'name_a-other',
      response: [{ data: ['a-other', 'b-other'] }],
      ts: new Date(10),
      status: 'success-other',
    },
    {
      blockId: 'block_b-other',
      actionName: 'name_b-other',
      ts: new Date(11),
      error: [{ error: 'error-other', message: 'broken-other', name: 'e-other' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object all', () => {
  const input = {
    _event_log: {
      all: true,
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a-other',
      actionName: 'name_a-other',
      response: [{ data: ['a-other', 'b-other'] }],
      ts: new Date(10),
      status: 'success-other',
    },
    {
      blockId: 'block_b-other',
      actionName: 'name_b-other',
      ts: new Date(11),
      error: [{ error: 'error-other', message: 'broken-other', name: 'e-other' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object all and key', () => {
  const input = {
    _event_log: {
      all: true,
      key: 'string',
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([
    {
      blockId: 'block_a-other',
      actionName: 'name_a-other',
      response: [{ data: ['a-other', 'b-other'] }],
      ts: new Date(10),
      status: 'success-other',
    },
    {
      blockId: 'block_b-other',
      actionName: 'name_b-other',
      ts: new Date(11),
      error: [{ error: 'error-other', message: 'broken-other', name: 'e-other' }],
    },
  ]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_event_log param object with string default', () => {
  const input = {
    _event_log: {
      key: 'notFound',
      default: 'defaultValue',
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
