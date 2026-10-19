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
import { validate } from '@lowdefy/ajv';

const mockGenerateText = jest.fn();
const mockJsonSchema = jest.fn((schema) => ({ wrapped: schema }));
const mockOutputObject = jest.fn((spec) => ({ outputSpec: spec }));

jest.unstable_mockModule('ai', () => ({
  generateText: mockGenerateText,
  jsonSchema: mockJsonSchema,
  Output: { object: mockOutputObject },
}));

beforeEach(() => {
  mockGenerateText.mockReset();
  mockJsonSchema.mockClear();
  mockOutputObject.mockClear();
});

test('createGenerateObject returns a resolver with schema and meta attached', async () => {
  const { default: createGenerateObject } = await import('./createGenerateObject.js');
  const GenerateObject = createGenerateObject({ createProvider: jest.fn() });
  expect(GenerateObject.meta).toEqual({ checkRead: false, checkWrite: false });
  expect(GenerateObject.schema).toBeDefined();
  expect(GenerateObject.schema.title).toBe('Lowdefy Request Schema - GenerateObject');
});

test('GenerateObject resolver builds the provider from connection properties and delegates', async () => {
  const { default: createGenerateObject } = await import('./createGenerateObject.js');
  mockGenerateText.mockResolvedValue({
    output: { category: 'billing' },
    finishReason: 'stop',
    usage: { totalTokens: 20 },
  });

  const model = { modelId: 'test-model' };
  const provider = jest.fn().mockReturnValue(model);
  const createProvider = jest.fn().mockReturnValue(provider);
  const GenerateObject = createGenerateObject({ createProvider });

  const outputSchema = { type: 'object', properties: { category: { type: 'string' } } };
  const connection = { apiKey: 'test-api-key' };
  const request = { model: 'test-model', prompt: 'Classify this.', schema: outputSchema };
  const result = await GenerateObject({ connection, request });

  expect(createProvider).toHaveBeenCalledWith({ connection });
  expect(provider).toHaveBeenCalledWith('test-model');
  expect(mockJsonSchema).toHaveBeenCalledWith(outputSchema);
  expect(mockGenerateText).toHaveBeenCalledWith({
    model,
    output: {
      outputSpec: { schema: { wrapped: outputSchema }, name: undefined, description: undefined },
    },
    prompt: 'Classify this.',
  });
  expect(result.object).toEqual({ category: 'billing' });
});

test('GenerateObject schema validates a minimal request', async () => {
  const { default: schema } = await import('./GenerateObjectSchema.js');
  expect(
    validate({
      schema,
      data: { model: 'test-model', prompt: 'Classify.', schema: { type: 'object' } },
    })
  ).toEqual({ valid: true });
});

test('GenerateObject schema throws when model is missing', async () => {
  const { default: schema } = await import('./GenerateObjectSchema.js');
  expect(() =>
    validate({ schema, data: { prompt: 'Classify.', schema: { type: 'object' } } })
  ).toThrow('GenerateObject request should have required property "model".');
});

test('GenerateObject schema throws when schema is missing', async () => {
  const { default: schema } = await import('./GenerateObjectSchema.js');
  expect(() => validate({ schema, data: { model: 'test-model', prompt: 'Classify.' } })).toThrow(
    'GenerateObject request should have required property "schema".'
  );
});

test('GenerateObject schema throws when schema is not an object', async () => {
  const { default: schema } = await import('./GenerateObjectSchema.js');
  expect(() =>
    validate({ schema, data: { model: 'test-model', prompt: 'Classify.', schema: 'invalid' } })
  ).toThrow('GenerateObject request property "schema" should be an object.');
});
