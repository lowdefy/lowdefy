/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { WebParser } from '@lowdefy/operators';
import _request from './request.js';

const operators = {
  _request,
};

const arrayIndices = [1];

const context = {
  _internal: {
    lowdefy: {
      basePath: 'basePath',
      inputs: { id: true },
      lowdefyGlobal: { global: true },
      menus: [{ menus: true }],
      urlQuery: { urlQuery: true },
      user: { user: true },
      home: {
        pageId: 'home.pageId',
        configured: false,
      },
      _internal: {
        window: {
          location: {
            hash: 'window.location.hash',
            host: 'window.location.host',
            hostname: 'window.location.hostname',
            href: 'window.location.href',
            origin: 'window.location.origin',
            pathname: 'window.location.pathname',
            port: 'window.location.port',
            protocol: 'window.location.protocol',
            search: 'window.location.search',
          },
        },
      },
    },
  },
  eventLog: [{ eventLog: true }],
  id: 'id',
  requests: {
    arr: [
      {
        response: [{ a: 'request a1' }, { a: 'request a2' }],
        loading: false,
        error: [],
      },
    ],
    number: [
      {
        response: 500,
        loading: false,
        error: [],
      },
    ],
    string: [
      {
        response: 'request String',
        loading: false,
        error: [],
      },
    ],
  },
  state: { state: true },
};

console.error = () => {};

test('_request by id', () => {
  const input = { a: { _request: 'string' } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'request String',
  });
  expect(res.errors).toEqual([]);
});

test('_request true gives null', () => {
  const input = { _request: true };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request accepts a string value. Received: true at locationId.],
    ]
  `);
});

test('_request return full array', () => {
  const input = { _request: 'arr' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([{ a: 'request a1' }, { a: 'request a2' }]);
  expect(res.errors).toEqual([]);
});

test('_request return number', () => {
  const input = { _request: 'number' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(500);
  expect(res.errors).toEqual([]);
});

test('_request null', () => {
  const input = { _request: null };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request accepts a string value. Received: null at locationId.],
    ]
  `);
});

test('_request loading true', () => {
  const input = { _request: 'not_loaded' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_request dot notation', () => {
  const input = { _request: 'arr.0.a' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('request a1');
  expect(res.errors).toEqual([]);
});

test('_request dot notation with arrayindices', () => {
  const input = { _request: 'arr.$.a' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('request a2');
  expect(res.errors).toEqual([]);
});

test('_request dot notation returns null if ', () => {
  const input = { _request: 'returnsNull.key' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toEqual([]);
});
