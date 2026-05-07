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

const mockCreateGateway = jest.fn();

jest.unstable_mockModule('@ai-sdk/gateway', () => ({
  createGateway: mockCreateGateway,
}));

test('AIGateway create returns provider with apiKey', async () => {
  const mockProvider = jest.fn();
  mockCreateGateway.mockReturnValue(mockProvider);

  const { default: AIGateway } = await import('./AIGateway.js');

  const result = AIGateway.create({ connection: { apiKey: 'test-api-key' } });

  expect(mockCreateGateway).toHaveBeenCalledWith({
    apiKey: 'test-api-key',
    baseURL: undefined,
    headers: undefined,
  });
  expect(result).toEqual({ provider: mockProvider });
});

test('AIGateway create passes baseURL and headers when provided', async () => {
  const mockProvider = jest.fn();
  mockCreateGateway.mockReturnValue(mockProvider);

  const { default: AIGateway } = await import('./AIGateway.js');

  const result = AIGateway.create({
    connection: {
      apiKey: 'test-api-key',
      baseURL: 'https://custom.gateway.example',
      headers: { 'x-org': 'lowdefy' },
    },
  });

  expect(mockCreateGateway).toHaveBeenCalledWith({
    apiKey: 'test-api-key',
    baseURL: 'https://custom.gateway.example',
    headers: { 'x-org': 'lowdefy' },
  });
  expect(result).toEqual({ provider: mockProvider });
});

test('AIGateway create handles undefined connection (OIDC / env fallback)', async () => {
  const mockProvider = jest.fn();
  mockCreateGateway.mockReturnValue(mockProvider);

  const { default: AIGateway } = await import('./AIGateway.js');

  const result = AIGateway.create({ connection: undefined });

  expect(mockCreateGateway).toHaveBeenCalledWith({
    apiKey: undefined,
    baseURL: undefined,
    headers: undefined,
  });
  expect(result).toEqual({ provider: mockProvider });
});

test('AIGateway has schema', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  expect(AIGateway.schema).toBeDefined();
});

test('valid connection schema with apiKey', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  const schema = AIGateway.schema;

  const connection = { apiKey: 'vck-test' };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with no apiKey (env/OIDC path)', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  const schema = AIGateway.schema;

  expect(validate({ schema, data: {} })).toEqual({ valid: true });
});

test('valid connection schema with all properties', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  const schema = AIGateway.schema;

  const connection = {
    apiKey: 'vck-test',
    baseURL: 'https://custom.gateway.example',
    headers: { 'x-org': 'lowdefy' },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('connection properties is not an object', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  const schema = AIGateway.schema;

  expect(() => validate({ schema, data: 'connection' })).toThrow(
    'AIGateway connection properties should be an object.'
  );
});

test('apiKey is not a string', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  const schema = AIGateway.schema;

  expect(() => validate({ schema, data: { apiKey: 123 } })).toThrow(
    'AIGateway connection property "apiKey" should be a string.'
  );
});

test('baseURL is not a string', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  const schema = AIGateway.schema;

  expect(() => validate({ schema, data: { baseURL: true } })).toThrow(
    'AIGateway connection property "baseURL" should be a string.'
  );
});

test('headers is not an object', async () => {
  const { default: AIGateway } = await import('./AIGateway.js');
  const schema = AIGateway.schema;

  expect(() => validate({ schema, data: { headers: 'x-org: lowdefy' } })).toThrow(
    'AIGateway connection property "headers" should be an object of strings.'
  );
});
