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

import validatePluginSchema from './validatePluginSchema.js';

const boxSchema = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      content: { type: 'string' },
      style: { type: 'object' },
    },
  },
};

const waitSchema = {
  params: {
    type: 'object',
    required: ['ms'],
    properties: {
      ms: { type: 'integer' },
    },
    additionalProperties: false,
  },
};

describe('validatePluginSchema - block properties', () => {
  test('returns null when properties are valid', () => {
    const result = validatePluginSchema({
      data: { content: 'hello' },
      schema: boxSchema,
      schemaKey: 'properties',
    });
    expect(result).toBeNull();
  });

  test('returns null when properties are empty and no required fields', () => {
    const result = validatePluginSchema({
      data: {},
      schema: boxSchema,
      schemaKey: 'properties',
    });
    expect(result).toBeNull();
  });

  test('returns errors when property has wrong type', () => {
    const result = validatePluginSchema({
      data: { content: 123 },
      schema: boxSchema,
      schemaKey: 'properties',
    });
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].instancePath).toBe('/content');
  });

  test('returns errors for additional properties when additionalProperties is false', () => {
    const result = validatePluginSchema({
      data: { unknownProp: true },
      schema: boxSchema,
      schemaKey: 'properties',
    });
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns null when schema has no matching schemaKey', () => {
    const result = validatePluginSchema({
      data: { content: 123 },
      schema: {},
      schemaKey: 'properties',
    });
    expect(result).toBeNull();
  });

  test('returns null when schema is null', () => {
    const result = validatePluginSchema({
      data: { content: 123 },
      schema: null,
      schemaKey: 'properties',
    });
    expect(result).toBeNull();
  });

  test('validates with null data as empty object', () => {
    const result = validatePluginSchema({
      data: null,
      schema: boxSchema,
      schemaKey: 'properties',
    });
    expect(result).toBeNull();
  });
});

describe('validatePluginSchema - action params', () => {
  test('returns null when schema has no params key', () => {
    const result = validatePluginSchema({
      data: { ms: 1000 },
      schema: { type: 'object' },
      schemaKey: 'params',
    });
    expect(result).toBeNull();
  });

  test('returns null when params are valid', () => {
    const result = validatePluginSchema({
      data: { ms: 1000 },
      schema: waitSchema,
      schemaKey: 'params',
    });
    expect(result).toBeNull();
  });

  test('returns errors when params have wrong type', () => {
    const result = validatePluginSchema({
      data: { ms: 'abc' },
      schema: waitSchema,
      schemaKey: 'params',
    });
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].keyword).toBe('type');
  });

  test('returns errors when required param is missing', () => {
    const result = validatePluginSchema({
      data: {},
      schema: waitSchema,
      schemaKey: 'params',
    });
    expect(result).not.toBeNull();
    expect(result[0].keyword).toBe('required');
  });

  test('returns errors for additional properties', () => {
    const result = validatePluginSchema({
      data: { ms: 1000, extra: true },
      schema: waitSchema,
      schemaKey: 'params',
    });
    expect(result).not.toBeNull();
    expect(result[0].keyword).toBe('additionalProperties');
  });

  test('validates with null params as empty object', () => {
    const result = validatePluginSchema({
      data: null,
      schema: {
        params: {
          type: 'object',
          properties: {
            ms: { type: 'integer' },
          },
        },
      },
      schemaKey: 'params',
    });
    expect(result).toBeNull();
  });
});
