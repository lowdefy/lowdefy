/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { ConfigError } from '@lowdefy/errors/server';

import validateSchemas from './validateSchemas.js';

const mockLogger = {
  debug: jest.fn(),
};

const connectionSchema = {
  type: 'object',
  properties: {
    host: { type: 'string' },
    port: { type: 'integer' },
  },
};

const requestSchema = {
  type: 'object',
  properties: {
    collection: { type: 'string' },
    query: { type: 'object' },
  },
};

const requestConfig = {
  requestId: 'myRequest',
  type: 'MongoDBFind',
  '~k': 'key-456',
};

beforeEach(() => {
  mockLogger.debug.mockReset();
});

test('validateSchemas does not throw when both schemas pass', () => {
  expect(() =>
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: connectionSchema },
        connectionProperties: { host: 'localhost', port: 27017 },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 'users', query: {} },
      }
    )
  ).not.toThrow();
});

test('validateSchemas throws ConfigError when connection properties fail validation', () => {
  expect(() =>
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: connectionSchema },
        connectionProperties: { host: 123 },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 'users' },
      }
    )
  ).toThrow(ConfigError);
});

test('validateSchemas throws ConfigError when request properties fail validation', () => {
  expect(() =>
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: connectionSchema },
        connectionProperties: { host: 'localhost' },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 123 },
      }
    )
  ).toThrow(ConfigError);
});

test('validateSchemas throws ConfigError with configKey from requestConfig', () => {
  try {
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: connectionSchema },
        connectionProperties: { host: 123 },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 'users' },
      }
    );
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.configKey).toBe('key-456');
    return;
  }
  throw new Error('Expected validateSchemas to throw');
});

test('validateSchemas collects errors from both connection and request', () => {
  try {
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: connectionSchema },
        connectionProperties: { host: 123 },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 456 },
      }
    );
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.additionalErrors).toBeDefined();
    expect(error.additionalErrors.length).toBeGreaterThanOrEqual(1);
    expect(error.additionalErrors[0]).toBeInstanceOf(ConfigError);
    expect(error.additionalErrors[0].configKey).toBe('key-456');
    return;
  }
  throw new Error('Expected validateSchemas to throw');
});

test('validateSchemas throws primary error with additionalErrors for multiple violations', () => {
  const strictConnectionSchema = {
    type: 'object',
    properties: {
      host: { type: 'string' },
      port: { type: 'integer' },
    },
  };

  try {
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: strictConnectionSchema },
        connectionProperties: { host: 123, port: 'abc' },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 'users' },
      }
    );
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.additionalErrors).toBeDefined();
    expect(error.additionalErrors.length).toBe(1);
    return;
  }
  throw new Error('Expected validateSchemas to throw');
});

test('validateSchemas logs debug messages for each error', () => {
  try {
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: connectionSchema },
        connectionProperties: { host: 123 },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 'users' },
      }
    );
  } catch {
    // expected
  }
  expect(mockLogger.debug).toHaveBeenCalledTimes(1);
  expect(mockLogger.debug.mock.calls[0][0].params).toEqual({
    id: 'myRequest',
    type: 'MongoDBFind',
    configKey: 'key-456',
  });
});

test('validateSchemas does not throw with empty schemas', () => {
  expect(() =>
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: {} },
        connectionProperties: { anything: true },
        requestConfig,
        requestResolver: { schema: {} },
        requestProperties: { anything: true },
      }
    )
  ).not.toThrow();
});

test('validateSchemas throws single error without additionalErrors when only one violation', () => {
  try {
    validateSchemas(
      { logger: mockLogger },
      {
        connection: { schema: connectionSchema },
        connectionProperties: { host: 123 },
        requestConfig,
        requestResolver: { schema: requestSchema },
        requestProperties: { collection: 'users' },
      }
    );
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.additionalErrors).toBeUndefined();
    return;
  }
  throw new Error('Expected validateSchemas to throw');
});
