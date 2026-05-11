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

test('OpenAIAgent resolver delegates to handleAgentChat', async () => {
  const mockResult = { text: 'Hello, world!' };
  mockHandleAgentChat.mockResolvedValue(mockResult);

  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: { agent: { properties: {} }, messages: [] },
    context: {},
  };

  const result = await OpenAIAgent.resolver(args);

  expect(mockHandleAgentChat).toHaveBeenCalledWith({
    connection: args.connection,
    properties: args.properties,
    context: args.context,
  });
  expect(result).toBe(mockResult);
});

test('OpenAIAgent resolver maps reasoningEffort to providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');

  const properties = {
    agent: { properties: { model: 'o3', reasoningEffort: 'high' } },
    messages: [],
  };
  const args = { connection: { provider: jest.fn() }, properties, context: {} };

  await OpenAIAgent.resolver(args);

  expect(properties.agent.properties.providerOptions).toEqual({
    openai: { reasoningEffort: 'high' },
  });
});

test('OpenAIAgent resolver maps reasoningSummary to providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');

  const properties = {
    agent: { properties: { model: 'o3', reasoningSummary: 'detailed' } },
    messages: [],
  };
  const args = { connection: { provider: jest.fn() }, properties, context: {} };

  await OpenAIAgent.resolver(args);

  expect(properties.agent.properties.providerOptions).toEqual({
    openai: { reasoningSummary: 'detailed' },
  });
});

test('OpenAIAgent resolver maps both reasoning props to providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');

  const properties = {
    agent: {
      properties: { model: 'o3', reasoningEffort: 'medium', reasoningSummary: 'auto' },
    },
    messages: [],
  };
  const args = { connection: { provider: jest.fn() }, properties, context: {} };

  await OpenAIAgent.resolver(args);

  expect(properties.agent.properties.providerOptions).toEqual({
    openai: { reasoningEffort: 'medium', reasoningSummary: 'auto' },
  });
});

test('OpenAIAgent resolver merges with existing providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');

  const properties = {
    agent: {
      properties: {
        model: 'o3',
        reasoningEffort: 'high',
        providerOptions: { openai: { strictJsonSchema: true } },
      },
    },
    messages: [],
  };
  const args = { connection: { provider: jest.fn() }, properties, context: {} };

  await OpenAIAgent.resolver(args);

  expect(properties.agent.properties.providerOptions).toEqual({
    openai: { strictJsonSchema: true, reasoningEffort: 'high' },
  });
});

test('OpenAIAgent resolver does not set providerOptions when no sugar props', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');

  const properties = {
    agent: { properties: { model: 'gpt-4o' } },
    messages: [],
  };
  const args = { connection: { provider: jest.fn() }, properties, context: {} };

  await OpenAIAgent.resolver(args);

  expect(properties.agent.properties.providerOptions).toBeUndefined();
});

test('OpenAIAgent has schema', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  expect(OpenAIAgent.schema).toBeDefined();
});

test('valid agent schema', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  const agent = { model: 'gpt-4o' };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('valid agent schema with all properties', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  const agent = {
    model: 'gpt-4o',
    instructions: 'You are a helpful assistant.',
    maxSteps: 10,
    maxOutputTokens: 4096,
    temperature: 0.7,
    toolChoice: 'auto',
    reasoningEffort: 'high',
    reasoningSummary: 'auto',
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('agent properties is not an object', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: 'agent' })).toThrow(
    'OpenAIAgent agent properties should be an object.'
  );
});

test('model missing', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'OpenAIAgent agent should have required property "model".'
  );
});

test('model is not a string', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 123 } })).toThrow(
    'OpenAIAgent agent property "model" should be a string.'
  );
});

test('instructions is not a string', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'gpt-4o', instructions: 42 } })).toThrow(
    'OpenAIAgent agent property "instructions" should be a string.'
  );
});

test('maxSteps is not an integer', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'gpt-4o', maxSteps: 'ten' } })).toThrow(
    'OpenAIAgent agent property "maxSteps" should be an integer.'
  );
});

test('maxSteps is less than 1', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'gpt-4o', maxSteps: 0 } })).toThrow(
    'OpenAIAgent agent property "maxSteps" should be at least 1.'
  );
});

test('maxOutputTokens is less than 1', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'gpt-4o', maxOutputTokens: 0 } })).toThrow(
    'OpenAIAgent agent property "maxOutputTokens" should be at least 1.'
  );
});

test('temperature is out of range', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'gpt-4o', temperature: 3 } })).toThrow(
    'OpenAIAgent agent property "temperature" should be at most 2.'
  );
});

test('temperature below minimum', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'gpt-4o', temperature: -1 } })).toThrow(
    'OpenAIAgent agent property "temperature" should be at least 0.'
  );
});

test('reasoningEffort is not a valid enum value', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'o3', reasoningEffort: 'ultra' } })).toThrow(
    'OpenAIAgent agent property "reasoningEffort" should be one of "none", "minimal", "low", "medium", "high", "xhigh".'
  );
});

test('reasoningEffort is not a string', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'o3', reasoningEffort: 5 } })).toThrow(
    'OpenAIAgent agent property "reasoningEffort" should be a string.'
  );
});

test('reasoningSummary is not a valid enum value', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'o3', reasoningSummary: 'verbose' } })).toThrow(
    'OpenAIAgent agent property "reasoningSummary" should be one of "auto", "detailed".'
  );
});

test('reasoningSummary is not a string', async () => {
  const { default: OpenAIAgent } = await import('./OpenAIAgent.js');
  const schema = OpenAIAgent.schema;

  expect(() => validate({ schema, data: { model: 'o3', reasoningSummary: true } })).toThrow(
    'OpenAIAgent agent property "reasoningSummary" should be a string.'
  );
});
