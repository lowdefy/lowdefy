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

test('handleGenerateObject calls generateText with an Output.object spec and returns the parsed object', async () => {
  const { default: handleGenerateObject } = await import('./handleGenerateObject.js');
  mockGenerateText.mockResolvedValue({
    output: { category: 'billing' },
    reasoningText: undefined,
    finishReason: 'stop',
    usage: { inputTokens: 15, outputTokens: 5, totalTokens: 20 },
    providerMetadata: undefined,
    warnings: undefined,
  });
  const model = { modelId: 'test-model' };
  const schema = {
    type: 'object',
    properties: { category: { type: 'string' } },
  };
  const result = await handleGenerateObject({
    model,
    request: {
      model: 'test-model',
      prompt: 'Classify this ticket.',
      schema,
      schemaName: 'ticket_classification',
      schemaDescription: 'A support ticket classification.',
    },
  });
  expect(mockJsonSchema).toHaveBeenCalledWith(schema);
  expect(mockOutputObject).toHaveBeenCalledWith({
    schema: { wrapped: schema },
    name: 'ticket_classification',
    description: 'A support ticket classification.',
  });
  expect(mockGenerateText).toHaveBeenCalledWith({
    model,
    output: {
      outputSpec: {
        schema: { wrapped: schema },
        name: 'ticket_classification',
        description: 'A support ticket classification.',
      },
    },
    prompt: 'Classify this ticket.',
  });
  expect(result).toEqual({
    object: { category: 'billing' },
    reasoningText: undefined,
    finishReason: 'stop',
    usage: { inputTokens: 15, outputTokens: 5, totalTokens: 20 },
    providerMetadata: undefined,
    warnings: undefined,
  });
});

test('handleGenerateObject rejects when generateText rejects', async () => {
  const { default: handleGenerateObject } = await import('./handleGenerateObject.js');
  mockGenerateText.mockRejectedValue(new Error('No object generated.'));
  await expect(
    handleGenerateObject({
      model: { modelId: 'test-model' },
      request: { prompt: 'Classify.', schema: { type: 'object' } },
    })
  ).rejects.toThrow('No object generated.');
});

test('handleGenerateObject throws before calling generateText when prompt and messages are missing', async () => {
  const { default: handleGenerateObject } = await import('./handleGenerateObject.js');
  await expect(
    handleGenerateObject({
      model: { modelId: 'test-model' },
      request: { schema: { type: 'object' } },
    })
  ).rejects.toThrow('Either "prompt" or "messages" must be provided.');
  expect(mockGenerateText).not.toHaveBeenCalled();
});
