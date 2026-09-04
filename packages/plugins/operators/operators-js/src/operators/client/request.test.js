/*
  Copyright 2020-2026 Lowdefy, Inc

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
    failed: [
      {
        response: null,
        loading: false,
        error: new Error('Connection refused.'),
      },
    ],
    emptyArray: [
      {
        response: [],
        loading: false,
      },
    ],
    returnsNull: [
      {
        response: null,
        loading: false,
      },
    ],
    arr: [
      {
        response: [{ a: 'request a1' }, { a: 'request a2' }],
        loading: false,
      },
    ],
    number: [
      {
        response: 500,
        loading: false,
      },
    ],
    string: [
      {
        response: 'request String',
        loading: false,
      },
    ],
    holding: [
      {
        response: 'previous value',
        loading: true,
        holdValue: true,
      },
    ],
    loadingNoHold: [
      {
        response: 'stale value',
        loading: true,
      },
    ],
    reserved: [
      {
        response: { constructor: 'from the api', safe: 'ok' },
        loading: false,
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
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]._message).toBe(
    '_request accepts a string value, or an object with a "key" string and an optional "status" boolean.'
  );
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
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]._message).toBe(
    '_request accepts a string value, or an object with a "key" string and an optional "status" boolean.'
  );
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

test('_request returns previous response when loading and holdValue is true', () => {
  const input = { _request: 'holding' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('previous value');
  expect(res.errors).toEqual([]);
});

test('_request returns null when loading and holdValue is not set', () => {
  const input = { _request: 'loadingNoHold' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_request returns null and does not throw when the response holds a reserved key', () => {
  const input = { _request: 'reserved.constructor' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_request still resolves a non-reserved key on a response that holds a reserved key', () => {
  const input = { _request: 'reserved.safe' };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe('ok');
  expect(res.errors).toEqual([]);
});

test('_request propagates an error that is not a ReservedKeyError', () => {
  const response = {};
  Object.defineProperty(response, 'boom', {
    enumerable: true,
    get: () => {
      throw new Error('read failed');
    },
  });
  const requests = { throws: [{ response, loading: false }] };
  expect(() => _request({ arrayIndices, params: 'throws.boom', requests })).toThrow('read failed');
});

test('_request status returns loading while the request is in flight', () => {
  const input = { _request: { key: 'loadingNoHold', status: true } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: true, error: null, success: false, empty: false });
  expect(res.errors).toEqual([]);
});

test('_request status returns the error message when the request failed', () => {
  const input = { _request: { key: 'failed', status: true } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    loading: false,
    error: 'Connection refused.',
    success: false,
    empty: false,
  });
  expect(res.errors).toEqual([]);
});

test('_request status returns success for a completed request with rows', () => {
  const input = { _request: { key: 'arr', status: true } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: false, error: null, success: true, empty: false });
  expect(res.errors).toEqual([]);
});

test('_request status reports an empty array response as a successful empty request', () => {
  const input = { _request: { key: 'emptyArray', status: true } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: false, error: null, success: true, empty: true });
  expect(res.errors).toEqual([]);
});

test('_request status reports a null response as a successful empty request', () => {
  const input = { _request: { key: 'returnsNull', status: true } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: false, error: null, success: true, empty: true });
  expect(res.errors).toEqual([]);
});

test('_request status of a request that was never called is neither loading nor successful', () => {
  const input = { _request: { key: 'never_called', status: true } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ loading: false, error: null, success: false, empty: false });
  expect(res.errors).toEqual([]);
});

test('_request object form without status reads the response like the string form', () => {
  const input = { _request: { key: 'arr.0.a' } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('request a1');
  expect(res.errors).toEqual([]);
});

test('_request object form requires a key string', () => {
  const input = { _request: { status: true } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors[0]._message).toBe(
    '_request object params require a "key" string naming the request.'
  );
});

test('_request object form rejects a non-boolean status', () => {
  const input = { _request: { key: 'arr', status: 'yes' } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors[0]._message).toBe('_request "status" must be a boolean.');
});
