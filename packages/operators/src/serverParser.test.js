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
import { jest } from '@jest/globals';

import { ConfigError, OperatorError } from '@lowdefy/errors';

import ServerParser from './serverParser.js';

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

const state = {
  state: true,
};

const steps = {
  steps: true,
};

const user = {
  user: true,
};

test('parse input undefined', () => {
  const parser = new ServerParser({ operators });
  const res = parser.parse({});
  expect(res.output).toEqual();
  expect(res.errors).toEqual([]);
});

test('parse args not array', () => {
  const input = {};
  const args = 'not an array';
  const parser = new ServerParser({ operators });
  expect(() => parser.parse({ args, input })).toThrow('Operator parser args must be an array.');
});

test('parse location not string', () => {
  const input = {};
  const location = [];
  const parser = new ServerParser({ operators, secrets, user });
  expect(() => parser.parse({ args, input, location })).toThrow(
    'Operator parser location must be a string.'
  );
});

test('operator returns value with ~k present', () => {
  const input = { a: { _test: { params: true, '~k': 'c' }, '~k': 'b' }, '~k': 'a' };
  const parser = new ServerParser({ operators, secrets, user });
  const res = parser.parse({ args, input, location, payload, state, steps });
  expect(res.output).toEqual({ a: 'test' });
  expect(operators._test.mock.calls.length).toBe(1);
  const operatorContext = operators._test.mock.calls[0][0];
  expect(operatorContext.args).toEqual(args);
  expect(operatorContext.arrayIndices).toEqual([]);
  expect(operatorContext.env).toBeUndefined();
  expect(operatorContext.items).toBeUndefined();
  expect(operatorContext.jsMap).toBeUndefined();
  expect(operatorContext.location).toBe('location');
  expect(operatorContext.methodName).toBeUndefined();
  expect(operatorContext.operatorPrefix).toBe('_');
  expect(operatorContext.params).toEqual({ params: true });
  expect(operatorContext.payload).toEqual({ payload: true });
  expect(operatorContext.runtime).toBe('node');
  expect(operatorContext.secrets).toEqual({ secrets: true });
  expect(operatorContext.state).toEqual({ state: true });
  expect(operatorContext.steps).toEqual({ steps: true });
  expect(operatorContext.user).toEqual({ user: true });
  expect(operatorContext.parser.parse).toBeInstanceOf(Function);
  expect(res.errors).toEqual([]);
});

test('forwards lowdefyApp into operator context', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new ServerParser({
    operators,
    secrets,
    user,
    lowdefyApp: { slug: 'my-app' },
  });
  parser.parse({ args, input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.lowdefyApp).toEqual({ slug: 'my-app' });
});

test('lowdefyApp absent defaults to undefined in operator context', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new ServerParser({ operators, secrets, user });
  parser.parse({ args, input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.lowdefyApp).toBeUndefined();
});

