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

test('AnthropicChat resolver delegates to handleAgentChat', async () => {
  const mockResult = { text: 'Hello, world!' };
  mockHandleAgentChat.mockResolvedValue(mockResult);

  const { default: AnthropicChat } = await import('./AnthropicChat.js');

  const args = {
    connection: { provider: jest.fn() },
    properties: { agent: {}, messages: [] },
    context: {},
  };

  const result = await AnthropicChat.resolver(args);

  expect(mockHandleAgentChat).toHaveBeenCalledWith(args);
  expect(result).toBe(mockResult);
});

test('AnthropicChat has schema', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  expect(AnthropicChat.schema).toBeDefined();
});

test('valid agent schema', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  const agent = { model: 'claude-3-5-sonnet-20241022' };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('valid agent schema with all properties', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  const agent = {
    model: 'claude-3-5-sonnet-20241022',
    instructions: 'You are a helpful assistant.',
    maxSteps: 10,
    maxOutputTokens: 4096,
    temperature: 0.7,
    toolChoice: 'auto',
  };
  expect(validate({ schema, data: agent })).toEqual({ valid: true });
});

test('agent properties is not an object', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() => validate({ schema, data: 'agent' })).toThrow(
    'AnthropicChat agent properties should be an object.'
  );
});

test('model missing', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'AnthropicChat agent should have required property "model".'
  );
});

test('model is not a string', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() => validate({ schema, data: { model: 123 } })).toThrow(
    'AnthropicChat agent property "model" should be a string.'
  );
});

test('instructions is not a string', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() => validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', instructions: 42 } })).toThrow(
    'AnthropicChat agent property "instructions" should be a string.'
  );
});

test('maxSteps is not an integer', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', maxSteps: 'ten' } })
  ).toThrow('AnthropicChat agent property "maxSteps" should be an integer.');
});

test('maxSteps is less than 1', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', maxSteps: 0 } })
  ).toThrow('AnthropicChat agent property "maxSteps" should be at least 1.');
});

test('maxOutputTokens is less than 1', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', maxOutputTokens: 0 } })
  ).toThrow('AnthropicChat agent property "maxOutputTokens" should be at least 1.');
});

test('temperature is out of range', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', temperature: 3 } })
  ).toThrow('AnthropicChat agent property "temperature" should be at most 2.');
});

test('temperature below minimum', async () => {
  const { default: AnthropicChat } = await import('./AnthropicChat.js');
  const schema = AnthropicChat.schema;

  expect(() =>
    validate({ schema, data: { model: 'claude-3-5-sonnet-20241022', temperature: -1 } })
  ).toThrow('AnthropicChat agent property "temperature" should be at least 0.');
});
