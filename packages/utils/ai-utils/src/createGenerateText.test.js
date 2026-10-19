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

jest.unstable_mockModule('ai', () => ({
  generateText: mockGenerateText,
}));

beforeEach(() => {
  mockGenerateText.mockReset();
});

test('createGenerateText returns a resolver with schema and meta attached', async () => {
  const { default: createGenerateText } = await import('./createGenerateText.js');
  const GenerateText = createGenerateText({ createProvider: jest.fn() });
  expect(GenerateText.meta).toEqual({ checkRead: false, checkWrite: false });
  expect(GenerateText.schema).toBeDefined();
  expect(GenerateText.schema.title).toBe('Lowdefy Request Schema - GenerateText');
});

test('GenerateText resolver builds the provider from connection properties and delegates', async () => {
  const { default: createGenerateText } = await import('./createGenerateText.js');
  mockGenerateText.mockResolvedValue({
    text: 'Hello, world!',
    finishReason: 'stop',
    usage: { totalTokens: 10 },
  });

  const model = { modelId: 'test-model' };
  const provider = jest.fn().mockReturnValue(model);
  const createProvider = jest.fn().mockReturnValue(provider);
  const GenerateText = createGenerateText({ createProvider });

  const connection = { apiKey: 'test-api-key' };
  const request = { model: 'test-model', prompt: 'Say hello.', temperature: 0.5 };
  const result = await GenerateText({ connection, request });

  expect(createProvider).toHaveBeenCalledWith({ connection });
  expect(provider).toHaveBeenCalledWith('test-model');
  expect(mockGenerateText).toHaveBeenCalledWith({
    model,
    prompt: 'Say hello.',
    temperature: 0.5,
  });
  expect(result).toEqual({
    text: 'Hello, world!',
    reasoningText: undefined,
    finishReason: 'stop',
    usage: { totalTokens: 10 },
    providerMetadata: undefined,
    warnings: undefined,
  });
});

test('GenerateText resolver rejects when the model call rejects', async () => {
  const { default: createGenerateText } = await import('./createGenerateText.js');
  mockGenerateText.mockRejectedValue(new Error('API rate limit exceeded'));
  const GenerateText = createGenerateText({
    createProvider: jest.fn().mockReturnValue(jest.fn().mockReturnValue({})),
  });
  await expect(
    GenerateText({ connection: { apiKey: 'k' }, request: { model: 'm', prompt: 'Hello' } })
  ).rejects.toThrow('API rate limit exceeded');
});

test('GenerateText schema validates a minimal request', async () => {
  const { default: schema } = await import('./GenerateTextSchema.js');
  expect(validate({ schema, data: { model: 'test-model', prompt: 'Hello' } })).toEqual({
    valid: true,
  });
});

test('GenerateText schema validates a request with all properties', async () => {
  const { default: schema } = await import('./GenerateTextSchema.js');
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
  const { default: schema } = await import('./GenerateTextSchema.js');
  expect(() => validate({ schema, data: { prompt: 'Hello' } })).toThrow(
    'GenerateText request should have required property "model".'
  );
});

test('GenerateText schema throws when model is not a string', async () => {
  const { default: schema } = await import('./GenerateTextSchema.js');
  expect(() => validate({ schema, data: { model: 1, prompt: 'Hello' } })).toThrow(
    'GenerateText request property "model" should be a string.'
  );
});

test('GenerateText schema throws when temperature is out of range', async () => {
  const { default: schema } = await import('./GenerateTextSchema.js');
  expect(() =>
    validate({ schema, data: { model: 'test-model', prompt: 'Hello', temperature: 3 } })
  ).toThrow('GenerateText request property "temperature" should be at most 2.');
});

test('GenerateText schema throws when messages is not an array', async () => {
  const { default: schema } = await import('./GenerateTextSchema.js');
  expect(() => validate({ schema, data: { model: 'test-model', messages: 'Hello' } })).toThrow(
    'GenerateText request property "messages" should be an array of objects.'
  );
});

test('GenerateText schema throws when providerOptions is not an object', async () => {
  const { default: schema } = await import('./GenerateTextSchema.js');
  expect(() =>
    validate({ schema, data: { model: 'test-model', prompt: 'Hello', providerOptions: 'x' } })
  ).toThrow('GenerateText request property "providerOptions" should be an object.');
});
