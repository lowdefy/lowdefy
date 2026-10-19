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
import { serializer, type } from '@lowdefy/helpers';

import createLiteralData from './createLiteralData.js';
import findDataOrigin from './findDataOrigin.js';
import createContentHasher from './createContentHasher.js';
import getFromObject from './getFromObject.js';
import isNestedDeeperThan from './isNestedDeeperThan.js';
import MAX_DATA_DEPTH from './maxDataDepth.js';
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

test('forwards organization into operator context', () => {
  const input = { a: { _test: { params: true } } };
  const organization = {
    policy: 'pinned',
    pinned: { id: 'org_1', slug: 'default', name: 'default' },
  };
  const parser = new ServerParser({
    operators,
    secrets,
    user,
    organization,
  });
  parser.parse({ args, input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.organization).toEqual(organization);
});

test('organization absent defaults to undefined in operator context', () => {
  const input = { a: { _test: { params: true } } };
  const parser = new ServerParser({ operators, secrets, user });
  parser.parse({ args, input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.organization).toBeUndefined();
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

test('parse forwards error to operators', () => {
  const input = { a: { _test: { params: true } } };
  const error = new Error('Caught error.');
  const parser = new ServerParser({ operators, secrets, user });
  parser.parse({ error, input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.error).toBe(error);
});

test('parse forwards agent to operators', () => {
  const input = { a: { _test: { params: true } } };
  const agent = { id: 'support_agent', conversationId: 'conv_1' };
  const parser = new ServerParser({ operators, secrets, user });
  parser.parse({ agent, input, location });
  const operatorContext = operators._test.mock.calls[operators._test.mock.calls.length - 1][0];
  expect(operatorContext.agent).toBe(agent);
});

test('operator parser re-enters parse with the calling agent', () => {
  const agent = { id: 'support_agent', conversationId: 'conv_1' };
  const frameOperators = {
    _nested: jest.fn(({ parser }) =>
      parser.parse({ input: { __frame: true }, operatorPrefix: '__' })
    ),
    _frame: jest.fn(() => null),
  };
  const parser = new ServerParser({ operators: frameOperators, secrets, user });
  parser.parse({ agent, input: { _nested: true }, location });
  expect(frameOperators._frame.mock.calls[0][0].agent).toBe(agent);
});

test('operator parser re-enters parse with the calling error', () => {
  const error = new Error('Caught error.');
  const frameOperators = {
    _nested: jest.fn(({ parser }) =>
      parser.parse({ input: { __frame: true }, operatorPrefix: '__' })
    ),
    _frame: jest.fn(() => null),
  };
  const parser = new ServerParser({ operators: frameOperators, secrets, user });
  parser.parse({ error, input: { _nested: true }, location });
  expect(frameOperators._frame.mock.calls[0][0].error).toBe(error);
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
  const res = parser.parse({
    input: { a: { _data: true } },
    location,
    literalData: createLiteralData({}),
  });
  expect(res.output).toEqual({ a: null });
  expect(res.errors[0]).toBeInstanceOf(ConfigError);
  expect(res.errors[0].message).toBe(
    'Data returned by "_data" contains the operator "_request" at "0.properties.html". Operators in endpoint data do not run in Dynamic block content. Write client operators in the endpoint\'s :return config instead.'
  );
});

test('parse with literalData allows an operator result without operators', () => {
  const data = [{ properties: { title: 'Plain', meta: { _id: 1 }, both: { _a: 1, b: 2 } } }];
  const parser = new ServerParser({ operators: createDataOperators(data) });
  const res = parser.parse({
    input: { a: { _data: true } },
    location,
    literalData: createLiteralData({}),
  });
  expect(res.errors).toEqual([]);
  expect(res.output).toEqual({ a: data });
});

test('parse with literalData leaves results of pass-through operators unchecked', () => {
  const parser = new ServerParser({ operators: createDataOperators({ __state: 'x' }) });
  const res = parser.parse({
    input: { a: { _get: true }, b: { '_object.assign': [] } },
    location,
    literalData: createLiteralData({}),
  });
  expect(res.errors).toEqual([]);
  expect(res.output).toEqual({ a: { __state: 'x' }, b: { __state: 'x' } });
});

test('parse with literalData checks _object methods that build keys from data', () => {
  const parser = new ServerParser({ operators: createDataOperators({ _request: 'x' }) });
  const res = parser.parse({
    input: { a: { '_object.fromEntries': [] } },
    location,
    literalData: createLiteralData({}),
  });
  expect(res.errors[0].message).toContain('Data returned by "_object.fromEntries"');
});

test('parse without literalData does not check operator results', () => {
  const parser = new ServerParser({ operators: createDataOperators({ _request: 'x' }) });
  const res = parser.parse({ input: { a: { _data: true } }, location });
  expect(res.errors).toEqual([]);
  expect(res.output).toEqual({ a: { _request: 'x' } });
});

test("parse with literalData lets a validated step's blocks through as config", () => {
  const steps = {
    check: { blocks: [{ html: { _state: 'x' } }] },
    raw: { blocks: [{ _state: 'y' }] },
  };
  const operators = { _step: ({ params }) => steps[params.split('.')[0]][params.split('.')[1]] };
  const parser = new ServerParser({ operators });
  const literalData = createLiteralData({});
  literalData.validatedStepIds.add('check');
  const res = parser.parse({
    input: { a: { _step: 'check.blocks' }, b: { _step: 'raw.blocks' } },
    location,
    literalData,
  });
  expect(res.output.a).toEqual([{ html: { _state: 'x' } }]);
  expect(res.errors[0].message).toContain('Data returned by "_step"');
});

test.each([
  ['beside an undefined value', [{ html: { _request: 'secret', note: undefined } }], '0.html'],
  [
    'inside an error',
    serializer.deserialize([{ '~e': { name: 'Error', message: { _request: 'secret' } } }]),
    '0.~e.message',
  ],
])('parse with literalData rejects an operator %s in the form the page sends', (_, data, path) => {
  const parser = new ServerParser({ operators: createDataOperators(data) });
  const res = parser.parse({
    input: { a: { _data: true } },
    location,
    literalData: createLiteralData({}),
  });
  expect(res.errors[0].message).toContain(`contains the operator "_request" at "${path}"`);
});

class Hider {
  constructor() {
    this.x = { _request: 'secret' };
  }

  toJSON() {
    return { safe: true };
  }
}

class Flip {
  constructor() {
    this.calls = 0;
  }

  toJSON() {
    this.calls += 1;
    return this.calls === 1 ? { safe: true } : { _request: 'secret' };
  }
}

test.each([
  ['whose toJSON hides its own keys', () => new Hider()],
  ['whose toJSON changes on each call', () => new Flip()],
])('parse with literalData returns the scanned form of a class instance %s', (_, create) => {
  const parser = new ServerParser({ operators: createDataOperators(create()) });
  const res = parser.parse({
    input: { a: { _data: true } },
    location,
    literalData: createLiteralData({}),
  });
  expect(res.errors).toEqual([]);
  expect(res.output.a).toEqual({ safe: true });
  expect(JSON.stringify(res.output)).toBe('{"a":{"safe":true}}');
});

test('parse with literalData treats keys that name no client operator as data', () => {
  const data = [{ _score: 0.5 }, { _source: { title: 'x' } }];
  const parser = new ServerParser({ operators: createDataOperators(data) });
  const res = parser.parse({
    input: { a: { _data: true } },
    location,
    literalData: createLiteralData({ clientOperators: new Set(['_request', '_state']) }),
  });
  expect(res.errors).toEqual([]);
  expect(res.output.a).toEqual(data);
});

test('parse with literalData still refuses a key that names a client operator', () => {
  const parser = new ServerParser({
    operators: createDataOperators([{ _score: 0.5 }, { title: { _state: 'secret' } }]),
  });
  const res = parser.parse({
    input: { a: { _data: true } },
    location,
    literalData: createLiteralData({ clientOperators: new Set(['_state']) }),
  });
  expect(res.errors[0].message).toContain('contains the operator "_state" at "1.title"');
});

// The copying reads, as operators-js implements them.
const copyingOperators = {
  _args: ({ args, arrayIndices, params }) =>
    getFromObject({ arrayIndices, location, object: args, operator: '_args', params }),
  _function:
    ({ operatorPrefix, params, parser }) =>
    (...args) => {
      const { output, errors } = parser.parse({
        args,
        input: serializer.copy(params),
        operatorPrefix: `_${operatorPrefix}`,
      });
      if (errors.length > 0) throw errors[0];
      return output;
    },
  _get: ({ arrayIndices, params }) =>
    getFromObject({ arrayIndices, location, object: params.from, operator: '_get', params }),
  _object: ({ params }) => Object.assign(...params),
};

function parseWithData(data, input) {
  const operators = { ...copyingOperators, _data: () => serializer.copy(data) };
  const parser = new ServerParser({ operators });
  const literalData = createLiteralData({});
  const res = parser.parse({ input, location, literalData });
  return { literalData, output: res.output, errors: res.errors };
}

const row = { id: 'raw', type: 'Html', properties: { html: 'x' } };

test('parse with literalData marks data an operator returned, not config equal to it', () => {
  const { literalData, output } = parseWithData(row, { a: { _data: true }, b: row });
  expect(findDataOrigin({ literalData, value: output.a })).toBe('_data');
  expect(findDataOrigin({ literalData, value: output.b })).toBe(null);
  expect(findDataOrigin({ literalData, value: serializer.copy(output.a) })).toBe(null);
});

test.each([
  ['_get by key', { _get: { from: { rows: [{ _data: true }] }, key: 'rows.0' } }],
  ['_get of all', { _get: { from: [{ _data: true }], key: '0' } }],
  ['_get default', { _get: { from: {}, key: 'missing', default: { _data: true } } }],
])('parse with literalData marks a copy that %s makes of data', (_, input) => {
  const { literalData, output, errors } = parseWithData(row, { a: input });
  expect(errors).toEqual([]);
  expect(output.a).toEqual(row);
  expect(findDataOrigin({ literalData, value: output.a })).toBe('_data');
});

test('parse with literalData marks a copy _args makes of data in a function call', () => {
  const { literalData, output } = parseWithData(row, {
    fn: { _function: { __args: 0 } },
  });
  const copy = output.fn(serializer.copy(row));
  expect(findDataOrigin({ literalData, value: copy })).toBe(null);
  const { literalData: data, output: mapped } = parseWithData(row, {
    fn: { _function: { __args: 0 } },
    row: { _data: true },
  });
  expect(findDataOrigin({ literalData: data, value: mapped.fn(mapped.row) })).toBe('_data');
});

const withError = { ...row, properties: { html: 'x', error: { '~e': { message: 'm' } } } };

test.each([
  ['data', row, { _function: { _data: true } }],
  ['data holding a serialized error', withError, { _function: { _data: true } }],
  [
    'data merged with config',
    row,
    { _function: { '__object.assign': [{ _data: true }, { x: 1 }] } },
  ],
])('parse with literalData marks the copies a _function body holding %s makes', (_, data, fn) => {
  const { literalData, output } = parseWithData(data, { fn });
  expect(findDataOrigin({ literalData, value: output.fn() })).toBe('_data');
});

test('parse with literalData leaves a _function body built from config unmarked', () => {
  const { literalData, output } = parseWithData(row, {
    fn: {
      _function: {
        id: { __args: '0.id' },
        type: { __args: '0.type' },
        properties: { __args: '0.properties' },
      },
    },
    row: { _data: true },
  });
  const block = output.fn(output.row);
  expect(block).toEqual(row);
  expect(findDataOrigin({ literalData, value: block })).toBe(null);
});

function nestTyped(depth) {
  let nested = { type: 'leaf' };
  for (let level = 1; level < depth; level += 1) {
    nested = { type: 'Box', child: nested };
  }
  return nested;
}

// Data at the deepest nesting allowed, many times over.
function deepRows() {
  return Array.from({ length: 25 }, () => nestTyped(MAX_DATA_DEPTH - 1));
}

// Marking is linear in the data's size. Timing is not a stable measure on a
// shared machine, so the test bounds the text serialized while parsing: a few
// copies of the data, where serializing every nested object separately grew
// with the data's size times its depth.
test('parse with literalData marks deeply nested data in linear work', () => {
  const once = JSON.stringify(deepRows()).length;
  const stringify = jest.spyOn(JSON, 'stringify');
  let result;
  let serialized = 0;
  try {
    result = parseWithData(deepRows(), {
      a: { _data: true },
      b: { _get: { from: { value: { _data: true } }, key: 'value' } },
      fn: { _function: { _data: true } },
    });
    result.copy = result.output.fn();
    stringify.mock.results.forEach(({ value }) => {
      serialized += type.isString(value) ? value.length : 0;
    });
  } finally {
    stringify.mockRestore();
  }
  const { copy, errors, literalData, output } = result;
  expect(errors.map((error) => error.message)).toEqual([]);
  expect(findDataOrigin({ literalData, value: output.a[0].child.child })).toBe('_data');
  expect(findDataOrigin({ literalData, value: output.b[3].child.child })).toBe('_data');
  expect(findDataOrigin({ literalData, value: copy[24].child.child })).toBe('_data');
  expect(serialized).toBeLessThan(20 * once);
});

test('parse with literalData refuses data nested deeper than the Dynamic data limit', () => {
  const { errors, output } = parseWithData(nestTyped(MAX_DATA_DEPTH + 1), { a: { _data: true } });
  expect(output.a).toBe(null);
  expect(errors[0]).toBeInstanceOf(ConfigError);
  expect(errors[0].message).toBe(
    `Data returned by "_data" is nested more than ${MAX_DATA_DEPTH} levels deep. Data read into Dynamic block content may nest at most ${MAX_DATA_DEPTH} levels.`
  );
});

test('parse with literalData refuses data too deep for an operator to read', () => {
  const operators = {
    _data: () => {
      throw new RangeError('Maximum call stack size exceeded');
    },
    _round: () => {
      throw new RangeError('toFixed() digits argument must be between 0 and 100');
    },
  };
  const parser = new ServerParser({ operators });
  const res = parser.parse({
    input: { a: { _data: true }, b: { _round: true } },
    location,
    literalData: createLiteralData({}),
  });
  expect(res.output).toEqual({ a: null, b: null });
  expect(res.errors[0]).toBeInstanceOf(ConfigError);
  expect(res.errors[0].message).toBe(
    `Data read by "_data" is nested too deeply to check. Data read into Dynamic block content may nest at most ${MAX_DATA_DEPTH} levels.`
  );
  expect(res.errors[1]).toBeInstanceOf(OperatorError);
});

test('the depth check and the content digest stop on a cyclic value', () => {
  const cyclic = { type: 'Box' };
  cyclic.self = cyclic;
  expect(isNestedDeeperThan({ value: cyclic, limit: MAX_DATA_DEPTH })).toBe(true);
  expect(createContentHasher()(cyclic)).toEqual(expect.any(String));
});

test('parse with literalData treats an object _object.assign merges data into as data', () => {
  const row = { _user: 'email', note: 'x' };
  const operators = {
    _data: () => serializer.copy(row),
    _object: ({ params }) => Object.assign(...params),
  };
  const parser = new ServerParser({ operators });
  const literalData = createLiteralData({});
  const res = parser.parse({
    input: {
      merged: { '_object.assign': [{}, { _data: true }, { note: 'y' }] },
      written: { '_object.assign': [{}, { type: 'Html' }] },
    },
    location,
    literalData,
  });
  expect(res.errors).toEqual([]);
  expect(findDataOrigin({ literalData, value: res.output.merged })).toBe('_data');
  expect(findDataOrigin({ literalData, value: res.output.written })).toBe(null);
});
