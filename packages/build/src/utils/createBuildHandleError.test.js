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

import createBuildHandleError from './createBuildHandleError.js';

const mockPinoLogger = {
  error: jest.fn(),
};

beforeEach(() => {
  mockPinoLogger.error.mockClear();
});

test('handleError logs error with display string', () => {
  const context = {
    logger: mockPinoLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  const error = new ConfigError({ message: 'Bad config' });
  handleError(error);

  expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
  expect(mockPinoLogger.error).toHaveBeenCalledWith(
    { err: error },
    '[ConfigError] Bad config'
  );
});

test('handleError resolves location from configKey before logging', () => {
  const context = {
    logger: mockPinoLogger,
    keyMap: {
      abc123: { key: 'pages.0.blocks.0.type', '~r': 'ref1', '~l': 10 },
    },
    refMap: {
      ref1: { path: 'pages/home.yaml' },
    },
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  const error = new ConfigError({ message: 'Invalid type', configKey: 'abc123' });
  handleError(error);

  expect(error.source).toBe('/app/pages/home.yaml:10');
  expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
});

test('handleError falls back to error.message when resolveErrorLocation throws', () => {
  const context = {
    logger: mockPinoLogger,
    keyMap: null, // will cause resolveErrorLocation to throw
    refMap: null,
    directories: { config: '/app' },
  };
  // Force resolveErrorLocation to throw by passing a non-object keyMap
  Object.defineProperty(context, 'keyMap', {
    get() {
      throw new Error('keyMap exploded');
    },
  });
  const handleError = createBuildHandleError({ context });

  const error = new ConfigError({ message: 'Something broke' });
  handleError(error);

  expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
  expect(mockPinoLogger.error).toHaveBeenCalledWith(
    { err: error },
    'Something broke'
  );
});

test('handleError falls back to console.error when logger also throws', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const throwingLogger = {
    error: jest.fn(() => {
      throw new Error('logger broken');
    }),
  };
  const context = {
    logger: throwingLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  // Force first try to throw so we hit second try with throwingLogger
  Object.defineProperty(context, 'keyMap', {
    get() {
      throw new Error('keyMap exploded');
    },
  });
  const handleError = createBuildHandleError({ context });

  const error = new Error('total failure');
  handleError(error);

  expect(consoleSpy).toHaveBeenCalledWith(error);
  consoleSpy.mockRestore();
});

test('handleError includes received in display string', () => {
  const context = {
    logger: mockPinoLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  const error = new ConfigError({ message: 'Invalid type', received: { type: 'Buton' } });
  handleError(error);

  expect(mockPinoLogger.error).toHaveBeenCalledWith(
    { err: error },
    '[ConfigError] Invalid type Received: {"type":"Buton"}'
  );
});

test('handleError works with plain Error (not ConfigError)', () => {
  const context = {
    logger: mockPinoLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  const error = new Error('plain error');
  handleError(error);

  expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
  expect(mockPinoLogger.error).toHaveBeenCalledWith(
    { err: error },
    '[Error] plain error'
  );
});

test('handleError works when directories is undefined', () => {
  const context = {
    logger: mockPinoLogger,
    keyMap: {},
    refMap: {},
  };
  const handleError = createBuildHandleError({ context });

  const error = new ConfigError({ message: 'No dirs' });
  handleError(error);

  expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
});
