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
import _api from './api.js';

const operators = {
  _api,
};

const arrayIndices = [1];

const context = {
  _internal: {
    lowdefy: {
      apiResponses: {
        arr: [
          {
            response: { a: 'api_a1' },
            loading: false,
            status: 'success',
            success: true,
          },
          {
            response: { b: 'api_b1' },
            loading: false,
            status: 'success',
            success: true,
          },
        ],
        string: [
          {
            response: 'api String',
            loading: false,
            status: 'success',
            success: true,
          },
        ],
        obj: [
          {
            response: { key: 'value' },
            loading: false,
            status: 'success',
            success: true,
          },
        ],
        erroneous: [
          {
            response: null,
            loading: false,
            status: 'error',
            success: false,
            error: { message: 'error message' },
          },
        ],
      },
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
  requests: {},
  state: { state: true },
};

console.error = () => {};

test('_api response by id', () => {
  const input = { _api: 'string.response' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('api String');
  expect(res.errors).toEqual([]);
});

test('_api success status by id', () => {
  const input = { _api: 'string.status' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('success');
  expect(res.errors).toEqual([]);
});

test('_api error by id', () => {
  const input = { _api: 'erroneous.error' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ message: 'error message' });
});

test('_api true gives null', () => {
  const input = { _api: true };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _api accepts a string value. Received: true at locationId.],
    ]
  `);
});

test('_api return first element', () => {
  const input = { _api: 'arr.response' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: 'api_a1' });
});

test('_api null', () => {
  const input = { _api: null };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _api accepts a string value. Received: null at locationId.],
    ]
  `);
});

test('_api dot notation', () => {
  const input = { _api: 'obj.response.key' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('value');
  expect(res.errors).toEqual([]);
});

test('_api dot notation returns null if ', () => {
  const input = { _api: 'returnsNull.key' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toEqual([]);
});
