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
import WebParser from './webParser.js';

console.error = () => {};

const args = [{ args: true }];

const actions = [{ actions: true }];

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

test('parse input undefined', async () => {
  const parser = new WebParser({ context, operators });
  await parser.init();
  const res = parser.parse({});
  expect(res.output).toEqual();
  expect(res.errors).toEqual([]);
});

test('context._internal.lowdefy not object', async () => {
  const context = {
    _internal: {
      lowdefy: 'not object',
    },
    eventLog: [{ eventLog: true }],
    id: 'id',
    requests: [{ requests: true }],
    state: { state: true },
  };
  const parser = new WebParser({ context, operators });
  await expect(() => parser.init()).rejects.toThrow('context._internal.lowdefy must be an object.');
});

test('parse args not array', async () => {
  const input = {};
  const args = 'not an array';
  const parser = new WebParser({ context, operators });
  await parser.init();
  expect(() => parser.parse({ args, input })).toThrow('Operator parser args must be an array.');
});

test('parse event not object', async () => {
  const input = {};
  const event = 'not an array';
  const parser = new WebParser({ context, operators });
  await parser.init();
  expect(() => parser.parse({ event, input })).toThrow('Operator parser event must be a object.');
});

test('parse location not string', async () => {
  const input = {};
  const location = [];
  const parser = new WebParser({ context, operators });
  await parser.init();
  expect(() => parser.parse({ args, input, location })).toThrow(
    'Operator parser location must be a string.'
  );
});

test('operator returns value', async () => {
  const input = { a: { _test: { params: true } } };
  const location = 'location.$';
  const parser = new WebParser({ context, operators });
  await parser.init();
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
          "context": Object {
            "_internal": Object {
              "lowdefy": Object {
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
                "urlQuery": Object {
                  "urlQuery": true,
                },
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
          "env": "web",
          "event": Object {
            "event": true,
          },
          "eventLog": Array [
            Object {
              "eventLog": true,
            },
          ],
          "input": true,
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
          "params": Object {
            "params": true,
          },
          "parser": WebParser {
            "context": Object {
              "_internal": Object {
                "lowdefy": Object {
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
                  "urlQuery": Object {
                    "urlQuery": true,
                  },
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
            "init": [Function],
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
          "state": Object {
            "state": true,
          },
          "urlQuery": Object {
            "urlQuery": true,
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

test('context._internal.lowdefy empty object', async () => {
  const context = {
    _internal: {
      lowdefy: {},
    },
    eventLog: [{ eventLog: true }],
    id: 'id',
    requests: [{ requests: true }],
    state: { state: true },
  };
  const input = { a: { _test: { params: true } } };
  const parser = new WebParser({ context, operators });
  await parser.init();
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
          "context": Object {
            "_internal": Object {
              "lowdefy": Object {},
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
          "env": "web",
          "event": Object {
            "event": true,
          },
          "eventLog": Array [
            Object {
              "eventLog": true,
            },
          ],
          "input": Object {},
          "location": "location",
          "lowdefyGlobal": Object {},
          "menus": Object {},
          "methodName": undefined,
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
          "params": Object {
            "params": true,
          },
          "parser": WebParser {
            "context": Object {
              "_internal": Object {
                "lowdefy": Object {},
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
            "init": [Function],
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
          "state": Object {
            "state": true,
          },
          "urlQuery": Object {},
          "user": Object {},
        },
      ],
    ]
  `);
  expect(res.errors).toEqual([]);
});

test('operator should be object with 1 key', async () => {
  const input = { a: { _test: { params: true }, x: 1 } };
  const parser = new WebParser({ context, operators });
  await parser.init();
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('undefined operator', async () => {
  const input = { a: { _id: { params: true } } };
  const parser = new WebParser({ context, operators });
  await parser.init();
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('operator errors', async () => {
  const input = { a: { _error: { params: true } } };
  const parser = new WebParser({ context, operators });
  await parser.init();
  const res = parser.parse({ actions, args, arrayIndices, event, input, location });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toEqual([new Error('Test error.')]);
});

test('operator init', async () => {
  const parser = new WebParser({ context, operators });
  await parser.init();
  expect(operators._init.init).toHaveBeenCalledTimes(1);
});
