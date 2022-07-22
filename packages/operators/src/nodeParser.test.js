/*
  Copyright 2020-2022 Lowdefy, Inc

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
import NodeParser from './nodeParser.js';

const args = [{ args: true }];

const operators = {
  _test: jest.fn(() => 'test'),
  _error: jest.fn(() => {
    throw new Error('Test error.');
  }),
  _error_cause: jest.fn(() => {
    throw new Error('Test error.', { cause: { id: 'some_id' } });
  }),
  _init: jest.fn(),
};

operators._init.init = jest.fn();

const payload = {
  payload: true,
};

const secrets = {
  secrets: true,
};

const user = {
  user: true,
};

describe('on server', () => {
  test('parse input undefined', () => {
    const parser = new NodeParser({ operators, payload });
    const res = parser.parse({});
    expect(res).toEqual();
  });

  test('parse args not array', () => {
    const input = {};
    const args = 'not an array';
    const parser = new NodeParser({ operators, payload });
    expect(() => parser.parse({ args, input })).toThrow('Operator parser args must be an array.');
  });

  test('operator returns value', () => {
    const input = { a: { _test: { params: true, _k_: 'a' }, _k_: 'b' }, _k_: 'c' };
    const parser = new NodeParser({ operators, payload, secrets, user });
    const res = parser.parse({ args, input });
    expect(res).toEqual({ a: 'test' });
    expect(operators._test.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "args": Array [
              Object {
                "args": true,
              },
            ],
            "arrayIndices": Array [],
            "env": undefined,
            "methodName": undefined,
            "operatorPrefix": "_",
            "operators": Object {
              "_error": [MockFunction],
              "_error_cause": [MockFunction],
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
            "parser": NodeParser {
              "build": undefined,
              "env": undefined,
              "operators": Object {
                "_error": [MockFunction],
                "_error_cause": [MockFunction],
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
              "payload": Object {
                "payload": true,
              },
              "secrets": Object {
                "secrets": true,
              },
              "user": Object {
                "user": true,
              },
            },
            "payload": Object {
              "payload": true,
            },
            "secrets": Object {
              "secrets": true,
            },
            "user": Object {
              "user": true,
            },
          },
        ],
      ]
    `);
  });

  test('operator should be object with 1 key', () => {
    const input = { a: { _test: { params: true, _k_: 'a' }, x: 1, _k_: 'b' }, _k_: 'c' };
    const parser = new NodeParser({ operators, payload, secrets, user });
    const res = parser.parse({ args, input });
    expect(res).toEqual({ a: { _test: { params: true }, x: 1 } });
  });

  test('operatorPrefix invalid', () => {
    const input = { a: { _test: { params: true, _k_: 'a' }, _k_: 'b' }, _k_: 'c' };
    const operatorPrefix = 'invalid';
    const parser = new NodeParser({ operators, payload, secrets, user });
    const res = parser.parse({ args, input, operatorPrefix });
    expect(res).toEqual({ a: { _test: { params: true } } });
  });

  test('undefined operator', () => {
    const input = { a: { _id: { params: true, _k_: 'a' }, _k_: 'b' }, _k_: 'c' };
    const parser = new NodeParser({ operators, payload, secrets, user });
    const res = parser.parse({ args, input });
    expect(res).toEqual({ a: { _id: { params: true } } });
  });

  test('operator errors', () => {
    const input = { a: { _error: { params: true } } };
    const parser = new NodeParser({ operators, payload, secrets, user });
    expect(() => parser.parse({ args, input })).toThrow('Test error.');
  });

  test('operator errors with cause', () => {
    const input = { a: { _error_cause: { params: true } } };
    const parser = new NodeParser({ operators, payload, secrets, user });
    expect(() => parser.parse({ args, input })).toThrow('Test error.');
  });

  test('operator should remove _k_ value', () => {
    const input = { a: { _test: { params: true, _k_: 'a' }, _k_: 'b' }, _k_: 'c' };
    const parser = new NodeParser({ operators, payload, secrets, user });
    const res = parser.parse({ args, input });
    expect(res).toEqual({ a: 'test' });
  });
});

describe('during build', () => {
  test('parse input undefined', () => {
    const parser = new NodeParser({ operators, payload, build: true });
    const res = parser.parse({});
    expect(res).toEqual();
  });

  test('parse args not array', () => {
    const input = {};
    const args = 'not an array';
    const parser = new NodeParser({ operators, payload, build: true });
    expect(() => parser.parse({ args, input })).toThrow('Operator parser args must be an array.');
  });

  test('operator returns value', () => {
    const input = { a: { _test: { params: true, _k_: 'a' }, _k_: 'b' }, _k_: 'c' };
    const parser = new NodeParser({ operators, payload, secrets, user, build: true });
    const res = parser.parse({ args, input });
    expect(res).toEqual({ a: 'test', _k_: 'c' });
  });

  test('operator should be object with 1 key', () => {
    const input = { a: { _test: { params: true, _k_: 'a' }, x: 1, _k_: 'b' }, _k_: 'c' };
    const parser = new NodeParser({ operators, payload, secrets, user, build: true });
    const res = parser.parse({ args, input });
    expect(res).toEqual(input);
  });

  test('operatorPrefix invalid', () => {
    const input = { a: { _test: { params: true, _k_: 'a' }, x: 1, _k_: 'b' }, _k_: 'c' };
    const operatorPrefix = 'invalid';
    const parser = new NodeParser({ operators, payload, secrets, user, build: true });
    const res = parser.parse({ args, input, operatorPrefix });
    expect(res).toEqual(input);
  });

  test('undefined operator', () => {
    const input = { a: { _id: { params: true, _k_: 'a' }, _k_: 'b' }, _k_: 'c' };
    const parser = new NodeParser({ operators, payload, secrets, user, build: true });
    const res = parser.parse({ args, input });
    expect(res).toEqual(input);
  });

  test('operator errors', () => {
    const input = { a: { _error: { params: true } } };
    const parser = new NodeParser({ operators, payload, secrets, user, build: true });
    expect(() => parser.parse({ args, input })).toThrow('Test error.');
  });

  test('operator errors with cause', () => {
    const input = { a: { _error_cause: { params: true } } };
    const parser = new NodeParser({ operators, payload, secrets, user });
    expect(() => parser.parse({ args, input })).toThrow('Test error.');
  });

  test('operator should remove _k_ value', () => {
    const input = { a: { _test: { params: true, _k_: 'p' }, _k_: 'x' }, _k_: 'm' };
    const parser = new NodeParser({ operators, payload, secrets, user });
    const res = parser.parse({ args, input });
    expect(res).toEqual({ a: 'test' });
  });

  test('build: operator should not remove _k_ value', () => {
    const input = { a: { _test: { params: true, _k_: 'p' }, _k_: 'x' }, _k_: 'm' };
    const parser = new NodeParser({ operators, payload, secrets, user, build: true });
    const res = parser.parse({ args, input });
    expect(res).toEqual({ a: 'test', _k_: 'm' });
  });
});
