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
import collectConfigError from './collectConfigError.js';

const mockLogger = {
  error: jest.fn(),
};

beforeEach(() => {
  mockLogger.error.mockClear();
});

test('collectConfigError throws when context.errors does not exist', () => {
  expect(() =>
    collectConfigError({
      message: 'Test error',
      configKey: 'abc123',
      context: {
        keyMap: {},
        refMap: {},
        directories: { config: '/app' },
      },
    })
  ).toThrow('[Config Error] Test error');
});

test('collectConfigError collects error when context.errors exists', () => {
  const context = {
    errors: [],
    logger: mockLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  collectConfigError({
    message: 'Test error',
    configKey: 'abc123',
    context,
  });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toContain('[Config Error] Test error');
  expect(mockLogger.error).toHaveBeenCalledTimes(1);
});

test('collectConfigError collects multiple errors', () => {
  const context = {
    errors: [],
    logger: mockLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  collectConfigError({
    message: 'First error',
    configKey: 'abc123',
    context,
  });

  collectConfigError({
    message: 'Second error',
    configKey: 'def456',
    context,
  });

  expect(context.errors).toHaveLength(2);
  expect(context.errors[0]).toContain('[Config Error] First error');
  expect(context.errors[1]).toContain('[Config Error] Second error');
  expect(mockLogger.error).toHaveBeenCalledTimes(2);
});

test('collectConfigError includes location information', () => {
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

  collectConfigError({
    message: 'Invalid block type',
    configKey: 'abc123',
    context,
  });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toContain('[Config Error] Invalid block type');
  expect(context.errors[0]).toContain('pages/home.yaml:10');
});

test('collectConfigError works without logger', () => {
  const context = {
    errors: [],
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  collectConfigError({
    message: 'Test error',
    configKey: 'abc123',
    context,
  });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toContain('[Config Error] Test error');
});

test('collectConfigError works with logger.error as null', () => {
  const context = {
    errors: [],
    logger: { error: null },
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  collectConfigError({
    message: 'Test error',
    configKey: 'abc123',
    context,
  });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toContain('[Config Error] Test error');
});

test('collectConfigError with no configKey', () => {
  const context = {
    errors: [],
    logger: mockLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };

  collectConfigError({
    message: 'Error without configKey',
    context,
  });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBe('[Config Error] Error without configKey');
});
