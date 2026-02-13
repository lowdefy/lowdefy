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
import { ConfigError } from '@lowdefy/errors/build';

import collectExceptions from './collectExceptions.js';

const mockLogger = {
  error: jest.fn(),
};

beforeEach(() => {
  mockLogger.error.mockClear();
});

test('collectExceptions throws when context.errors does not exist', () => {
  const context = {
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  const error = new ConfigError({
    message: 'Test error',
    configKey: 'abc123',
    context,
  });

  expect(() => collectExceptions(context, error)).toThrow(ConfigError);
  expect(() => collectExceptions(context, error)).toThrow('Test error');
});

test('collectExceptions collects error when context.errors exists', () => {
  const context = {
    errors: [],
    logger: mockLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  const error = new ConfigError({
    message: 'Test error',
    configKey: 'abc123',
    context,
  });

  collectExceptions(context, error);

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigError);
  expect(context.errors[0].message).toBe('Test error');
  expect(context.errors[0].source).toBeNull();
});

test('collectExceptions collects multiple errors', () => {
  const context = {
    errors: [],
    logger: mockLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  collectExceptions(
    context,
    new ConfigError({ message: 'First error', configKey: 'abc123', context })
  );

  collectExceptions(
    context,
    new ConfigError({ message: 'Second error', configKey: 'def456', context })
  );

  expect(context.errors).toHaveLength(2);
  expect(context.errors[0].message).toBe('First error');
  expect(context.errors[1].message).toBe('Second error');
});

test('collectExceptions includes location information', () => {
  const context = {
    errors: [],
    logger: mockLogger,
    keyMap: {
      abc123: { key: 'pages.0.blocks.0.type', '~r': 'ref1', '~l': 10 },
    },
    refMap: {
      ref1: { path: 'pages/home.yaml' },
    },
    directories: { config: '/app' },
  };

  const error = new ConfigError({
    message: 'Invalid block type',
    configKey: 'abc123',
    context,
  });

  collectExceptions(context, error);

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigError);
  expect(context.errors[0].source).toBe('/app/pages/home.yaml:10');
  expect(context.errors[0].message).toBe('Invalid block type');
});

test('collectExceptions works without logger', () => {
  const context = {
    errors: [],
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  const error = new ConfigError({
    message: 'Test error',
    configKey: 'abc123',
    context,
  });

  collectExceptions(context, error);

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe('Test error');
});

test('collectExceptions with no configKey', () => {
  const context = {
    errors: [],
    logger: mockLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  const error = new ConfigError({
    message: 'Error without configKey',
    context,
  });

  collectExceptions(context, error);

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigError);
  expect(context.errors[0].source).toBeNull();
  expect(context.errors[0].message).toBe('Error without configKey');
});

test('collectExceptions deduplicates by source', () => {
  const context = {
    errors: [],
    seenSourceLines: new Set(),
    keyMap: {
      abc123: { key: 'pages.0.blocks.0.type', '~r': 'ref1', '~l': 10 },
    },
    refMap: {
      ref1: { path: 'pages/home.yaml' },
    },
    directories: { config: '/app' },
  };

  // Same source location - second should be deduplicated
  collectExceptions(
    context,
    new ConfigError({ message: 'First error', configKey: 'abc123', context })
  );
  collectExceptions(
    context,
    new ConfigError({ message: 'Second error', configKey: 'abc123', context })
  );

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe('First error');
});

test('collectExceptions skips suppressed errors', () => {
  const context = {
    errors: [],
    seenSourceLines: new Set(),
    keyMap: {
      abc123: { key: 'pages.0', '~ignoreBuildChecks': true },
    },
    refMap: {},
    directories: { config: '/app' },
  };

  const error = new ConfigError({
    message: 'Suppressed error',
    configKey: 'abc123',
    context,
  });

  collectExceptions(context, error);

  expect(context.errors).toHaveLength(0);
});
