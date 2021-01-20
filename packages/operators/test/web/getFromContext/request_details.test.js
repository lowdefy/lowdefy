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

/* eslint-disable max-classes-per-file */
import WebParser from '../../../src/webParser';

const args = {
  string: 'args',
  arr: [{ a: 'args1' }, { a: 'args2' }],
};

const context = {
  id: 'own',
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
  updateListeners: new Set(),
};

const otherContext = {
  id: 'other',
  config: {
    string: 'config',
    arr: [{ a: 'config1' }, { a: 'config2' }],
  },
  input: {
    string: 'input-other',
    arr: [{ a: 'input1-other' }, { a: 'input2-other' }],
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
    not_loaded: { loading: true, response: 'fail-other' },
    string: { loading: false, response: 'mutation String-other' },
    number: { loading: false, response: 600 },
    arr: { loading: false, response: [{ a: 'mutation a1-other' }, { a: 'mutation a2-other' }] },
  },
  requests: {
    not_loaded: { loading: true, response: 'fail-other' },
    string: { loading: false, response: 'request String-other' },
    number: { loading: false, response: 600 },
    arr: { loading: false, response: [{ a: 'request a1-other' }, { a: 'request a2-other' }] },
  },
  state: {
    string: 'state-other',
    arr: [{ a: 'state1-other' }, { a: 'state2-other' }],
  },
  urlQuery: {
    string: 'urlQuery-other',
    arr: [{ a: 'urlQuery1-other' }, { a: 'urlQuery2-other' }],
  },
  updateListeners: new Set(),
};

const contexts = {
  own: context,
  other: otherContext,
};

const arrayIndices = [1];

test('_request_details, other context contextId not a string', () => {
  const input = { _request_details: { key: 'string', contextId: 1 } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request_details.contextId must be of type string. Received: {"key":"string","contextId":1} at locationId.],
    ]
  `);
});

test('_request_details, other context contextId not found', () => {
  const input = { _request_details: { key: 'string', contextId: 'not_there' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: Context not_there not found. Received: {"key":"string","contextId":"not_there"} at locationId.],
    ]
  `);
});

test('_request_details param object key', () => {
  const input = {
    _request_details: {
      key: 'string',
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: false, response: 'request String-other' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details full state', () => {
  const input = { _request_details: { contextId: 'other' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    not_loaded: { loading: true, response: 'fail-other' },
    string: { loading: false, response: 'request String-other' },
    number: { loading: false, response: 600 },
    arr: { loading: false, response: [{ a: 'request a1-other' }, { a: 'request a2-other' }] },
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object all', () => {
  const input = {
    _request_details: {
      all: true,
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    not_loaded: { loading: true, response: 'fail-other' },
    string: { loading: false, response: 'request String-other' },
    number: { loading: false, response: 600 },
    arr: { loading: false, response: [{ a: 'request a1-other' }, { a: 'request a2-other' }] },
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object all and key', () => {
  const input = {
    _request_details: {
      all: true,
      key: 'string',
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    not_loaded: { loading: true, response: 'fail-other' },
    string: { loading: false, response: 'request String-other' },
    number: { loading: false, response: 600 },
    arr: { loading: false, response: [{ a: 'request a1-other' }, { a: 'request a2-other' }] },
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object with string default', () => {
  const input = {
    _request_details: {
      key: 'notFound',
      default: 'defaultValue',
      contextId: 'other',
    },
  };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, args, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