test('operator should be object with 1 key', () => {
  const input = { a: { _test: { params: true }, x: 1 } };
  const parser = new ServerParser({ operators, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('operatorPrefix invalid', () => {
  const input = { a: { _test: { params: true }, x: 1 } };
  const operatorPrefix = 'invalid';
  const parser = new ServerParser({ operators, secrets, user });
  const res = parser.parse({ args, input, location, operatorPrefix });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('undefined operator', () => {
  const input = { a: { _id: { params: true } } };
  const parser = new ServerParser({ operators, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual(input);
  expect(res.errors).toEqual([]);
});

test('operator errors', () => {
  const input = { a: { _error: { params: true } } };
  const parser = new ServerParser({ operators, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]).toBeInstanceOf(OperatorError);
  expect(res.errors[0].name).toBe('OperatorError');
  expect(res.errors[0]._message).toBe('Test error.');
  expect(res.errors[0].message).toBe('Test error. at location.');
  expect(res.errors[0].received).toEqual({ _error: { params: true } });
});

test('operator errors include configKey from ~k', () => {
  const input = { a: { _error: { params: true } } };
  Object.defineProperty(input.a, '~k', {
    value: 'config-key-456',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const parser = new ServerParser({ operators, secrets, user });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]).toBeInstanceOf(OperatorError);
  expect(res.errors[0].name).toBe('OperatorError');
  expect(res.errors[0]._message).toBe('Test error.');
  expect(res.errors[0].received).toEqual({ _error: { params: true } });
  expect(res.errors[0].configKey).toBe('config-key-456');
});

test('operator errors preserve existing configKey', () => {
  const errorWithConfigKey = new Error('Pre-configured error');
  errorWithConfigKey.configKey = 'existing-key';
  const operatorsWithPreConfiguredError = {
    ...operators,
    _errorWithKey: jest.fn(() => {
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
  const parser = new ServerParser({
    operators: operatorsWithPreConfiguredError,
    secrets,
    user,
  });
  const res = parser.parse({ args, input, location });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]).toBeInstanceOf(OperatorError);
  expect(res.errors[0].configKey).toBe('existing-key');
});

test('ConfigError from operator is preserved', () => {
  const operatorsWithConfigError = {
    ...operators,
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
  const parser = new ServerParser({
    operators: operatorsWithConfigError,
    secrets,
    user,
  });
  const res = parser.parse({ args, input, location });
  expect(res.output).toEqual({ a: null });
  expect(res.errors.length).toBe(1);
  expect(res.errors[0]).toBeInstanceOf(ConfigError);
  expect(res.errors[0].name).toBe('ConfigError');
  expect(res.errors[0].message).toBe('Invalid config value.');
  expect(res.errors[0].configKey).toBe('config-key-789');
});

test('parse forwards arrayIndices to operators', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new ServerParser({ operators, secrets, user });
  parser.parse({ arrayIndices: [2, 0], input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.arrayIndices).toEqual([2, 0]);
});

test('parse defaults arrayIndices to an empty array', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new ServerParser({ operators, secrets, user });
  parser.parse({ input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.arrayIndices).toEqual([]);
});

test('operator parser re-enters parse with the calling frame', () => {
  const frameOperators = {
    _nested: jest.fn(({ parser }) =>
      parser.parse({ args: ['nestedArg'], input: { __frame: true }, operatorPrefix: '__' })
    ),
    _frame: jest.fn(({ args, arrayIndices, items, location, payload, state, steps }) => ({
      args,
      arrayIndices,
      items,
      location,
      payload,
      state,
      steps,
    })),
  };
  const items = { row: 1 };
  const parser = new ServerParser({ operators: frameOperators, secrets, user });
  const res = parser.parse({
    arrayIndices: [3],
    input: { _nested: true },
    items,
    location,
    payload,
    state,
    steps,
  });
  expect(res.errors).toEqual([]);
  expect(res.output.errors).toEqual([]);
  expect(res.output.output).toEqual({
    args: ['nestedArg'],
    arrayIndices: [3],
    items: { row: 1 },
    location: 'location',
    payload: { payload: true },
    state: { state: true },
    steps: { steps: true },
  });
});

test('operator parser call options override the calling frame', () => {
  const frameOperators = {
    _nested: jest.fn(({ parser }) =>
      parser.parse({ input: { __frame: true }, operatorPrefix: '__', state: { override: true } })
    ),
    _frame: jest.fn(({ state }) => state),
  };
  const parser = new ServerParser({ operators: frameOperators, secrets, user });
  const res = parser.parse({ input: { _nested: true }, location, state });
  expect(res.output.output).toEqual({ override: true });
});

function createDataOperators(data) {
  return {
    _data: jest.fn(() => data),
    _get: jest.fn(() => data),
    _object: jest.fn(() => data),
  };
}

test('parse with literalData rejects an operator result that carries an operator', () => {
  const parser = new ServerParser({
    operators: createDataOperators([{ properties: { html: { _request: 'secret' } } }]),
  });
  const res = parser.parse({ input: { a: { _data: true } }, location, literalData: true });
  expect(res.output).toEqual({ a: null });
  expect(res.errors[0]).toBeInstanceOf(ConfigError);
  expect(res.errors[0].message).toBe(
    'Data returned by "_data" contains the operator "_request" at "0.properties.html". Operators in endpoint data do not run in Dynamic block content. Write client operators in the endpoint\'s :return config instead.'
  );
});

test('parse with literalData allows an operator result without operators', () => {
  const data = [{ properties: { title: 'Plain', meta: { _id: 1 }, both: { _a: 1, b: 2 } } }];
  const parser = new ServerParser({ operators: createDataOperators(data) });
  const res = parser.parse({ input: { a: { _data: true } }, location, literalData: true });
  expect(res.errors).toEqual([]);
  expect(res.output).toEqual({ a: data });
});

test('parse with literalData leaves results of pass-through operators unchecked', () => {
  const parser = new ServerParser({ operators: createDataOperators({ __state: 'x' }) });
  const res = parser.parse({
    input: { a: { _get: true }, b: { '_object.assign': [] } },
    location,
    literalData: true,
  });
  expect(res.errors).toEqual([]);
  expect(res.output).toEqual({ a: { __state: 'x' }, b: { __state: 'x' } });
});

test('parse with literalData checks _object methods that build keys from data', () => {
  const parser = new ServerParser({ operators: createDataOperators({ _request: 'x' }) });
  const res = parser.parse({
    input: { a: { '_object.fromEntries': [] } },
    location,
    literalData: true,
  });
  expect(res.errors[0].message).toContain('Data returned by "_object.fromEntries"');
});

test('parse without literalData does not check operator results', () => {
  const parser = new ServerParser({ operators: createDataOperators({ _request: 'x' }) });
  const res = parser.parse({ input: { a: { _data: true } }, location });
  expect(res.errors).toEqual([]);
  expect(res.output).toEqual({ a: { _request: 'x' } });
});
