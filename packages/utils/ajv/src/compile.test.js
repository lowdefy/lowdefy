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

import ajv from './ajvInstance.js';
import compile from './compile.js';

test('compile returns a validator function that returns valid:true on success', () => {
  const validator = compile({
    schema: {
      type: 'object',
      properties: { string: { type: 'string' } },
    },
  });
  expect(validator({ string: 'value' })).toEqual({ valid: true, errors: [] });
});

test('compile returns errors on failure', () => {
  const validator = compile({
    schema: {
      type: 'object',
      properties: { string: { type: 'string' } },
    },
  });
  const result = validator({ string: 7 });
  expect(result.valid).toBe(false);
  expect(result.errors).toEqual([
    {
      instancePath: '/string',
      keyword: 'type',
      message: 'must be string',
      params: { type: 'string' },
      schemaPath: '#/properties/string/type',
    },
  ]);
});

test('compiled validator is reusable across many calls', () => {
  const validator = compile({
    schema: { type: 'string', minLength: 1 },
  });
  expect(validator('a').valid).toBe(true);
  expect(validator('').valid).toBe(false);
  expect(validator('hello').valid).toBe(true);
  expect(validator(0).valid).toBe(false);
});

test('compile honours errorMessage keyword from ajv-errors', () => {
  const validator = compile({
    schema: {
      type: 'object',
      properties: {
        string: {
          type: 'string',
          errorMessage: { type: 'Custom error message.' },
        },
      },
    },
  });
  const result = validator({ string: 7 });
  expect(result.valid).toBe(false);
  expect(result.errors[0].message).toBe('Custom error message.');
});

test('format date-time accepts ISO 8601 strings', () => {
  const validator = compile({
    schema: { type: 'string', format: 'date-time' },
  });
  expect(validator('2026-05-13T10:00:00Z').valid).toBe(true);
  expect(validator('not a date').valid).toBe(false);
});

test('format email validates email addresses', () => {
  const validator = compile({
    schema: { type: 'string', format: 'email' },
  });
  expect(validator('user@example.com').valid).toBe(true);
  expect(validator('not-an-email').valid).toBe(false);
});

test('format uuid validates UUIDs', () => {
  const validator = compile({
    schema: { type: 'string', format: 'uuid' },
  });
  expect(validator('123e4567-e89b-12d3-a456-426614174000').valid).toBe(true);
  expect(validator('not-a-uuid').valid).toBe(false);
});

test('instanceof keyword accepts Date instances', () => {
  const validator = compile({
    schema: { instanceof: 'Date' },
  });
  expect(validator(new Date()).valid).toBe(true);
  expect(validator('2026-05-13').valid).toBe(false);
  expect(validator({}).valid).toBe(false);
});

test('transform keyword normalises strings during validation', () => {
  const validator = compile({
    schema: { type: 'string', transform: ['trim', 'toUpperCase'] },
  });
  const data = { value: '  lot-001  ' };
  // ajv-keywords transform mutates the parent object in-place. Wrap so we can read the result.
  const wrapped = compile({
    schema: {
      type: 'object',
      properties: {
        value: { type: 'string', transform: ['trim', 'toUpperCase'] },
      },
    },
  });
  const result = wrapped(data);
  expect(result.valid).toBe(true);
  expect(data.value).toBe('LOT-001');
  // Sanity-check the top-level scalar form too.
  let scalar = '  hello  ';
  const arr = [scalar];
  const arrValidator = compile({
    schema: { type: 'array', items: { type: 'string', transform: ['trim', 'toLowerCase'] } },
  });
  expect(arrValidator(arr).valid).toBe(true);
  expect(arr[0]).toBe('hello');
  // Reference scalar to avoid the unused-variable hint.
  expect(validator).toBeInstanceOf(Function);
});

test('regexp keyword supports flags (case-insensitive)', () => {
  const validator = compile({
    schema: { type: 'string', regexp: '/^l[0-9]+$/i' },
  });
  expect(validator('L1').valid).toBe(true);
  expect(validator('l99').valid).toBe(true);
  expect(validator('X1').valid).toBe(false);
});

test('regexp keyword accepts the object form with explicit flags', () => {
  const validator = compile({
    schema: { type: 'string', regexp: { pattern: '^foo$', flags: 'i' } },
  });
  expect(validator('foo').valid).toBe(true);
  expect(validator('FOO').valid).toBe(true);
  expect(validator('bar').valid).toBe(false);
});

test('nullable column pattern via type array', () => {
  const validator = compile({
    schema: { type: ['string', 'null'], minLength: 1 },
  });
  expect(validator('value').valid).toBe(true);
  expect(validator(null).valid).toBe(true);
  expect(validator('').valid).toBe(false);
  expect(validator(7).valid).toBe(false);
});

test('compiled validator caps errors at MAX_VALIDATION_ERRORS (DoS guard)', () => {
  const validator = compile({
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  });
  const data = {};
  for (let i = 0; i < 50; i++) {
    data[`extra_${i}`] = i;
  }
  const result = validator(data);
  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(20);
});

test('compiled validator returns every failure below the cap', () => {
  const validator = compile({
    schema: {
      type: 'object',
      properties: {
        string: { type: 'string' },
        number: { type: 'number' },
        boolean: { type: 'boolean' },
      },
    },
  });
  const result = validator({ string: 7, number: '7', boolean: 7 });
  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(3);
});

test('compile leaves no schema behind on the shared instance', () => {
  const before = ajv._cache.size;
  for (let i = 0; i < 3; i++) {
    compile({ schema: { type: 'object', properties: { a: { type: 'string' } } } });
  }
  expect(ajv._cache.size).toBe(before);
});

test('compile accepts a fresh copy of a schema with an $id it compiled before', () => {
  const schema = () => ({
    $id: 'https://example.com/order.json',
    type: 'object',
    required: ['id'],
  });
  compile({ schema: schema() });
  const validator = compile({ schema: schema() });
  expect(validator({ id: 1 }).valid).toBe(true);
  expect(validator({}).valid).toBe(false);
});

test('compile accepts a boolean schema', () => {
  expect(compile({ schema: true })('anything').valid).toBe(true);
  expect(compile({ schema: false })('anything').valid).toBe(false);
});
