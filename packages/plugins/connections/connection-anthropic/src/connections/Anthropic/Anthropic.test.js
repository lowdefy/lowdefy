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

const mockCreateAnthropic = jest.fn();

jest.unstable_mockModule('@ai-sdk/anthropic', () => ({
  createAnthropic: mockCreateAnthropic,
}));

test('Anthropic create returns provider with apiKey', async () => {
  const mockProvider = jest.fn();
  mockCreateAnthropic.mockReturnValue(mockProvider);

  const { default: Anthropic } = await import('./Anthropic.js');

  const result = Anthropic.create({ connection: { apiKey: 'test-api-key' } });

  expect(mockCreateAnthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key', baseURL: undefined });
  expect(result).toEqual({ provider: mockProvider });
});

test('Anthropic create passes baseURL when provided', async () => {
  const mockProvider = jest.fn();
  mockCreateAnthropic.mockReturnValue(mockProvider);

  const { default: Anthropic } = await import('./Anthropic.js');

  const result = Anthropic.create({
    connection: { apiKey: 'test-api-key', baseURL: 'https://custom.anthropic.com' },
  });

  expect(mockCreateAnthropic).toHaveBeenCalledWith({
    apiKey: 'test-api-key',
    baseURL: 'https://custom.anthropic.com',
  });
  expect(result).toEqual({ provider: mockProvider });
});

test('Anthropic create handles undefined connection', async () => {
  const mockProvider = jest.fn();
  mockCreateAnthropic.mockReturnValue(mockProvider);

  const { default: Anthropic } = await import('./Anthropic.js');

  const result = Anthropic.create({ connection: undefined });

  expect(mockCreateAnthropic).toHaveBeenCalledWith({ apiKey: undefined, baseURL: undefined });
  expect(result).toEqual({ provider: mockProvider });
});

test('Anthropic has schema', async () => {
  const { default: Anthropic } = await import('./Anthropic.js');
  expect(Anthropic.schema).toBeDefined();
});

test('valid connection schema', async () => {
  const { default: Anthropic } = await import('./Anthropic.js');
  const schema = Anthropic.schema;

  const connection = { apiKey: 'sk-ant-test' };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with all properties', async () => {
  const { default: Anthropic } = await import('./Anthropic.js');
  const schema = Anthropic.schema;

  const connection = { apiKey: 'sk-ant-test', baseURL: 'https://custom.anthropic.com' };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('connection properties is not an object', async () => {
  const { default: Anthropic } = await import('./Anthropic.js');
  const schema = Anthropic.schema;

  expect(() => validate({ schema, data: 'connection' })).toThrow(
    'Anthropic connection properties should be an object.'
  );
});

test('apiKey missing', async () => {
  const { default: Anthropic } = await import('./Anthropic.js');
  const schema = Anthropic.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'Anthropic connection should have required property "apiKey".'
  );
});

test('apiKey is not a string', async () => {
  const { default: Anthropic } = await import('./Anthropic.js');
  const schema = Anthropic.schema;

  expect(() => validate({ schema, data: { apiKey: 123 } })).toThrow(
    'Anthropic connection property "apiKey" should be a string.'
  );
});

test('baseURL is not a string', async () => {
  const { default: Anthropic } = await import('./Anthropic.js');
  const schema = Anthropic.schema;

  expect(() => validate({ schema, data: { apiKey: 'sk-ant-test', baseURL: true } })).toThrow(
    'Anthropic connection property "baseURL" should be a string.'
  );
});
