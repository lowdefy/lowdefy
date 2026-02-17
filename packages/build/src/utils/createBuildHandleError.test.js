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
import { ConfigError } from '@lowdefy/errors';

import createBuildHandleError from './createBuildHandleError.js';
import createTestLogger from '../test-utils/createTestLogger.js';

test('handleError logs error directly', () => {
  const { logger, lines } = createTestLogger();
  const context = {
    logger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  handleError(new ConfigError({ message: 'Bad config' }));

  expect(lines).toHaveLength(1);
  expect(lines[0].msg).toBe('Bad config');
  expect(lines[0].err.name).toBe('ConfigError');
});

test('handleError resolves location from configKey before logging', () => {
  const { logger, lines } = createTestLogger();
  const context = {
    logger,
    keyMap: {
      abc123: { key: 'pages.0.blocks.0.type', '~r': 'ref1', '~l': 10 },
    },
    refMap: {
      ref1: { path: 'pages/home.yaml' },
    },
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  handleError(new ConfigError({ message: 'Invalid type', configKey: 'abc123' }));

  expect(lines[0].err.source).toBe('/app/pages/home.yaml:10');
});

test('handleError resolves location from filePath and lineNumber', () => {
  const { logger, lines } = createTestLogger();
  const context = {
    logger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  handleError(
    new ConfigError({
      message: 'Error parsing YAML',
      filePath: 'pages/home.yaml',
      lineNumber: 6,
    })
  );

  expect(lines[0].err.source).toBe('/app/pages/home.yaml:6');
});

test('handleError still logs when resolveErrorLocation throws', () => {
  const { logger, lines } = createTestLogger();
  const context = {
    logger,
    keyMap: null,
    refMap: null,
    directories: { config: '/app' },
  };
  Object.defineProperty(context, 'keyMap', {
    get() {
      throw new Error('keyMap exploded');
    },
  });
  const handleError = createBuildHandleError({ context });

  handleError(new ConfigError({ message: 'Something broke' }));

  expect(lines).toHaveLength(1);
  expect(lines[0].msg).toBe('Something broke');
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

test('handleError works with ConfigError that has received', () => {
  const { logger, lines } = createTestLogger();
  const context = {
    logger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  handleError(new ConfigError({ message: 'Invalid type', received: { type: 'Buton' } }));

  expect(lines[0].err.received).toEqual({ type: 'Buton' });
});

test('handleError works with plain Error (not ConfigError)', () => {
  const { logger, lines } = createTestLogger();
  const context = {
    logger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
  };
  const handleError = createBuildHandleError({ context });

  handleError(new Error('plain error'));

  expect(lines).toHaveLength(1);
  expect(lines[0].msg).toBe('plain error');
});

test('handleError works when directories is undefined', () => {
  const { logger, lines } = createTestLogger();
  const context = {
    logger,
    keyMap: {},
    refMap: {},
  };
  const handleError = createBuildHandleError({ context });

  handleError(new ConfigError({ message: 'No dirs' }));

  expect(lines).toHaveLength(1);
});
