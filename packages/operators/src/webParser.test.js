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

/* eslint-disable max-classes-per-file */

import { jest } from '@jest/globals';
import WebParser from './webParser.js';

console.error = () => {};

const args = [{ args: true }];

const actions = [{ actions: true }];

const arrayIndices = [1];

const context = {
  _internal: {
    lowdefy: {
      basePath: 'basePath',
      inputs: { id: true },
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
  requests: [{ requests: true }],
  state: { state: true },
};

const event = { event: true };

const location = 'location';

const operators = {
  _test: jest.fn(() => 'test'),
  _error: jest.fn(() => {
    throw new Error('Test error.');
  }),
  _init: jest.fn(),
};

operators._init.init = jest.fn();

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

test('operator returns value and removes ~k', () => {
  const input = { a: { _test: { params: true, '~k': 'c' }, '~k': 'b' }, '~k': 'a' };
  const location = 'location.$';
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual({ a: 'test' });
  expect(operators._test.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "actions": Array [
            Object {
              "actions": true,
            },
          ],
          "args": Array [
            Object {
              "args": true,
            },
          ],
          "arrayIndices": Array [
            1,
          ],
          "basePath": "basePath",
          "event": Object {
            "event": true,
          },
          "eventLog": Array [
            Object {
              "eventLog": true,
            },
          ],
          "globals": Object {
            "window": Object {
              "location": Object {
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
          "home": Object {
            "configured": false,
            "pageId": "home.pageId",
          },
          "input": true,
          "jsMap": undefined,
          "location": "location.1",
          "lowdefyGlobal": Object {
            "global": true,
          },
          "menus": Array [
            Object {
              "menus": true,
            },
          ],
          "methodName": undefined,
          "operatorPrefix": "_",
          "operators": Object {
            "_error": [MockFunction],
            "_init": [MockFunction],
            "_test": [MockFunction] {
              "calls": [Circular],
              "results": Array [
                Object {
                  "type": "return",
                  "value": "test",
                },
              ],
            },
          },
          "pageId": undefined,
          "params": Object {
            "params": true,
          },
          "parser": WebParser {
            "context": Object {
              "_internal": Object {
                "lowdefy": Object {
                  "_internal": Object {
                    "globals": Object {
                      "window": Object {
                        "location": Object {
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
                  },
                  "basePath": "basePath",
                  "home": Object {
                    "configured": false,
                    "pageId": "home.pageId",
                  },
                  "inputs": Object {
                    "id": true,
                  },
                  "lowdefyGlobal": Object {
                    "global": true,
                  },
                  "menus": Array [
                    Object {
                      "menus": true,
                    },
                  ],
                  "user": Object {
                    "user": true,
                  },
                },
              },
              "eventLog": Array [
                Object {
                  "eventLog": true,
                },
              ],
              "id": "id",
              "requests": Array [
                Object {
                  "requests": true,
                },
              ],
              "state": Object {
                "state": true,
              },
            },
            "operators": Object {
              "_error": [MockFunction],
              "_init": [MockFunction],
              "_test": [MockFunction] {
                "calls": [Circular],
                "results": Array [
                  Object {
                    "type": "return",
                    "value": "test",
                  },
                ],
              },
            },
            "parse": [Function],
          },
          "requests": Array [
            Object {
              "requests": true,
            },
          ],
          "runtime": "browser",
          "state": Object {
            "state": true,
          },
          "user": Object {
            "user": true,
          },
        },
      ],
    ]
  `);
  expect(res.errors).toEqual([]);
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
  expect(res.errors).toEqual([new Error('Test error.')]);
});
