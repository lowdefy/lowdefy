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
import { UserError } from '@lowdefy/errors';

const compileCalls = [];
jest.unstable_mockModule('@lowdefy/ajv', async () => {
  const actual = await import('../../../../utils/ajv/src/compile.js');
  const { default: toJsonShape } = await import('../../../../utils/ajv/src/toJsonShape.js');
  return {
    compile: jest.fn((args) => {
      compileCalls.push(args);
      return actual.default(args);
    }),
    toJsonShape,
  };
});

const { default: validatePayload } = await import('./validatePayload.js');

const schema = {
  type: 'object',
  properties: { quantity: { type: 'number' }, sku: { type: 'string' } },
  required: ['quantity'],
};

beforeEach(() => {
  compileCalls.length = 0;
});

test('validatePayload is a no-op when the endpoint declares no payloadSchema', () => {
  expect(() =>
    validatePayload({ endpointConfig: { endpointId: 'no_schema' }, payload: 'anything' })
  ).not.toThrow();
  expect(() =>
    validatePayload({
      endpointConfig: { endpointId: 'null_schema', payloadSchema: null },
      payload: { x: 1 },
    })
  ).not.toThrow();
  expect(compileCalls).toHaveLength(0);
});

test('validatePayload returns for a payload that matches the schema', () => {
  expect(() =>
    validatePayload({
      endpointConfig: { endpointId: 'create_order', payloadSchema: schema },
      payload: { quantity: 2, sku: 'A1' },
    })
  ).not.toThrow();
});

test('validatePayload throws a UserError naming the endpoint, location and first ajv message', () => {
  let thrown;
  try {
    validatePayload({
      endpointConfig: { endpointId: 'create_order', payloadSchema: schema },
      payload: { quantity: 'two' },
    });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(UserError);
  expect(thrown.message).toEqual(
    'Payload for endpoint "create_order" does not match its payloadSchema at /quantity: must be number.'
  );
  expect(Array.isArray(thrown.cause)).toBe(true);
  expect(thrown.cause[0].instancePath).toEqual('/quantity');
});

test('validatePayload reports (root) for a root-level failure and counts further errors', () => {
  const strict = {
    type: 'object',
    properties: { a: { type: 'number' }, b: { type: 'number' } },
    required: ['a', 'b'],
  };
  expect(() =>
    validatePayload({
      endpointConfig: { endpointId: 'strict', payloadSchema: strict },
      payload: {},
    })
  ).toThrow(
    'Payload for endpoint "strict" does not match its payloadSchema at (root): must have required property \'a\'. (and 1 more)'
  );
});

test('validatePayload strips build-artifact markers from the schema before compiling', () => {
  const artifactSchema = {
    '~k': 'k0',
    type: 'object',
    required: { '~arr': ['quantity'], '~k': 'k1' },
    properties: { '~k': 'k2', quantity: { '~k': 'k3', type: 'number' } },
  };
  expect(() =>
    validatePayload({
      endpointConfig: { endpointId: 'artifact', payloadSchema: artifactSchema },
      payload: { quantity: 1 },
    })
  ).not.toThrow();
  expect(compileCalls[0].schema).toEqual({
    type: 'object',
    required: ['quantity'],
    properties: { quantity: { type: 'number' } },
  });
  expect(() =>
    validatePayload({
      endpointConfig: { endpointId: 'artifact', payloadSchema: artifactSchema },
      payload: {},
    })
  ).toThrow("at (root): must have required property 'quantity'.");
});

test('validatePayload caches the compiled validator while the schema object is unchanged', () => {
  const endpointConfig = { endpointId: 'cached', payloadSchema: { ...schema } };
  validatePayload({ endpointConfig, payload: { quantity: 1 } });
  validatePayload({ endpointConfig, payload: { quantity: 2 } });
  validatePayload({ endpointConfig: { ...endpointConfig }, payload: { quantity: 3 } });
  expect(compileCalls).toHaveLength(1);
});

test('validatePayload recompiles when the endpoint carries a new schema object', () => {
  const endpointConfig = { endpointId: 'rebuilt', payloadSchema: { ...schema } };
  validatePayload({ endpointConfig, payload: { quantity: 1 } });
  expect(compileCalls).toHaveLength(1);

  const edited = { type: 'object', properties: { quantity: { type: 'string' } } };
  const rebuilt = { endpointId: 'rebuilt', payloadSchema: edited };
  expect(() => validatePayload({ endpointConfig: rebuilt, payload: { quantity: 1 } })).toThrow(
    'at /quantity: must be string.'
  );
  expect(compileCalls).toHaveLength(2);
  validatePayload({ endpointConfig: rebuilt, payload: { quantity: 'one' } });
  expect(compileCalls).toHaveLength(2);
});

test('validatePayload surfaces a schema ajv cannot compile as the thrown compile error', () => {
  expect(() =>
    validatePayload({
      endpointConfig: { endpointId: 'broken', payloadSchema: { type: 'not-a-type' } },
      payload: {},
    })
  ).toThrow(/schema is invalid/);
});

// R6: payloadSchema describes the JSON shape the caller sent, so `date-time`
// means the same thing here as it does in a responseSchema or a collections
// field declaration.
test('validatePayload accepts a client-sent date against a date-time format', () => {
  const endpointConfig = {
    endpointId: 'dated',
    payloadSchema: {
      type: 'object',
      properties: { from: { type: 'string', format: 'date-time' } },
      required: ['from'],
    },
  };
  expect(() => validatePayload({ endpointConfig, payload: { from: new Date(0) } })).not.toThrow();
  expect(() =>
    validatePayload({ endpointConfig, payload: { from: '1970-01-01T00:00:00.000Z' } })
  ).not.toThrow();
  expect(() => validatePayload({ endpointConfig, payload: { from: 'yesterday' } })).toThrow(
    UserError
  );
});
