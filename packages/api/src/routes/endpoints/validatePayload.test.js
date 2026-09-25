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
  return {
    compile: jest.fn((args) => {
      compileCalls.push(args);
      return actual.default(args);
    }),
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

function thrownMessage({ payloadSchema, payload }) {
  try {
    validatePayload({ endpointConfig: { endpointId: 'raise_finding', payloadSchema }, payload });
  } catch (error) {
    return error.message;
  }
  return null;
}

test('validatePayload names every allowed value for an enum miss', () => {
  expect(
    thrownMessage({
      payloadSchema: {
        type: 'object',
        properties: { source: { enum: ['critique', 'discover', 'build'] } },
      },
      payload: { source: 'review' },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at /source: must be equal to one of the allowed values (critique, discover, build).'
  );
});

test('validatePayload writes non-string allowed values as JSON', () => {
  expect(
    thrownMessage({
      payloadSchema: { type: 'object', properties: { level: { enum: [1, 2, null] } } },
      payload: { level: 3 },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at /level: must be equal to one of the allowed values (1, 2, null).'
  );
});

test('validatePayload prefers the enum error over the type error on the same path', () => {
  expect(
    thrownMessage({
      payloadSchema: {
        type: 'object',
        properties: { source: { type: ['string', 'null'], enum: ['critique', 'discover', null] } },
      },
      payload: { source: 5 },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at /source: must be equal to one of the allowed values (critique, discover, null).'
  );
});

test('validatePayload keeps a type error when the path has no more specific error', () => {
  expect(
    thrownMessage({
      payloadSchema: { type: 'object', properties: { count: { type: 'number' } } },
      payload: { count: 'many' },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at /count: must be number.'
  );
});

test('validatePayload names the offending property for additionalProperties', () => {
  expect(
    thrownMessage({
      payloadSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' } },
      },
      payload: { title: 'A', color: 'red' },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at (root): must NOT have additional properties (color).'
  );
});

test('validatePayload lists every additional property on the path in one message', () => {
  expect(
    thrownMessage({
      payloadSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { title: { type: 'string' } },
      },
      payload: { title: 'A', color: 'red', size: 2 },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at (root): must NOT have additional properties (color, size).'
  );
});

test('validatePayload names the pattern a string must match', () => {
  expect(
    thrownMessage({
      payloadSchema: {
        type: 'object',
        properties: { slug: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{1,79}$' } },
      },
      payload: { slug: 'Not A Slug' },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at /slug: must match pattern "^[a-z0-9][a-z0-9-]{1,79}$".'
  );
});

test('validatePayload counts only the errors its message does not describe', () => {
  expect(
    thrownMessage({
      payloadSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          source: { type: ['string', 'null'], enum: ['critique', null] },
          slug: { type: 'string', pattern: '^[a-z]+$' },
        },
      },
      payload: { color: 'red', size: 2, source: 5, slug: 'A B' },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at (root): must NOT have additional properties (color, size). (and 2 more)'
  );
});

test('validatePayload keeps ajv order for an anyOf miss rather than preferring the anyOf error', () => {
  expect(
    thrownMessage({
      payloadSchema: {
        type: 'object',
        properties: { ref: { anyOf: [{ type: 'string' }, { type: 'number' }] } },
      },
      payload: { ref: true },
    })
  ).toEqual(
    'Payload for endpoint "raise_finding" does not match its payloadSchema at /ref: must be string. (and 2 more)'
  );
});
