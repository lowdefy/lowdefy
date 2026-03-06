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

import validatePluginSchema from './validatePluginSchema.js';

const schema = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      size: { type: 'string', enum: ['small', 'default', 'large'] },
    },
    required: ['title'],
  },
  params: {
    type: 'object',
    properties: {
      value: { type: 'number' },
    },
  },
};

test('returns null when no schema provided', () => {
  const result = validatePluginSchema({
    data: { title: 'hi' },
    schema: null,
    schemaKey: 'properties',
  });
  expect(result).toBeNull();
});

test('returns null when schema has no matching key', () => {
  const result = validatePluginSchema({
    data: { title: 'hi' },
    schema: {},
    schemaKey: 'properties',
  });
  expect(result).toBeNull();
});

test('returns null when data is valid', () => {
  const result = validatePluginSchema({
    data: { title: 'Hello', size: 'small' },
    schema,
    schemaKey: 'properties',
  });
  expect(result).toBeNull();
});

test('returns errors array when data fails validation', () => {
  const result = validatePluginSchema({
    data: { title: 'Hello', size: 'huge' },
    schema,
    schemaKey: 'properties',
  });
  expect(result).not.toBeNull();
  expect(result.length).toBeGreaterThan(0);
  expect(result[0].keyword).toBe('enum');
});

test('returns errors when data is null', () => {
  const result = validatePluginSchema({
    data: null,
    schema,
    schemaKey: 'properties',
  });
  expect(result).not.toBeNull();
  expect(result.some((e) => e.keyword === 'type')).toBe(true);
});

test('returns all errors not just first', () => {
  const result = validatePluginSchema({
    data: { size: 123 },
    schema,
    schemaKey: 'properties',
  });
  expect(result).not.toBeNull();
  // Should have at least required error for 'title' and type error for 'size'
  expect(result.length).toBeGreaterThanOrEqual(2);
});

test('validates with params schemaKey', () => {
  const result = validatePluginSchema({
    data: { value: 'not a number' },
    schema,
    schemaKey: 'params',
  });
  expect(result).not.toBeNull();
  expect(result[0].keyword).toBe('type');
});
