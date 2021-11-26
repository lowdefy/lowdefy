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
import { WebParser } from '@lowdefy/operators';

const arrayIndices = [1];

const context = {
  _internal: {
    lowdefy: {
      inputs: { id: true },
      lowdefyGlobal: { global: true },
      menus: [{ menus: true }],
      urlQuery: { urlQuery: true },
      user: { user: true },
    },
  },
  eventLog: [{ eventLog: true }],
  id: 'id',
  requests: [{ requests: true }],
  state: { state: true },
};

console.error = () => {};

test('_request_details in object', async () => {
  const input = { _request_details: 'string' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: false, response: 'request String' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details all requests', async () => {
  const input = { _request_details: true };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
    returnsNull: { loading: false, response: null },
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details null', async () => {
  const input = { _request_details: null };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request_details params must be of type string, integer, boolean or object. Received: null at locationId.],
    ]
  `);
});

test('_request_details nested', async () => {
  const input = { _request_details: 'string.response' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('request String');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object key', async () => {
  const input = {
    _request_details: {
      key: 'string',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: false, response: 'request String' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object all', async () => {
  const input = {
    _request_details: {
      all: true,
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
    returnsNull: { loading: false, response: null },
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object all and key', async () => {
  const input = {
    _request_details: {
      all: true,
      key: 'string',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
    returnsNull: { loading: false, response: null },
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object invalid', async () => {
  const input = {
    _request_details: {
      other: true,
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request_details.key must be of type string or integer. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_request_details param array', async () => {
  const input = {
    _request_details: ['string'],
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request_details params must be of type string, integer, boolean or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_request_details param object with string default', async () => {
  const input = {
    _request_details: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request_details param object with no default', async () => {
  const input = {
    _request_details: {
      key: 'notFound',
    },
  };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
