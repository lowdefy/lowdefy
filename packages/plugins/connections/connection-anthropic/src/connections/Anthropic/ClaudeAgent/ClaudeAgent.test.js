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

test('ClaudeAgent resolver delegates to handleAgentChat', async () => {
  const mockResult = { text: 'Hello, world!' };
  mockHandleAgentChat.mockResolvedValue(mockResult);

  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: { agent: { properties: { model: 'claude-3-5-sonnet' } }, messages: [] },
    context: {},
  };

  const result = await ClaudeAgent.resolver(args);

  expect(mockHandleAgentChat).toHaveBeenCalledWith(args);
  expect(result).toBe(mockResult);
});

test('ClaudeAgent resolver maps thinking to providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');

  const thinking = { type: 'enabled', budgetTokens: 10000 };
  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: { properties: { model: 'claude-3-5-sonnet', thinking } },
      messages: [],
    },
    context: {},
  };

  await ClaudeAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    anthropic: { thinking },
  });
});

test('ClaudeAgent resolver maps effort to providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: { properties: { model: 'claude-3-5-sonnet', effort: 'high' } },
      messages: [],
    },
    context: {},
  };

  await ClaudeAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    anthropic: { effort: 'high' },
  });
});

test('ClaudeAgent resolver merges sugar props with existing providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');

  const thinking = { type: 'enabled', budgetTokens: 5000 };
  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'claude-3-5-sonnet',
          thinking,
          providerOptions: { anthropic: { cacheControl: true } },
        },
      },
      messages: [],
    },
    context: {},
  };

  await ClaudeAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    anthropic: { cacheControl: true, thinking },
  });
});

test('ClaudeAgent resolver does not set providerOptions when no sugar props', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: { properties: { model: 'claude-3-5-sonnet' } },
      messages: [],
    },
    context: {},
  };

  await ClaudeAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toBeUndefined();
});

test('ClaudeAgent has schema', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  expect(ClaudeAgent.schema).toBeDefined();
});

test('valid agent schema', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  const agent = { model: 'claude-3-5-sonnet-20241022' };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('valid agent schema with all properties', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  const agent = {
    model: 'claude-3-5-sonnet-20241022',
    instructions: 'You are a helpful assistant.',
    maxSteps: 10,
    maxOutputTokens: 4096,
    temperature: 0.7,
    toolChoice: 'auto',
    thinking: { type: 'enabled', budgetTokens: 10000 },
    effort: 'high',
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('agent properties is not an object', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() => validate({ schema, data: 'agent' })).toThrow(
    'ClaudeAgent agent properties should be an object.'
  );
});

test('model missing', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'ClaudeAgent agent should have required property "model".'
  );
});

test('model is not a string', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() => validate({ schema, data: { model: 123 } })).toThrow(
    'ClaudeAgent agent property "model" should be a string.'
  );
});

test('instructions is not a string', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', instructions: 42 } })
  ).toThrow('ClaudeAgent agent property "instructions" should be a string.');
});

test('maxSteps is not an integer', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', maxSteps: 'ten' } })
  ).toThrow('ClaudeAgent agent property "maxSteps" should be an integer.');
});

test('maxSteps is less than 1', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', maxSteps: 0 } })
  ).toThrow('ClaudeAgent agent property "maxSteps" should be at least 1.');
});

test('maxOutputTokens is less than 1', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', maxOutputTokens: 0 } })
  ).toThrow('ClaudeAgent agent property "maxOutputTokens" should be at least 1.');
});

test('temperature is out of range', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', temperature: 3 } })
  ).toThrow('ClaudeAgent agent property "temperature" should be at most 2.');
});

test('temperature below minimum', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', temperature: -1 } })
  ).toThrow('ClaudeAgent agent property "temperature" should be at least 0.');
});

test('thinking is not an object', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', thinking: 'enabled' } })
  ).toThrow('ClaudeAgent agent property "thinking" should be an object.');
});

test('effort is not a valid enum value', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', effort: 'max' } })
  ).toThrow('ClaudeAgent agent property "effort" should be one of "low", "medium", or "high".');
});

test('effort is not a string', async () => {
  const { default: ClaudeAgent } = await import('./ClaudeAgent.js');
  const schema = ClaudeAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', effort: 42 } })
  ).toThrow('ClaudeAgent agent property "effort" should be a string.');
});
