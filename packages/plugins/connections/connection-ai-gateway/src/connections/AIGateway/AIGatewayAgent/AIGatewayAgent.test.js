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

test('AIGatewayAgent resolver delegates to handleAgentChat', async () => {
  const mockResult = { text: 'Hello, world!' };
  mockHandleAgentChat.mockResolvedValue(mockResult);

  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: { properties: { model: 'anthropic/claude-sonnet-4.5' } },
      messages: [],
    },
    context: {},
  };

  const result = await AIGatewayAgent.resolver(args);

  expect(mockHandleAgentChat).toHaveBeenCalledWith(args);
  expect(result).toBe(mockResult);
});

test('AIGatewayAgent resolver maps order/only to providerOptions.gateway', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'anthropic/claude-sonnet-4.5',
          order: ['vertex', 'anthropic'],
          only: ['anthropic', 'vertex'],
        },
      },
      messages: [],
    },
    context: {},
  };

  await AIGatewayAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    gateway: { order: ['vertex', 'anthropic'], only: ['anthropic', 'vertex'] },
  });
});

test('AIGatewayAgent resolver maps fallbackModels to providerOptions.gateway.models', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'openai/gpt-5',
          fallbackModels: ['openai/gpt-5-mini', 'google/gemini-2.0-flash'],
        },
      },
      messages: [],
    },
    context: {},
  };

  await AIGatewayAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    gateway: { models: ['openai/gpt-5-mini', 'google/gemini-2.0-flash'] },
  });
});

test('AIGatewayAgent resolver maps user, tags, zeroDataRetention', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'openai/gpt-5',
          user: 'user-123',
          tags: ['chat', 'v2'],
          zeroDataRetention: true,
        },
      },
      messages: [],
    },
    context: {},
  };

  await AIGatewayAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    gateway: { user: 'user-123', tags: ['chat', 'v2'], zeroDataRetention: true },
  });
});

test('AIGatewayAgent resolver maps providerTimeouts and byok', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');

  const providerTimeouts = { byok: { openai: 5000, anthropic: 2000 } };
  const byok = { anthropic: [{ apiKey: 'sk-ant-xxx' }] };

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'anthropic/claude-sonnet-4.5',
          providerTimeouts,
          byok,
        },
      },
      messages: [],
    },
    context: {},
  };

  await AIGatewayAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    gateway: { providerTimeouts, byok },
  });
});

test('AIGatewayAgent resolver merges sugar props with existing providerOptions', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: {
        properties: {
          model: 'anthropic/claude-sonnet-4.5',
          tags: ['demo'],
          providerOptions: {
            gateway: { user: 'preexisting-user' },
            anthropic: { thinking: { type: 'enabled', budgetTokens: 5000 } },
          },
        },
      },
      messages: [],
    },
    context: {},
  };

  await AIGatewayAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toEqual({
    gateway: { user: 'preexisting-user', tags: ['demo'] },
    anthropic: { thinking: { type: 'enabled', budgetTokens: 5000 } },
  });
});

test('AIGatewayAgent resolver does not set providerOptions when no sugar props', async () => {
  mockHandleAgentChat.mockResolvedValue({ text: 'ok' });

  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: {
      agent: { properties: { model: 'openai/gpt-5' } },
      messages: [],
    },
    context: {},
  };

  await AIGatewayAgent.resolver(args);

  expect(args.properties.agent.properties.providerOptions).toBeUndefined();
});

test('AIGatewayAgent has schema', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  expect(AIGatewayAgent.schema).toBeDefined();
});

