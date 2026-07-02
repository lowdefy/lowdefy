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

const mockHandleGenerateObject = jest.fn();

jest.unstable_mockModule('@lowdefy/ai-utils', () => ({
  handleGenerateObject: mockHandleGenerateObject,
  handleGenerateText: jest.fn(),
}));

test('GenerateObject resolver builds a model from the connection and delegates to handleGenerateObject', async () => {
  const mockResult = { object: { category: 'billing' }, finishReason: 'stop' };
  mockHandleGenerateObject.mockResolvedValue(mockResult);

  const { default: GenerateObject } = await import('./GenerateObject.js');

  const request = {
    model: 'test-model',
    prompt: 'Classify this ticket.',
    schema: { type: 'object', properties: { category: { type: 'string' } } },
  };
  const result = await GenerateObject({
    connection: { apiKey: 'test-api-key' },
    request,
  });

  expect(mockHandleGenerateObject).toHaveBeenCalledTimes(1);
  const callArgs = mockHandleGenerateObject.mock.calls[0][0];
  expect(callArgs.request).toEqual(request);
  expect(callArgs.model).toBeDefined();
  expect(callArgs.model.modelId).toBe('test-model');
  expect(result).toBe(mockResult);
});

test('GenerateObject meta and schema are defined', async () => {
  const { default: GenerateObject } = await import('./GenerateObject.js');
  expect(GenerateObject.meta).toEqual({ checkRead: false, checkWrite: false });
  expect(GenerateObject.schema).toBeDefined();
});

test('GenerateObject schema validates a minimal request', async () => {
  const { default: schema } = await import('./schema.js');
  expect(
    validate({
      schema,
      data: { model: 'test-model', prompt: 'Classify.', schema: { type: 'object' } },
    })
  ).toEqual({ valid: true });
});

test('GenerateObject schema throws when model is missing', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() =>
    validate({ schema, data: { prompt: 'Classify.', schema: { type: 'object' } } })
  ).toThrow('GenerateObject request should have required property "model".');
});

test('GenerateObject schema throws when schema is missing', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() => validate({ schema, data: { model: 'test-model', prompt: 'Classify.' } })).toThrow(
    'GenerateObject request should have required property "schema".'
  );
});

test('GenerateObject schema throws when schema is not an object', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() =>
    validate({ schema, data: { model: 'test-model', prompt: 'Classify.', schema: 'invalid' } })
  ).toThrow('GenerateObject request property "schema" should be an object.');
});
