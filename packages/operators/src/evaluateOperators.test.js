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

import { jest } from '@jest/globals';
import { ConfigError, OperatorError } from '@lowdefy/errors';

import evaluateOperators from './evaluateOperators.js';

const mockOperators = {
  _sum: jest.fn(({ params }) => params.reduce((a, b) => a + b, 0)),
  _if: jest.fn(({ params }) => (params.test ? params.then : params.else)),
  _env: jest.fn(({ env, params }) => env[params.key] ?? null),
  _echo: jest.fn(({ params }) => params),
  _error: jest.fn(() => {
    throw new Error('Test error.');
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('passthrough — no operators, output equals input', () => {
  const input = { a: 1, b: [2, 3], c: { d: 'hello' } };
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(res.output).toEqual({ a: 1, b: [2, 3], c: { d: 'hello' } });
  expect(res.errors).toEqual([]);
});

test('undefined input returns undefined output', () => {
  const res = evaluateOperators({ input: undefined, operators: mockOperators });
  expect(res.output).toBeUndefined();
  expect(res.errors).toEqual([]);
});

test('null input returns null output', () => {
  const res = evaluateOperators({ input: null, operators: mockOperators });
  expect(res.output).toBeNull();
  expect(res.errors).toEqual([]);
});

test('args must be an array', () => {
  expect(() =>
    evaluateOperators({ input: {}, operators: mockOperators, args: 'not array' })
  ).toThrow('Operator parser args must be an array.');
});

test('simple operator — _sum evaluates', () => {
  const input = { result: { _sum: [1, 2] } };
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(res.output).toEqual({ result: 3 });
  expect(res.errors).toEqual([]);
});

test('nested operators — bottom-up evaluation', () => {
  const input = {
    result: { _sum: [{ _sum: [1, 2] }, { _sum: [3, 4] }] },
  };
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(res.output).toEqual({ result: 10 });
  expect(res.errors).toEqual([]);
});

test('~dyn propagation — ~shallow bubbles up, parent operators NOT evaluated', () => {
  const input = {
    result: {
      _echo: { nested: { '~shallow': true, _ref: 'file.yaml' } },
    },
  };
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(mockOperators._echo).not.toHaveBeenCalled();
  expect(res.output.result['~dyn']).toBe(true);
});

test('dynamic identifier — operator is not evaluated, gets ~dyn', () => {
  const _state = jest.fn(() => 'state');
  const ops = { ...mockOperators, _state };
  const dynamicIdentifiers = new Set(['_state']);
  const input = { a: { _state: 'value' } };
  const res = evaluateOperators({ input, operators: ops, dynamicIdentifiers });
  expect(_state).not.toHaveBeenCalled();
  expect(res.output.a['~dyn']).toBe(true);
});

test('unknown operator — not in map gets ~dyn', () => {
  const input = { a: { _unknown: 'params' } };
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(res.output.a['~dyn']).toBe(true);
});

test('type boundary — ~dyn does NOT propagate past type in typeNames', () => {
  const _state = jest.fn(() => 'state');
  const ops = { ...mockOperators, _state };
  const dynamicIdentifiers = new Set(['_state']);
  const typeNames = new Set(['Button']);
  const input = {
    blocks: [
      {
        type: 'Button',
        properties: { label: { _state: 'buttonLabel' } },
      },
    ],
  };
  const res = evaluateOperators({
    input,
    operators: ops,
    dynamicIdentifiers,
    typeNames,
  });
  expect(res.output.blocks[0]['~dyn']).toBeUndefined();
  expect(res.output.blocks[0].properties['~dyn']).toBe(true);
  expect(res.output.blocks['~dyn']).toBeUndefined();
});

test('error collection — throwing operator produces OperatorError', () => {
  const input = { a: { _error: { params: true } } };
  Object.defineProperty(input.a, '~l', {
    value: 42,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(input.a, '~r', {
    value: 'ref-123',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]).toBeInstanceOf(OperatorError);
  expect(res.errors[0].message).toBe('Test error.');
  expect(res.errors[0].lineNumber).toBe(42);
  expect(res.errors[0].refId).toBe('ref-123');
});

test('ConfigError from operator is preserved', () => {
  const ops = {
    ...mockOperators,
    _configError: jest.fn(() => {
      throw new ConfigError('Invalid config value.');
    }),
  };
  const input = { a: { _configError: { params: true } } };
  Object.defineProperty(input.a, '~k', {
    value: 'config-key-789',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const res = evaluateOperators({ input, operators: ops });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]).toBeInstanceOf(ConfigError);
  expect(res.errors[0].message).toBe('Invalid config value.');
  expect(res.errors[0].configKey).toBe('config-key-789');
});

test('parser.parse is callable from within operators for recursive evaluation', () => {
  const ops = {
    _wrap: jest.fn(({ parser, params }) => {
      const { output } = parser.parse({ input: params });
      return { wrapped: output };
    }),
    _echo: jest.fn(({ params }) => params),
  };
  const input = { result: { _wrap: { inner: { _echo: 'hello' } } } };
  const res = evaluateOperators({ input, operators: ops });
  expect(res.output.result).toEqual({ wrapped: { inner: 'hello' } });
});

test('_build.* operators ignore dynamicIdentifiers', () => {
  const _state = jest.fn(() => 'state-result');
  const ops = { _state };
  const dynamicIdentifiers = new Set(['_state']);
  const input = { a: { '_build.state': 'value' } };
  const res = evaluateOperators({
    input,
    operators: ops,
    operatorPrefix: '_build.',
    dynamicIdentifiers,
  });
  expect(_state).toHaveBeenCalled();
  expect(res.output).toEqual({ a: 'state-result' });
});

test('_build.* operators ignore dynamic params — evaluates even with ~dyn in params', () => {
  const _echo = jest.fn(({ params }) => params);
  const ops = { _echo };
  const input = { a: { '_build.echo': { nested: 'value' } } };
  // Manually set ~dyn on the params object (configurable so setDynamicMarker can redefine)
  Object.defineProperty(input.a['_build.echo'], '~dyn', {
    value: true,
    enumerable: false,
    configurable: true,
  });
  const res = evaluateOperators({
    input,
    operators: ops,
    operatorPrefix: '_build.',
  });
  expect(_echo).toHaveBeenCalled();
  expect(res.output.a).toEqual({ nested: 'value' });
});

test('~r on operator objects — still evaluated', () => {
  const input = { a: { _echo: 'hello' } };
  Object.defineProperty(input.a, '~r', {
    value: 'ref-456',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(mockOperators._echo).toHaveBeenCalled();
  expect(res.output).toEqual({ a: 'hello' });
});

test('~r on non-operator objects — skipped', () => {
  const input = { a: { x: 1, y: 2 } };
  Object.defineProperty(input.a, '~r', {
    value: 'ref-789',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(res.output.a).toEqual({ x: 1, y: 2 });
});

test('env is passed to operators', () => {
  const input = { result: { _env: { key: 'MY_VAR' } } };
  const res = evaluateOperators({
    input,
    operators: mockOperators,
    env: { MY_VAR: 'hello' },
  });
  expect(res.output).toEqual({ result: 'hello' });
});

test('multi-key objects are not treated as operators', () => {
  const input = { a: { _sum: [1, 2], extra: true } };
  const res = evaluateOperators({ input, operators: mockOperators });
  expect(mockOperators._sum).not.toHaveBeenCalled();
  expect(res.output).toEqual({ a: { _sum: [1, 2], extra: true } });
});

test('deeply nested dynamic in array bubbles up through entire tree', () => {
  const _state = jest.fn(() => 'state');
  const ops = { ...mockOperators, _state };
  const dynamicIdentifiers = new Set(['_state']);
  const input = {
    items: [{ nested: [{ deep: { _state: 'value' } }] }],
  };
  const res = evaluateOperators({ input, operators: ops, dynamicIdentifiers });
  expect(res.output.items[0].nested[0].deep['~dyn']).toBe(true);
  expect(res.output.items[0].nested[0]['~dyn']).toBe(true);
  expect(res.output.items[0].nested['~dyn']).toBe(true);
  expect(res.output.items[0]['~dyn']).toBe(true);
  expect(res.output.items['~dyn']).toBe(true);
});

test('operator with dynamic params is not evaluated', () => {
  const _state = jest.fn(() => 'state');
  const ops = { ...mockOperators, _state };
  const dynamicIdentifiers = new Set(['_state']);
  const input = {
    result: { _if: { test: { _state: 'loading' }, then: 'yes', else: 'no' } },
  };
  const res = evaluateOperators({ input, operators: ops, dynamicIdentifiers });
  expect(mockOperators._if).not.toHaveBeenCalled();
  expect(res.output.result['~dyn']).toBe(true);
});

test('dynamic method is not evaluated and marked', () => {
  const _math = jest.fn(() => 'math result');
  const ops = { _math };
  const dynamicIdentifiers = new Set(['_math.random']);
  const input = { a: { '_math.random': {} } };
  const res = evaluateOperators({ input, operators: ops, dynamicIdentifiers });
  expect(_math).not.toHaveBeenCalled();
  expect(res.output.a['~dyn']).toBe(true);
});

test('nested type boundaries each reset independently', () => {
  const _state = jest.fn(() => 'state');
  const ops = { _state };
  const dynamicIdentifiers = new Set(['_state']);
  const typeNames = new Set(['Card', 'Button']);
  const input = {
    type: 'Card',
    areas: {
      content: {
        blocks: [{ type: 'Button', label: { _state: 'text' } }],
      },
    },
  };
  const res = evaluateOperators({
    input,
    operators: ops,
    dynamicIdentifiers,
    typeNames,
  });
  expect(res.output['~dyn']).toBeUndefined();
  expect(res.output.areas.content.blocks[0]['~dyn']).toBeUndefined();
  expect(res.output.areas.content.blocks[0].label['~dyn']).toBe(true);
});
