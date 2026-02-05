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

import validateBlockProperties from './validateBlockProperties.js';

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

describe('validateBlockProperties', () => {
  test('returns null when properties are valid', () => {
    const result = validateBlockProperties({
      blockType: 'Box',
      properties: { content: 'hello' },
      schema: boxSchema,
    });
    expect(result).toBeNull();
  });

  test('returns null when properties are empty and no required fields', () => {
    const result = validateBlockProperties({
      blockType: 'Box',
      properties: {},
      schema: boxSchema,
    });
    expect(result).toBeNull();
  });

  test('returns errors when property has wrong type', () => {
    const result = validateBlockProperties({
      blockType: 'Box',
      properties: { content: 123 },
      schema: boxSchema,
    });
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].instancePath).toBe('/content');
  });

  test('returns errors for additional properties when additionalProperties is false', () => {
    const result = validateBlockProperties({
      blockType: 'Box',
      properties: { unknownProp: true },
      schema: boxSchema,
    });
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns null when schema has no properties field', () => {
    const result = validateBlockProperties({
      blockType: 'Box',
      properties: { content: 123 },
      schema: {},
    });
    expect(result).toBeNull();
  });

  test('returns null when schema is null', () => {
    const result = validateBlockProperties({
      blockType: 'Box',
      properties: { content: 123 },
      schema: null,
    });
    expect(result).toBeNull();
  });

  test('validates with null properties as empty object', () => {
    const result = validateBlockProperties({
      blockType: 'Box',
      properties: null,
      schema: boxSchema,
    });
    expect(result).toBeNull();
  });
});
