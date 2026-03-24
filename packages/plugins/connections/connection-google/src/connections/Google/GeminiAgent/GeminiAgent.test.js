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

const mockHandleAgentChat = jest.fn();

jest.unstable_mockModule('@lowdefy/ai-utils', () => ({
  handleAgentChat: mockHandleAgentChat,
}));

test('GeminiAgent resolver delegates to handleAgentChat', async () => {
  const mockResult = { text: 'Hello, world!' };
  mockHandleAgentChat.mockResolvedValue(mockResult);

  const { default: GeminiAgent } = await import('./GeminiAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: { agent: { properties: { model: 'gemini-2.5-flash' } }, messages: [] },
    context: {},
  };

  const result = await GeminiAgent.resolver(args);

  expect(mockHandleAgentChat).toHaveBeenCalledWith(args);
  expect(result).toBe(mockResult);
});

test('GeminiAgent resolver maps thinkingConfig to providerOptions.google', async () => {
  mockHandleAgentChat.mockResolvedValue({});

  const { default: GeminiAgent } = await import('./GeminiAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'gemini-2.5-flash',
          thinkingConfig: { thinkingBudget: 8192, includeThoughts: true },
        },
      },
      messages: [],
    },
    context: {},
  };

  await GeminiAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    google: { thinkingConfig: { thinkingBudget: 8192, includeThoughts: true } },
  });
});

test('GeminiAgent resolver maps safetySettings to providerOptions.google', async () => {
  mockHandleAgentChat.mockResolvedValue({});

  const { default: GeminiAgent } = await import('./GeminiAgent.js');

  const safetySettings = [
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  ];
  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: { model: 'gemini-2.5-flash', safetySettings },
      },
      messages: [],
    },
    context: {},
  };

  await GeminiAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    google: { safetySettings },
  });
});

test('GeminiAgent resolver merges sugar with existing providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({});

  const { default: GeminiAgent } = await import('./GeminiAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'gemini-2.5-flash',
          thinkingConfig: { thinkingBudget: 4096 },
          providerOptions: { google: { cachedContent: 'cachedContents/abc' } },
        },
      },
      messages: [],
    },
    context: {},
  };

  await GeminiAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    google: {
      cachedContent: 'cachedContents/abc',
      thinkingConfig: { thinkingBudget: 4096 },
    },
  });
});

test('GeminiAgent resolver does not modify providerOptions when no sugar props', async () => {
  mockHandleAgentChat.mockResolvedValue({});

  const { default: GeminiAgent } = await import('./GeminiAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: { properties: { model: 'gemini-2.5-flash' } },
      messages: [],
    },
    context: {},
  };

  await GeminiAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toBeUndefined();
});

test('GeminiAgent has schema', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  expect(GeminiAgent.schema).toBeDefined();
});

test('valid agent schema', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  const agent = { model: 'gemini-1.5-pro' };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('valid agent schema with all properties', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  const agent = {
    model: 'gemini-1.5-pro',
    instructions: 'You are a helpful assistant.',
    maxSteps: 10,
    maxOutputTokens: 4096,
    temperature: 0.7,
    toolChoice: 'auto',
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('agent properties is not an object', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: 'agent' })).toThrow(
    'GeminiAgent agent properties should be an object.'
  );
});

test('model missing', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'GeminiAgent agent should have required property "model".'
  );
});

test('model is not a string', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: { model: 123 } })).toThrow(
    'GeminiAgent agent property "model" should be a string.'
  );
});

test('instructions is not a string', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: { model: 'gemini-1.5-pro', instructions: 42 } })).toThrow(
    'GeminiAgent agent property "instructions" should be a string.'
  );
});

test('maxSteps is not an integer', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: { model: 'gemini-1.5-pro', maxSteps: 'ten' } })).toThrow(
    'GeminiAgent agent property "maxSteps" should be an integer.'
  );
});

test('maxSteps is less than 1', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: { model: 'gemini-1.5-pro', maxSteps: 0 } })).toThrow(
    'GeminiAgent agent property "maxSteps" should be at least 1.'
  );
});

test('maxOutputTokens is less than 1', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: { model: 'gemini-1.5-pro', maxOutputTokens: 0 } })).toThrow(
    'GeminiAgent agent property "maxOutputTokens" should be at least 1.'
  );
});

test('temperature is out of range', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: { model: 'gemini-1.5-pro', temperature: 3 } })).toThrow(
    'GeminiAgent agent property "temperature" should be at most 2.'
  );
});

test('temperature below minimum', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() => validate({ schema, data: { model: 'gemini-1.5-pro', temperature: -1 } })).toThrow(
    'GeminiAgent agent property "temperature" should be at least 0.'
  );
});

test('valid schema with thinkingConfig', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  const agent = {
    model: 'gemini-2.5-flash',
    thinkingConfig: { thinkingBudget: 8192, includeThoughts: true },
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('valid schema with thinkingConfig thinkingLevel', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  const agent = {
    model: 'gemini-3-pro-preview',
    thinkingConfig: { thinkingLevel: 'high', includeThoughts: true },
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('valid schema with safetySettings', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  const agent = {
    model: 'gemini-2.5-flash',
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    ],
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('thinkingConfig is not an object', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'gemini-2.5-flash', thinkingConfig: 'enabled' } })
  ).toThrow('GeminiAgent agent property "thinkingConfig" should be an object.');
});

test('safetySettings is not an array', async () => {
  const { default: GeminiAgent } = await import('./GeminiAgent.js');
  const schema = GeminiAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'gemini-2.5-flash', safetySettings: {} } })
  ).toThrow('GeminiAgent agent property "safetySettings" should be an array.');
});
