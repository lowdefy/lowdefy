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

const mockCreateOpenAI = jest.fn();

jest.unstable_mockModule('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}));

test('OpenAI create returns provider with apiKey', async () => {
  const mockProvider = jest.fn();
  mockCreateOpenAI.mockReturnValue(mockProvider);

  const { default: OpenAI } = await import('./OpenAI.js');

  const result = OpenAI.create({ connection: { apiKey: 'test-api-key' } });

  expect(mockCreateOpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key', baseURL: undefined });
  expect(result).toEqual({ provider: mockProvider });
});

test('OpenAI create passes baseURL when provided', async () => {
  const mockProvider = jest.fn();
  mockCreateOpenAI.mockReturnValue(mockProvider);

  const { default: OpenAI } = await import('./OpenAI.js');

  const result = OpenAI.create({
    connection: { apiKey: 'test-api-key', baseURL: 'https://custom.openai.com' },
  });

  expect(mockCreateOpenAI).toHaveBeenCalledWith({
    apiKey: 'test-api-key',
    baseURL: 'https://custom.openai.com',
  });
  expect(result).toEqual({ provider: mockProvider });
});

test('OpenAI create handles undefined connection', async () => {
  const mockProvider = jest.fn();
  mockCreateOpenAI.mockReturnValue(mockProvider);

  const { default: OpenAI } = await import('./OpenAI.js');

  const result = OpenAI.create({ connection: undefined });

  expect(mockCreateOpenAI).toHaveBeenCalledWith({ apiKey: undefined, baseURL: undefined });
  expect(result).toEqual({ provider: mockProvider });
});

test('OpenAI has schema', async () => {
  const { default: OpenAI } = await import('./OpenAI.js');
  expect(OpenAI.schema).toBeDefined();
});

test('valid connection schema', async () => {
  const { default: OpenAI } = await import('./OpenAI.js');
  const schema = OpenAI.schema;

  const connection = { apiKey: 'sk-test' };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with all properties', async () => {
  const { default: OpenAI } = await import('./OpenAI.js');
  const schema = OpenAI.schema;

  const connection = { apiKey: 'sk-test', baseURL: 'https://custom.openai.com' };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('connection properties is not an object', async () => {
  const { default: OpenAI } = await import('./OpenAI.js');
  const schema = OpenAI.schema;

  expect(() => validate({ schema, data: 'connection' })).toThrow(
    'OpenAI connection properties should be an object.'
  );
});

test('apiKey missing', async () => {
  const { default: OpenAI } = await import('./OpenAI.js');
  const schema = OpenAI.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'OpenAI connection should have required property "apiKey".'
  );
});

test('apiKey is not a string', async () => {
  const { default: OpenAI } = await import('./OpenAI.js');
  const schema = OpenAI.schema;

  expect(() => validate({ schema, data: { apiKey: 123 } })).toThrow(
    'OpenAI connection property "apiKey" should be a string.'
  );
});

test('baseURL is not a string', async () => {
  const { default: OpenAI } = await import('./OpenAI.js');
  const schema = OpenAI.schema;

  expect(() => validate({ schema, data: { apiKey: 'sk-test', baseURL: true } })).toThrow(
    'OpenAI connection property "baseURL" should be a string.'
  );
});