test('valid agent schema', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  const agent = { model: 'anthropic/claude-sonnet-4.5' };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('valid agent schema with all gateway sugar', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  const agent = {
    model: 'anthropic/claude-sonnet-4.5',
    instructions: 'You are a helpful assistant.',
    maxSteps: 10,
    maxOutputTokens: 4096,
    temperature: 0.7,
    toolChoice: 'auto',
    order: ['vertex', 'anthropic'],
    only: ['anthropic', 'vertex'],
    fallbackModels: ['openai/gpt-5-mini'],
    user: 'user-123',
    tags: ['demo'],
    zeroDataRetention: true,
    providerTimeouts: { byok: { openai: 5000 } },
    byok: { anthropic: [{ apiKey: 'sk-ant-xxx' }] },
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('agent properties is not an object', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() => validate({ schema, data: 'agent' })).toThrow(
    'AIGatewayAgent agent properties should be an object.'
  );
});

test('model missing', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'AIGatewayAgent agent should have required property "model".'
  );
});

test('model is not a string', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() => validate({ schema, data: { model: 123 } })).toThrow(
    'AIGatewayAgent agent property "model" should be a string.'
  );
});

test('order is not an array of strings', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() => validate({ schema, data: { model: 'openai/gpt-5', order: 'vertex' } })).toThrow(
    'AIGatewayAgent agent property "order" should be an array of strings.'
  );
});

test('fallbackModels is not an array of strings', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'openai/gpt-5', fallbackModels: 'openai/gpt-5-mini' } })
  ).toThrow('AIGatewayAgent agent property "fallbackModels" should be an array of strings.');
});

test('tags is not an array of strings', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() => validate({ schema, data: { model: 'openai/gpt-5', tags: 'demo' } })).toThrow(
    'AIGatewayAgent agent property "tags" should be an array of strings.'
  );
});

test('zeroDataRetention is not a boolean', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'openai/gpt-5', zeroDataRetention: 'yes' } })
  ).toThrow('AIGatewayAgent agent property "zeroDataRetention" should be a boolean.');
});

test('user is not a string', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() => validate({ schema, data: { model: 'openai/gpt-5', user: 42 } })).toThrow(
    'AIGatewayAgent agent property "user" should be a string.'
  );
});

test('providerTimeouts is not an object', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() =>
    validate({ schema, data: { model: 'openai/gpt-5', providerTimeouts: 'foo' } })
  ).toThrow('AIGatewayAgent agent property "providerTimeouts" should be an object.');
});

test('temperature out of range', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() => validate({ schema, data: { model: 'openai/gpt-5', temperature: 3 } })).toThrow(
    'AIGatewayAgent agent property "temperature" should be at most 2.'
  );
});

test('providerTimeouts.byok value below 1000 ms is rejected', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() =>
    validate({
      schema,
      data: {
        model: 'openai/gpt-5',
        providerTimeouts: { byok: { openai: 500 } },
      },
    })
  ).toThrow(
    'AIGatewayAgent agent property "providerTimeouts.byok" values should be at least 1000 ms.'
  );
});

test('providerTimeouts.byok value at 1000 ms is accepted', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(
    validate({
      schema,
      data: {
        model: 'openai/gpt-5',
        providerTimeouts: { byok: { openai: 1000, anthropic: 2000 } },
      },
    })
  ).toEqual({ valid: true });
});

test('byok value is not an array', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() =>
    validate({
      schema,
      data: { model: 'openai/gpt-5', byok: { anthropic: 'sk-ant-xxx' } },
    })
  ).toThrow('AIGatewayAgent agent property "byok" values should be arrays of credential objects.');
});

test('byok credentials are not objects', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(() =>
    validate({
      schema,
      data: { model: 'openai/gpt-5', byok: { anthropic: ['sk-ant-xxx'] } },
    })
  ).toThrow('AIGatewayAgent agent property "byok" credentials should be objects.');
});

test('valid byok with arrays of credential objects', async () => {
  const { default: AIGatewayAgent } = await import('./AIGatewayAgent.js');
  const schema = AIGatewayAgent.schema;

  expect(
    validate({
      schema,
      data: {
        model: 'openai/gpt-5',
        byok: {
          anthropic: [{ apiKey: 'sk-ant-xxx' }],
          vertex: [
            { projectId: 'proj-1', privateKey: 'pk-1' },
            { projectId: 'proj-2', privateKey: 'pk-2' },
          ],
        },
      },
    })
  ).toEqual({ valid: true });
});
