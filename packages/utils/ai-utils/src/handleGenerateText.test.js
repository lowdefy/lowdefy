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

jest.unstable_mockModule('ai', () => ({
  generateText: mockGenerateText,
}));

beforeEach(() => {
  mockGenerateText.mockReset();
});

test('handleGenerateText calls generateText with model and mapped options and returns the result fields', async () => {
  const { default: handleGenerateText } = await import('./handleGenerateText.js');
  mockGenerateText.mockResolvedValue({
    text: 'Generated response',
    reasoningText: 'Some reasoning',
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    providerMetadata: { anthropic: {} },
    warnings: [],
    steps: [{ internal: true }],
  });
  const model = { modelId: 'test-model' };
  const result = await handleGenerateText({
    model,
    request: { model: 'test-model', prompt: 'Hello', temperature: 0.5 },
  });
  expect(mockGenerateText).toHaveBeenCalledWith({
    model,
    prompt: 'Hello',
    temperature: 0.5,
  });
  expect(result).toEqual({
    text: 'Generated response',
    reasoningText: 'Some reasoning',
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    providerMetadata: { anthropic: {} },
    warnings: [],
  });
});

test('handleGenerateText passes providerOptions through to generateText', async () => {
  const { default: handleGenerateText } = await import('./handleGenerateText.js');
  mockGenerateText.mockResolvedValue({ text: 'ok' });
  await handleGenerateText({
    model: { modelId: 'test-model' },
    request: {
      prompt: 'Hello',
      providerOptions: { anthropic: { thinking: { type: 'enabled', budgetTokens: 1024 } } },
    },
  });
  expect(mockGenerateText.mock.calls[0][0].providerOptions).toEqual({
    anthropic: { thinking: { type: 'enabled', budgetTokens: 1024 } },
  });
});

test('handleGenerateText rejects when generateText rejects', async () => {
  const { default: handleGenerateText } = await import('./handleGenerateText.js');
  mockGenerateText.mockRejectedValue(new Error('API rate limit exceeded'));
  await expect(
    handleGenerateText({ model: { modelId: 'test-model' }, request: { prompt: 'Hello' } })
  ).rejects.toThrow('API rate limit exceeded');
});

test('handleGenerateText throws before calling generateText when prompt and messages are missing', async () => {
  const { default: handleGenerateText } = await import('./handleGenerateText.js');
  await expect(
    handleGenerateText({ model: { modelId: 'test-model' }, request: {} })
  ).rejects.toThrow('Either "prompt" or "messages" must be provided.');
  expect(mockGenerateText).not.toHaveBeenCalled();
});
