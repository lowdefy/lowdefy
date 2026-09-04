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

import compile from './compile.js';
import normalizeSchemaShorthand from './normalizeSchemaShorthand.js';

test('normalizeSchemaShorthand expands a bare type name to JSON Schema', () => {
  expect(normalizeSchemaShorthand({ schema: 'string' })).toEqual({ type: 'string' });
  expect(normalizeSchemaShorthand({ schema: 'integer' })).toEqual({ type: 'integer' });
});

test('normalizeSchemaShorthand expands date to a date-time string, never instanceof', () => {
  expect(normalizeSchemaShorthand({ schema: 'date' })).toEqual({
    type: 'string',
    format: 'date-time',
  });
  expect(normalizeSchemaShorthand({ schema: { type: 'date' } })).toEqual({
    type: 'string',
    format: 'date-time',
  });
});

test('normalizeSchemaShorthand expands the one-element array shorthand', () => {
  expect(normalizeSchemaShorthand({ schema: ['string'] })).toEqual({
    type: 'array',
    items: { type: 'string' },
  });
  expect(normalizeSchemaShorthand({ schema: ['date'] })).toEqual({
    type: 'array',
    items: { type: 'string', format: 'date-time' },
  });
});

test('normalizeSchemaShorthand throws when an array shorthand does not hold one entry', () => {
  expect(() => normalizeSchemaShorthand({ schema: ['string', 'number'] })).toThrow(
    'An array shorthand must hold exactly one entry'
  );
});

test('normalizeSchemaShorthand throws on an unknown type name and lists the accepted ones', () => {
  expect(() => normalizeSchemaShorthand({ schema: 'strng' })).toThrow(
    'Unknown type "strng". Accepted types: string, number, integer, boolean, date, object, array, null.'
  );
});

test('normalizeSchemaShorthand leaves plain JSON Schema unchanged', () => {
  const schema = {
    type: 'object',
    required: ['a'],
    properties: { a: { type: 'string', minLength: 1 } },
    additionalProperties: false,
  };
  expect(normalizeSchemaShorthand({ schema })).toEqual(schema);
});

test('normalizeSchemaShorthand expands shorthand inside properties, items and combinators', () => {
  expect(
    normalizeSchemaShorthand({
      schema: {
        type: 'object',
        properties: { name: 'string', tags: ['string'], at: 'date' },
        anyOf: ['string', { type: 'number' }],
      },
    })
  ).toEqual({
    type: 'object',
    properties: {
      name: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      at: { type: 'string', format: 'date-time' },
    },
    anyOf: [{ type: 'string' }, { type: 'number' }],
  });
});

test('normalizeSchemaShorthand nests dotted property names', () => {
  expect(
    normalizeSchemaShorthand({
      schema: { type: 'object', properties: { 'address.city': 'string', name: 'string' } },
    })
  ).toEqual({
    type: 'object',
    properties: {
      address: { type: 'object', properties: { city: { type: 'string' } } },
      name: { type: 'string' },
    },
  });
});

test('normalizeSchemaShorthand keeps a tuple items array', () => {
  expect(
    normalizeSchemaShorthand({ schema: { type: 'array', items: ['string', 'number'] } })
  ).toEqual({ type: 'array', items: [{ type: 'string' }, { type: 'number' }] });
});

test('normalizeSchemaShorthand output compiles and a date-time string passes', () => {
  const validator = compile({ schema: normalizeSchemaShorthand({ schema: 'date' }) });
  expect(validator(new Date(0).toISOString()).valid).toBe(true);
  expect(validator('not a date').valid).toBe(false);
});
