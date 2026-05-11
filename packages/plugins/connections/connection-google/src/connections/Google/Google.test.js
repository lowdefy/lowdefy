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

const mockCreateGoogleGenerativeAI = jest.fn();

jest.unstable_mockModule('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: mockCreateGoogleGenerativeAI,
}));

test('Google create returns provider with apiKey', async () => {
  const mockProvider = jest.fn();
  mockCreateGoogleGenerativeAI.mockReturnValue(mockProvider);

  const { default: Google } = await import('./Google.js');

  const result = Google.create({ connection: { apiKey: 'test-api-key' } });

  expect(mockCreateGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: 'test-api-key', baseURL: undefined });
  expect(result).toEqual({ provider: mockProvider });
});

test('Google create passes baseURL when provided', async () => {
  const mockProvider = jest.fn();
  mockCreateGoogleGenerativeAI.mockReturnValue(mockProvider);

  const { default: Google } = await import('./Google.js');

  const result = Google.create({
    connection: { apiKey: 'test-api-key', baseURL: 'https://custom.google.com' },
  });

  expect(mockCreateGoogleGenerativeAI).toHaveBeenCalledWith({
    apiKey: 'test-api-key',
    baseURL: 'https://custom.google.com',
  });
  expect(result).toEqual({ provider: mockProvider });
});

test('Google create handles undefined connection', async () => {
  const mockProvider = jest.fn();
  mockCreateGoogleGenerativeAI.mockReturnValue(mockProvider);

  const { default: Google } = await import('./Google.js');

  const result = Google.create({ connection: undefined });

  expect(mockCreateGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: undefined, baseURL: undefined });
  expect(result).toEqual({ provider: mockProvider });
});

test('Google has schema', async () => {
  const { default: Google } = await import('./Google.js');
  expect(Google.schema).toBeDefined();
});

test('valid connection schema', async () => {
  const { default: Google } = await import('./Google.js');
  const schema = Google.schema;

  const connection = { apiKey: 'AIza-test' };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with all properties', async () => {
  const { default: Google } = await import('./Google.js');
  const schema = Google.schema;

  const connection = { apiKey: 'AIza-test', baseURL: 'https://custom.google.com' };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('connection properties is not an object', async () => {
  const { default: Google } = await import('./Google.js');
  const schema = Google.schema;

  expect(() => validate({ schema, data: 'connection' })).toThrow(
    'Google connection properties should be an object.'
  );
});

test('apiKey missing', async () => {
  const { default: Google } = await import('./Google.js');
  const schema = Google.schema;

  expect(() => validate({ schema, data: {} })).toThrow(
    'Google connection should have required property "apiKey".'
  );
});

test('apiKey is not a string', async () => {
  const { default: Google } = await import('./Google.js');
  const schema = Google.schema;

  expect(() => validate({ schema, data: { apiKey: 123 } })).toThrow(
    'Google connection property "apiKey" should be a string.'
  );
});

test('baseURL is not a string', async () => {
  const { default: Google } = await import('./Google.js');
  const schema = Google.schema;

  expect(() => validate({ schema, data: { apiKey: 'AIza-test', baseURL: true } })).toThrow(
    'Google connection property "baseURL" should be a string.'
  );
});
