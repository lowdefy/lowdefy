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

const mockHandleGenerateText = jest.fn();

jest.unstable_mockModule('@lowdefy/ai-utils', () => ({
  handleGenerateObject: jest.fn(),
  handleGenerateText: mockHandleGenerateText,
}));

test('GenerateText resolver builds a model from the connection and delegates to handleGenerateText', async () => {
  const mockResult = { text: 'Hello, world!', finishReason: 'stop' };
  mockHandleGenerateText.mockResolvedValue(mockResult);

  const { default: GenerateText } = await import('./GenerateText.js');

  const request = { model: 'test-model', prompt: 'Say hello.' };
  const result = await GenerateText({
    connection: { apiKey: 'test-api-key' },
    request,
  });

  expect(mockHandleGenerateText).toHaveBeenCalledTimes(1);
  const callArgs = mockHandleGenerateText.mock.calls[0][0];
  expect(callArgs.request).toEqual(request);
  expect(callArgs.model).toBeDefined();
  expect(callArgs.model.modelId).toBe('test-model');
  expect(result).toBe(mockResult);
});

test('GenerateText meta and schema are defined', async () => {
  const { default: GenerateText } = await import('./GenerateText.js');
  expect(GenerateText.meta).toEqual({ checkRead: false, checkWrite: false });
  expect(GenerateText.schema).toBeDefined();
});

test('GenerateText schema validates a minimal request', async () => {
  const { default: schema } = await import('./schema.js');
  expect(validate({ schema, data: { model: 'test-model', prompt: 'Hello' } })).toEqual({
    valid: true,
  });
});

test('GenerateText schema validates a request with all properties', async () => {
  const { default: schema } = await import('./schema.js');
  const data = {
    model: 'test-model',
    prompt: 'Hello',
    system: 'You are helpful.',
    maxOutputTokens: 100,
    temperature: 0.5,
    topP: 0.9,
    topK: 40,
    frequencyPenalty: 0.1,
    presencePenalty: 0.2,
    seed: 42,
    stopSequences: ['END'],
    maxRetries: 3,
    providerOptions: { anthropic: {} },
  };
  expect(validate({ schema, data })).toEqual({ valid: true });
});

test('GenerateText schema throws when model is missing', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() => validate({ schema, data: { prompt: 'Hello' } })).toThrow(
    'GenerateText request should have required property "model".'
  );
});

test('GenerateText schema throws when model is not a string', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() => validate({ schema, data: { model: 1, prompt: 'Hello' } })).toThrow(
    'GenerateText request property "model" should be a string.'
  );
});

test('GenerateText schema throws when temperature is out of range', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() =>
    validate({ schema, data: { model: 'test-model', prompt: 'Hello', temperature: 3 } })
  ).toThrow('GenerateText request property "temperature" should be at most 2.');
});

test('GenerateText schema throws when messages is not an array', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() =>
    validate({ schema, data: { model: 'test-model', messages: 'Hello' } })
  ).toThrow('GenerateText request property "messages" should be an array of objects.');
});

test('GenerateText schema throws when providerOptions is not an object', async () => {
  const { default: schema } = await import('./schema.js');
  expect(() =>
    validate({ schema, data: { model: 'test-model', prompt: 'Hello', providerOptions: 'x' } })
  ).toThrow('GenerateText request property "providerOptions" should be an object.');
});
