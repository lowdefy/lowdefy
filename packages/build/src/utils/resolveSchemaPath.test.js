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

import resolveSchemaPath from './resolveSchemaPath.js';

const schema = {
  type: 'object',
  properties: {
    results: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } },
    meta: { type: 'object' },
    loose: { type: 'object', properties: { a: {} }, additionalProperties: true },
    either: { oneOf: [{ type: 'object', properties: { x: {} } }, { type: 'null' }] },
    total: { type: 'integer' },
  },
};

test('resolveSchemaPath resolves declared paths through properties and items', () => {
  expect(resolveSchemaPath({ schema, path: 'results[0].id' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'results.0.id' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'total' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'either.x' }).resolved).toBe(true);
});

test('resolveSchemaPath lists the sorted top-level declared keys', () => {
  expect(resolveSchemaPath({ schema, path: 'total' }).declared).toEqual([
    'either',
    'loose',
    'meta',
    'results',
    'total',
  ]);
});

test('resolveSchemaPath rejects an undeclared property and names the failing segment', () => {
  expect(resolveSchemaPath({ schema, path: 'totl' })).toEqual({
    resolved: false,
    declared: ['either', 'loose', 'meta', 'results', 'total'],
    segment: 'totl',
    candidates: ['either', 'loose', 'meta', 'results', 'total'],
  });
  expect(resolveSchemaPath({ schema, path: 'results[0].name' }).candidates).toEqual(['id']);
  expect(resolveSchemaPath({ schema, path: 'results[0].name' }).segment).toBe('name');
  expect(resolveSchemaPath({ schema, path: 'either.y' }).resolved).toBe(false);
});

test('resolveSchemaPath rejects reading into a primitive or a non-index array segment', () => {
  expect(resolveSchemaPath({ schema, path: 'total.x' }).resolved).toBe(false);
  expect(resolveSchemaPath({ schema, path: 'results.first' }).resolved).toBe(false);
});

test('resolveSchemaPath resolves anything under an open shape', () => {
  expect(resolveSchemaPath({ schema, path: 'meta.anything.deep' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema, path: 'loose.other' }).resolved).toBe(true);
  expect(resolveSchemaPath({ schema: { type: 'object' }, path: 'x.y' }).resolved).toBe(true);
});
