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

import BuildParser from './buildParser.js';

const args = [{ args: true }];

const operators = {
  _test: jest.fn(() => 'test'),
  _error: jest.fn(() => {
    throw new Error('Test error.');
  }),
  _init: jest.fn(),
};

operators._init.init = jest.fn();

const location = 'location';

const payload = {
  payload: true,
};

const secrets = {
  secrets: true,
};

const user = {
  user: true,
};

test('parse input undefined', () => {
  const parser = new BuildParser({ operators, payload });
  const res = parser.parse({});
  expect(res.output).toEqual();
  expect(res.errors).toEqual([]);
});

test('parse args not array', () => {
  const input = {};
  const args = 'not an array';
  const parser = new BuildParser({ operators, payload });
  expect(() => parser.parse({ args, input })).toThrow('Operator parser args must be an array.');
});

test('parse location not string', () => {
  const input = {};
  const location = [];
  const parser = new BuildParser({ operators, payload, secrets, user });
  expect(() => parser.parse({ args, input, location })).toThrow(
    'Operator parser location must be a string.'
  );
});

test('operator returns value', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new BuildParser({ operators, payload, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual({ a: 'test' });
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
          "location": "location",
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
          "params": Object {
            "params": true,
          },
          "parser": BuildParser {
            "dynamicIdentifiers": Set {},
            "env": undefined,
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
            "payload": Object {
              "payload": true,
            },
            "secrets": Object {
              "secrets": true,
            },
            "typeNames": Set {},
            "user": Object {
              "user": true,
            },
            "verbose": undefined,
          },
          "payload": Object {
            "payload": true,
          },
          "runtime": "node",
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
  expect(res.errors).toEqual([]);
});

test('operator should be object with 1 key', () => {
  const input = { a: { _test: { params: true }, x: 1 } };
  const parser = new BuildParser({ operators, payload, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('operatorPrefix invalid', () => {
  const input = { a: { _test: { params: true }, x: 1 } };
  const operatorPrefix = 'invalid';
  const parser = new BuildParser({ operators, payload, secrets, user });
  const res = parser.parse({ args, input, location, operatorPrefix });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('undefined operator', () => {
  const input = { a: { _id: { params: true } } };
  const parser = new BuildParser({ operators, payload, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('operator errors', () => {
  const input = { a: { _error: { params: true } } };
  const parser = new BuildParser({ operators, payload, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0].message).toBe(
    'Operator Error: Test error. Received: {"_error":{"params":true}} at location.'
  );
});

// ==================== hasDynamicMarker tests ====================

describe('hasDynamicMarker', () => {
  test('returns false for primitive values', () => {
    expect(BuildParser.hasDynamicMarker('string')).toBe(false);
    expect(BuildParser.hasDynamicMarker(123)).toBe(false);
    expect(BuildParser.hasDynamicMarker(null)).toBe(false);
    expect(BuildParser.hasDynamicMarker(undefined)).toBe(false);
    expect(BuildParser.hasDynamicMarker(true)).toBe(false);
  });

  test('returns false for plain object without marker', () => {
    expect(BuildParser.hasDynamicMarker({ a: 1, b: 2 })).toBe(false);
  });

  test('returns false for array without marker', () => {
    expect(BuildParser.hasDynamicMarker([1, 2, { a: 1 }])).toBe(false);
  });

  test('returns true for object with ~dyn marker', () => {
    const obj = { a: 1 };
    Object.defineProperty(obj, '~dyn', { value: true, enumerable: false });
    expect(BuildParser.hasDynamicMarker(obj)).toBe(true);
  });

  test('returns true for array with ~dyn marker', () => {
    const arr = [1, 2, 3];
    Object.defineProperty(arr, '~dyn', { value: true, enumerable: false });
    expect(BuildParser.hasDynamicMarker(arr)).toBe(true);
  });

  test('returns true for immediate child object with ~dyn marker', () => {
    const inner = { x: 1 };
    Object.defineProperty(inner, '~dyn', { value: true, enumerable: false });
    const outer = { a: 1, b: inner };
    expect(BuildParser.hasDynamicMarker(outer)).toBe(true);
  });

  test('returns false for deeply nested marker (only checks immediate children)', () => {
    // hasDynamicMarker only checks immediate children, not recursive
    // This is intentional: bubble-up happens bottom-up in reviver, so by the time
    // we check a parent, children should already have bubbled up their markers
    const deepest = { z: 1 };
    Object.defineProperty(deepest, '~dyn', { value: true, enumerable: false });
    const middle = { c: deepest }; // middle not marked
    const obj = { a: { b: middle } }; // checking obj -> a -> b -> c -> deepest
    expect(BuildParser.hasDynamicMarker(obj)).toBe(false);
  });

  test('returns true for array containing immediate child with ~dyn marker', () => {
    const markedObj = { x: 1 };
    Object.defineProperty(markedObj, '~dyn', { value: true, enumerable: false });
    expect(BuildParser.hasDynamicMarker([1, 'a', markedObj])).toBe(true);
  });

  test('returns true for object with immediate child array with ~dyn marker', () => {
    const markedArr = [1, 2];
    Object.defineProperty(markedArr, '~dyn', { value: true, enumerable: false });
    expect(BuildParser.hasDynamicMarker({ items: markedArr })).toBe(true);
  });
});

// ==================== setDynamicMarker tests ====================

describe('setDynamicMarker', () => {
  test('sets non-enumerable ~dyn property on object', () => {
    const obj = { a: 1 };
    const result = BuildParser.setDynamicMarker(obj);
    expect(result).toBe(obj); // Returns same object
    expect(result['~dyn']).toBe(true);
    expect(Object.keys(result)).toEqual(['a']); // ~dyn is not enumerable
  });

  test('sets non-enumerable ~dyn property on array', () => {
    const arr = [1, 2, 3];
    const result = BuildParser.setDynamicMarker(arr);
    expect(result).toBe(arr);
    expect(result['~dyn']).toBe(true);
    expect(Object.keys(result)).toEqual(['0', '1', '2']); // ~dyn not in keys
  });

  test('marker is excluded from JSON.stringify', () => {
    const obj = { a: 1, b: 2 };
    BuildParser.setDynamicMarker(obj);
    expect(JSON.stringify(obj)).toBe('{"a":1,"b":2}');
  });

  test('returns primitives unchanged', () => {
    expect(BuildParser.setDynamicMarker('string')).toBe('string');
    expect(BuildParser.setDynamicMarker(123)).toBe(123);
    expect(BuildParser.setDynamicMarker(null)).toBe(null);
    expect(BuildParser.setDynamicMarker(undefined)).toBe(undefined);
  });
});

// ==================== Dynamic operator detection tests ====================

describe('dynamic operator detection', () => {
  test('dynamic operator is not evaluated and marked', () => {
    const _static = jest.fn(() => 'static result');
    const _dynamic = jest.fn(() => 'dynamic result');
    const ops = { _static, _dynamic };
    const dynamicIdentifiers = new Set(['_dynamic']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = { a: { _dynamic: 'params' } };
    const res = parser.parse({ input, location });

    expect(_dynamic).not.toHaveBeenCalled();
    expect(res.output.a).toEqual({ _dynamic: 'params' });
    expect(res.output.a['~dyn']).toBe(true);
  });

  test('static operator is evaluated normally', () => {
    const _static = jest.fn(() => 'static result');
    const _dynamic = jest.fn(() => 'dynamic result');
    const ops = { _static, _dynamic };
    const dynamicIdentifiers = new Set(['_dynamic']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = { a: { _static: 'params' } };
    const res = parser.parse({ input, location });

    expect(_static).toHaveBeenCalled();
    expect(res.output).toEqual({ a: 'static result' });
  });

  test('dynamic method is not evaluated and marked', () => {
    const _math = jest.fn(() => 'math result');
    const ops = { _math };
    const dynamicIdentifiers = new Set(['_math.random']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = { a: { '_math.random': {} } };
    const res = parser.parse({ input, location });

    expect(_math).not.toHaveBeenCalled();
    expect(res.output.a).toEqual({ '_math.random': {} });
    expect(res.output.a['~dyn']).toBe(true);
  });

  test('static method on same operator is evaluated', () => {
    const _math = jest.fn(() => 42);
    const ops = { _math };
    const dynamicIdentifiers = new Set(['_math.random']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = { a: { '_math.abs': -5 } };
    const res = parser.parse({ input, location });

    expect(_math).toHaveBeenCalled();
    expect(res.output).toEqual({ a: 42 });
  });

  test('multiple dynamic identifiers are all detected', () => {
    const _state = jest.fn(() => 'state');
    const _request = jest.fn(() => 'request');
    const _get = jest.fn(() => 'get');
    const ops = { _state, _request, _get };
    const dynamicIdentifiers = new Set(['_state', '_request']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = {
      a: { _state: 'x' },
      b: { _request: 'y' },
      c: { _get: 'z' },
    };
    const res = parser.parse({ input, location });

    expect(_state).not.toHaveBeenCalled();
    expect(_request).not.toHaveBeenCalled();
    expect(_get).toHaveBeenCalled();
    expect(res.output.a['~dyn']).toBe(true);
    expect(res.output.b['~dyn']).toBe(true);
    expect(res.output.c).toBe('get');
  });
});

// ==================== Dynamic content bubble-up tests ====================

describe('dynamic content bubble-up', () => {
  test('operator with dynamic params is not evaluated', () => {
    const _if = jest.fn(() => 'if result');
    const _state = jest.fn(() => 'state');
    const ops = { _if, _state };
    const dynamicIdentifiers = new Set(['_state']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = {
      result: { _if: { test: { _state: 'loading' }, then: 'yes', else: 'no' } },
    };
    const res = parser.parse({ input, location });

    expect(_state).not.toHaveBeenCalled();
    expect(_if).not.toHaveBeenCalled();
    expect(res.output.result['~dyn']).toBe(true);
  });

  test('dynamic marker bubbles up through nested structures', () => {
    const _get = jest.fn(() => 'get result');
    const _state = jest.fn(() => 'state');
    const ops = { _get, _state };
    const dynamicIdentifiers = new Set(['_state']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = {
      outer: {
        middle: {
          inner: { _state: 'value' },
        },
      },
    };
    const res = parser.parse({ input, location });

    expect(res.output.outer['~dyn']).toBe(true);
    expect(res.output.outer.middle['~dyn']).toBe(true);
    expect(res.output.outer.middle.inner['~dyn']).toBe(true);
  });

  test('sibling static content is still evaluated', () => {
    const _get = jest.fn(() => 'static value');
    const _state = jest.fn(() => 'dynamic');
    const ops = { _get, _state };
    const dynamicIdentifiers = new Set(['_state']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = {
      static: { _get: 'path' },
      dynamic: { _state: 'key' },
    };
    const res = parser.parse({ input, location });

    expect(_get).toHaveBeenCalled();
    expect(res.output.static).toBe('static value');
    expect(res.output.dynamic['~dyn']).toBe(true);
  });

  test('nested operator with dynamic sibling is not evaluated', () => {
    const _concat = jest.fn((args) => args.params.join(''));
    const _state = jest.fn(() => 'state');
    const ops = { _concat, _state };
    const dynamicIdentifiers = new Set(['_state']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = {
      text: { _concat: ['Hello ', { _state: 'name' }] },
    };
    const res = parser.parse({ input, location });

    expect(_concat).not.toHaveBeenCalled();
    expect(res.output.text['~dyn']).toBe(true);
  });
});

// ==================== Type boundary reset tests ====================

describe('type boundary reset', () => {
  test('type boundary prevents bubble-up to parent', () => {
    const _state = jest.fn(() => 'state');
    const ops = { _state };
    const dynamicIdentifiers = new Set(['_state']);
    const typeNames = new Set(['Button', 'TextInput']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers, typeNames });
    const input = {
      blocks: [
        {
          type: 'Button',
          properties: { label: { _state: 'buttonLabel' } },
        },
      ],
    };
    const res = parser.parse({ input, location });

    // The block itself should NOT have ~dyn (type boundary reset)
    expect(res.output.blocks[0]['~dyn']).toBeUndefined();
    // But the properties inside still have the marker
    expect(res.output.blocks[0].properties['~dyn']).toBe(true);
    // Parent array should NOT be marked
    expect(res.output.blocks['~dyn']).toBeUndefined();
  });

  test('sibling blocks are independent after type boundary', () => {
    const _state = jest.fn(() => 'state');
    const _get = jest.fn(() => 'static');
    const ops = { _state, _get };
    const dynamicIdentifiers = new Set(['_state']);
    const typeNames = new Set(['Button']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers, typeNames });
    const input = {
      blocks: [
        { type: 'Button', label: { _state: 'dynamic' } },
        { type: 'Button', label: { _get: 'static.path' } },
      ],
    };
    const res = parser.parse({ input, location });

    expect(res.output.blocks[0].label['~dyn']).toBe(true);
    expect(res.output.blocks[1].label).toBe('static');
    expect(res.output.blocks['~dyn']).toBeUndefined();
  });

  test('non-matching type does not reset boundary', () => {
    const _state = jest.fn(() => 'state');
    const ops = { _state };
    const dynamicIdentifiers = new Set(['_state']);
    const typeNames = new Set(['Button']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers, typeNames });
    const input = {
      wrapper: {
        type: 'UnknownType',
        content: { _state: 'value' },
      },
    };
    const res = parser.parse({ input, location });

    // UnknownType is not in typeNames, so bubble-up continues
    expect(res.output.wrapper['~dyn']).toBe(true);
  });

  test('nested type boundaries each reset independently', () => {
    const _state = jest.fn(() => 'state');
    const ops = { _state };
    const dynamicIdentifiers = new Set(['_state']);
    const typeNames = new Set(['Card', 'Button']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers, typeNames });
    const input = {
      type: 'Card',
      areas: {
        content: {
          blocks: [{ type: 'Button', label: { _state: 'text' } }],
        },
      },
    };
    const res = parser.parse({ input, location });

    // Card type boundary resets at top level
    expect(res.output['~dyn']).toBeUndefined();
    // Button type boundary resets for nested block
    expect(res.output.areas.content.blocks[0]['~dyn']).toBeUndefined();
    // But label inside Button is still marked
    expect(res.output.areas.content.blocks[0].label['~dyn']).toBe(true);
  });

  test('empty typeNames Set has no effect', () => {
    const _state = jest.fn(() => 'state');
    const ops = { _state };
    const dynamicIdentifiers = new Set(['_state']);
    const typeNames = new Set();

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers, typeNames });
    const input = {
      type: 'Button',
      label: { _state: 'text' },
    };
    const res = parser.parse({ input, location });

    // With no typeNames, type boundary doesn't reset
    expect(res.output['~dyn']).toBe(true);
  });
});

// ==================== Edge cases ====================

describe('edge cases', () => {
  test('handles empty dynamicIdentifiers gracefully', () => {
    const _test = jest.fn(() => 'result');
    const ops = { _test };

    const parser = new BuildParser({ operators: ops });
    const input = { a: { _test: 'params' } };
    const res = parser.parse({ input, location });

    expect(_test).toHaveBeenCalled();
    expect(res.output).toEqual({ a: 'result' });
  });

  test('handles ~r reference marker without interference', () => {
    const _test = jest.fn(() => 'result');
    const ops = { _test };

    const parser = new BuildParser({ operators: ops });
    // ~r is typically set by the build process as a non-enumerable property
    const input = { a: 1 };
    Object.defineProperty(input, '~r', {
      value: 'ref-id',
      enumerable: false,
      writable: true,
      configurable: true,
    });
    const res = parser.parse({ input, location });

    // Objects with ~r are returned early, no operator processing
    expect(res.output.a).toBe(1);
    expect(res.output['~r']).toBe('ref-id');
  });

  test('operator returning object does not get marked', () => {
    const _build = jest.fn(() => ({ computed: true }));
    const ops = { _build };

    const parser = new BuildParser({ operators: ops });
    const input = { result: { _build: {} } };
    const res = parser.parse({ input, location });

    expect(res.output.result).toEqual({ computed: true });
    expect(res.output.result['~dyn']).toBeUndefined();
  });

  test('deeply nested dynamic in array bubbles up through entire tree', () => {
    const _state = jest.fn(() => 'state');
    const ops = { _state };
    const dynamicIdentifiers = new Set(['_state']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = {
      items: [{ nested: [{ deep: { _state: 'value' } }] }],
    };
    const res = parser.parse({ input, location });

    // Dynamic marker bubbles up through objects and arrays
    expect(res.output.items[0].nested[0].deep['~dyn']).toBe(true);
    expect(res.output.items[0].nested[0]['~dyn']).toBe(true);
    expect(res.output.items[0].nested['~dyn']).toBe(true);
    expect(res.output.items[0]['~dyn']).toBe(true);
    expect(res.output.items['~dyn']).toBe(true);
  });

  test('custom operatorPrefix with dynamic detection', () => {
    const _state = jest.fn(() => 'state');
    const ops = { _state };
    const dynamicIdentifiers = new Set(['_state']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = { a: { $state: 'value' } };
    const res = parser.parse({ input, location, operatorPrefix: '$' });

    expect(_state).not.toHaveBeenCalled();
    expect(res.output.a['~dyn']).toBe(true);
  });

  test('multiple dynamic operators in same object do not duplicate marking', () => {
    const _state = jest.fn(() => 'state');
    const _request = jest.fn(() => 'request');
    const ops = { _state, _request };
    const dynamicIdentifiers = new Set(['_state', '_request']);

    const parser = new BuildParser({ operators: ops, dynamicIdentifiers });
    const input = {
      container: {
        a: { _state: 'x' },
        b: { _request: 'y' },
      },
    };
    const res = parser.parse({ input, location });

    expect(res.output.container['~dyn']).toBe(true);
    expect(res.output.container.a['~dyn']).toBe(true);
    expect(res.output.container.b['~dyn']).toBe(true);
  });
});
