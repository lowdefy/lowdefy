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

/* eslint-disable max-classes-per-file */

import { vi, expect, test } from 'vitest';
import WebParser from './webParser.js';

console.error = () => {};

const args = [{ args: true }];

const actions = [{ actions: true }];

const arrayIndices = [1];

const context = {
  _internal: {
    lowdefy: {
      apiResponses: {},
      basePath: 'basePath',
      inputs: { id: true },
      lowdefyApp: { app: true },
      lowdefyGlobal: { global: true },
      menus: [{ menus: true }],
      user: { user: true },
      home: {
        pageId: 'home.pageId',
        configured: false,
      },
      _internal: {
        globals: {
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
  },
  eventLog: [{ eventLog: true }],
  id: 'id',
  instanceKey: 'id',
  pathParams: { ticket_id: '1234' },
  requests: [{ requests: true }],
  state: { state: true },
};

const event = { event: true };

const location = 'location';

const operators = {
  _test: vi.fn(() => 'test'),
  _error: vi.fn(() => {
    throw new Error('Test error.');
  }),
  _init: vi.fn(),
};

operators._init.init = vi.fn();

test('parse input undefined', () => {
  const parser = new WebParser({ context, operators });
  const res = parser.parse({});
  expect(res.output).toEqual();
  expect(res.errors).toEqual([]);
});

test('parse args not array', () => {
  const input = {};
  const args = 'not an array';
  const parser = new WebParser({ context, operators });
  expect(() => parser.parse({ args, input })).toThrow('Operator parser args must be an array.');
});

test('parse event not object', () => {
  const input = {};
  const event = 'not an array';
  const parser = new WebParser({ context, operators });
  expect(() => parser.parse({ event, input })).toThrow('Operator parser event must be a object.');
});

test('parse location not string', () => {
  const input = {};
  const location = [];
  const parser = new WebParser({ context, operators });
  expect(() => parser.parse({ args, input, location })).toThrow(
    'Operator parser location must be a string.'
  );
});

test('operator returns value with ~k present', () => {
  const input = { a: { _test: { params: true, '~k': 'c' }, '~k': 'b' }, '~k': 'a' };
  const location = 'location.$';
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual({ a: 'test' });
  expect(operators._test.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "actions": [
            {
              "actions": true,
            },
          ],
          "apiResponses": {},
          "args": [
            {
              "args": true,
            },
          ],
          "arrayIndices": [
            1,
          ],
          "basePath": "basePath",
          "error": undefined,
          "event": {
            "event": true,
          },
          "eventLog": [
            {
              "eventLog": true,
            },
          ],
          "globals": {
            "window": {
              "location": {
                "hash": "window.location.hash",
                "host": "window.location.host",
                "hostname": "window.location.hostname",
                "href": "window.location.href",
                "origin": "window.location.origin",
                "pathname": "window.location.pathname",
                "port": "window.location.port",
                "protocol": "window.location.protocol",
                "search": "window.location.search",
              },
            },
          },
          "home": {
            "configured": false,
            "pageId": "home.pageId",
          },
          "i18n": undefined,
          "input": true,
          "jsMap": undefined,
          "location": "location.1",
          "lowdefyApp": {
            "app": true,
          },
          "lowdefyGlobal": {
            "global": true,
          },
          "menus": [
            {
              "menus": true,
            },
          ],
          "methodName": undefined,
          "operatorPrefix": "_",
          "operators": {
            "_error": [MockFunction],
            "_init": [MockFunction],
            "_test": [MockFunction] {
              "calls": [Circular],
              "results": [
                {
                  "type": "return",
                  "value": "test",
                },
              ],
            },
          },
          "pageId": undefined,
          "params": {
            "params": true,
          },
          "parser": {
            "parse": [Function],
          },
          "pathParams": {
            "ticket_id": "1234",
          },
          "requests": [
            {
              "requests": true,
            },
          ],
          "runtime": "browser",
          "state": {
            "state": true,
          },
          "theme": undefined,
          "user": {
            "user": true,
          },
          "websockets": undefined,
        },
      ],
    ]
  `);
  expect(res.errors).toEqual([]);
});

test('forwards lowdefyApp into operator context', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new WebParser({ context, operators });
  parser.parse({ actions, args, arrayIndices, event, input, location });
  const lastCall = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(lastCall.lowdefyApp).toEqual({ app: true });
});

test('passes the context pathParams to operators', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new WebParser({ context, operators });
  parser.parse({ actions, args, arrayIndices, event, input, location });
  const lastCall = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(lastCall.pathParams).toEqual({ ticket_id: '1234' });
});

test('operator should be object with 1 key', () => {
  const input = { a: { _test: { params: true }, x: 1 } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('operatorPrefix invalid', () => {
  const input = { a: { _test: { params: true }, x: 1 } };
  const operatorPrefix = 'invalid';
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location, operatorPrefix });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('undefined operator', () => {
  const input = { a: { _id: { params: true } } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('operator errors', () => {
  const input = { a: { _error: { params: true } } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0].name).toBe('OperatorError');
  expect(res.errors[0]._message).toBe('Test error.');
  expect(res.errors[0].message).toBe('Test error. at location.');
  expect(res.errors[0].received).toEqual({ _error: { params: true } });
  expect(res.errors[0].location).toBe('location');
});

test('operator errors include configKey from ~k', () => {
  const input = { a: { _error: { params: true }, '~k': 'config-key-123' } };
  Object.defineProperty(input.a, '~k', {
    value: 'config-key-123',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0].name).toBe('OperatorError');
  expect(res.errors[0]._message).toBe('Test error.');
  expect(res.errors[0].received).toEqual({ _error: { params: true } });
  expect(res.errors[0].configKey).toBe('config-key-123');
});

test('operator errors preserve existing configKey', () => {
  const errorWithConfigKey = new Error('Pre-configured error');
  errorWithConfigKey.configKey = 'existing-key';
  const operatorsWithPreConfiguredError = {
    ...operators,
    _errorWithKey: vi.fn(() => {
      throw errorWithConfigKey;
    }),
  };
  const input = { a: { _errorWithKey: { params: true } } };
  Object.defineProperty(input.a, '~k', {
    value: 'new-key',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const parser = new WebParser({ context, operators: operatorsWithPreConfiguredError });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0].configKey).toBe('existing-key'); // Should preserve existing key
});

test('operator parser re-enters parse with the calling frame', () => {
  const frameOperators = {
    _nested: vi.fn(({ parser }) =>
      parser.parse({ args: ['nestedArg'], input: { __frame: true }, operatorPrefix: '__' })
    ),
    _frame: vi.fn(({ actions, args, arrayIndices, error, event, location }) => ({
      actions,
      args,
      arrayIndices,
      error,
      event,
      location,
    })),
  };
  const parser = new WebParser({ context, operators: frameOperators });
  const res = parser.parse({
    actions,
    arrayIndices,
    error: { caught: true },
    event,
    input: { _nested: true },
    location: 'location.$',
  });
  expect(res.errors).toEqual([]);
  expect(res.output.errors).toEqual([]);
  expect(res.output.output).toEqual({
    actions: [{ actions: true }],
    args: ['nestedArg'],
    arrayIndices: [1],
    error: { caught: true },
    event: { event: true },
    location: 'location.1',
  });
});

test('parse passes error to every operator call', () => {
  const caught = new Error('Caught.');
  const parser = new WebParser({ context, operators });
  parser.parse({ actions, error: caught, event, input: { a: { _test: true } }, location });
  const lastCall = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(lastCall.error).toBe(caught);
});
