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

import validateActionParams from './validateActionParams.js';

describe('validateActionParams', () => {
  test('returns null when schema has no params key', () => {
    const result = validateActionParams({
      params: { ms: 1000 },
      schema: { type: 'object' },
    });
    expect(result).toBeNull();
  });

  test('returns null when schema is null', () => {
    const result = validateActionParams({
      params: { ms: 1000 },
      schema: null,
    });
    expect(result).toBeNull();
  });

  test('returns null when params are valid', () => {
    const result = validateActionParams({
      params: { ms: 1000 },
      schema: {
        params: {
          type: 'object',
          required: ['ms'],
          properties: {
            ms: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
    });
    expect(result).toBeNull();
  });

  test('returns errors when params have wrong type', () => {
    const result = validateActionParams({
      params: { ms: 'abc' },
      schema: {
        params: {
          type: 'object',
          required: ['ms'],
          properties: {
            ms: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
    });
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].keyword).toBe('type');
  });

  test('returns errors when required param is missing', () => {
    const result = validateActionParams({
      params: {},
      schema: {
        params: {
          type: 'object',
          required: ['ms'],
          properties: {
            ms: { type: 'integer' },
          },
        },
      },
    });
    expect(result).not.toBeNull();
    expect(result[0].keyword).toBe('required');
  });

  test('returns errors for additional properties', () => {
    const result = validateActionParams({
      params: { ms: 1000, extra: true },
      schema: {
        params: {
          type: 'object',
          properties: {
            ms: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
    });
    expect(result).not.toBeNull();
    expect(result[0].keyword).toBe('additionalProperties');
  });

  test('validates with null params as empty object', () => {
    const result = validateActionParams({
      params: null,
      schema: {
        params: {
          type: 'object',
          properties: {
            ms: { type: 'integer' },
          },
        },
      },
    });
    expect(result).toBeNull();
  });
});
