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

// eslint-disable-next-line no-unused-vars
import { jest } from '@jest/globals';
import createBrowserLogger from './createBrowserLogger.js';

const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleInfo = jest.fn();
const mockConsoleDebug = jest.fn();

beforeEach(() => {
  mockConsoleError.mockClear();
  mockConsoleWarn.mockClear();
  mockConsoleInfo.mockClear();
  mockConsoleDebug.mockClear();
  console.error = mockConsoleError;
  console.warn = mockConsoleWarn;
  console.info = mockConsoleInfo;
  console.debug = mockConsoleDebug;
});

function createLowdefyError({ name, message, source, received } = {}) {
  const error = new Error(message ?? 'test error');
  error.name = name ?? 'ConfigError';
  error.isLowdefyError = true;
  if (source) error.source = source;
  if (received !== undefined) error.received = received;
  return error;
}

describe('error level', () => {
  test('Lowdefy error is formatted via errorToDisplayString', () => {
    const logger = createBrowserLogger();
    logger.error(createLowdefyError({ name: 'ConfigError', message: 'bad config' }));
    expect(mockConsoleError).toHaveBeenCalledWith('[ConfigError] bad config');
  });

  test('Lowdefy error with source logs source in blue first', () => {
    const logger = createBrowserLogger();
    logger.error(createLowdefyError({ message: 'bad config', source: 'pages/home.yaml:5' }));
    expect(mockConsoleInfo).toHaveBeenCalledWith('%c%s', 'color: #4a9eff', 'pages/home.yaml:5');
    expect(mockConsoleError).toHaveBeenCalledWith('[ConfigError] bad config');
  });

  test('Lowdefy error without source does not log source', () => {
    const logger = createBrowserLogger();
    logger.error(createLowdefyError({ message: 'no source' }));
    expect(mockConsoleInfo).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith('[ConfigError] no source');
  });

  test('non-Lowdefy error passes through raw', () => {
    const logger = createBrowserLogger();
    const err = new Error('raw error');
    logger.error(err);
    expect(mockConsoleError).toHaveBeenCalledWith(err);
  });

  test('non-error arguments pass through raw', () => {
    const logger = createBrowserLogger();
    logger.error('string message', 42);
    expect(mockConsoleError).toHaveBeenCalledWith('string message', 42);
  });
});

describe('warn level', () => {
  test('Lowdefy error is formatted via errorToDisplayString', () => {
    const logger = createBrowserLogger();
    logger.warn(createLowdefyError({ name: 'ConfigWarning', message: 'deprecation' }));
    expect(mockConsoleWarn).toHaveBeenCalledWith('[ConfigWarning] deprecation');
  });

  test('Lowdefy error with source logs source in blue first', () => {
    const logger = createBrowserLogger();
    logger.warn(
      createLowdefyError({ name: 'ConfigWarning', message: 'warn', source: 'config.yaml:10' })
    );
    expect(mockConsoleInfo).toHaveBeenCalledWith('%c%s', 'color: #4a9eff', 'config.yaml:10');
    expect(mockConsoleWarn).toHaveBeenCalledWith('[ConfigWarning] warn');
  });

  test('non-Lowdefy error passes through raw', () => {
    const logger = createBrowserLogger();
    const err = new Error('raw warning');
    logger.warn(err);
    expect(mockConsoleWarn).toHaveBeenCalledWith(err);
  });
});

describe('info and debug pass through', () => {
  test('info passes arguments through', () => {
    const logger = createBrowserLogger();
    logger.info('info message', { data: true });
    expect(mockConsoleInfo).toHaveBeenCalledWith('info message', { data: true });
  });

  test('debug passes arguments through', () => {
    const logger = createBrowserLogger();
    logger.debug('debug message');
    expect(mockConsoleDebug).toHaveBeenCalledWith('debug message');
  });
});

describe('cause chain logging', () => {
  test('Lowdefy error with cause chain logs causes at error level', () => {
    const logger = createBrowserLogger();
    const rootCause = new Error('connection refused');
    const midCause = new Error('query failed');
    midCause.cause = rootCause;
    const error = createLowdefyError({ name: 'RequestError', message: 'request failed' });
    error.cause = midCause;
    logger.error(error);
    expect(mockConsoleError).toHaveBeenCalledTimes(3);
    expect(mockConsoleError).toHaveBeenNthCalledWith(1, '[RequestError] request failed');
    expect(mockConsoleError).toHaveBeenNthCalledWith(2, '  Caused by: [Error] query failed');
    expect(mockConsoleError).toHaveBeenNthCalledWith(3, '  Caused by: [Error] connection refused');
  });

  test('Lowdefy error with cause chain logs causes at warn level', () => {
    const logger = createBrowserLogger();
    const rootCause = new Error('missing field');
    const error = createLowdefyError({ name: 'ConfigWarning', message: 'invalid config' });
    error.cause = rootCause;
    logger.warn(error);
    expect(mockConsoleWarn).toHaveBeenCalledTimes(2);
    expect(mockConsoleWarn).toHaveBeenNthCalledWith(1, '[ConfigWarning] invalid config');
    expect(mockConsoleWarn).toHaveBeenNthCalledWith(2, '  Caused by: [Error] missing field');
  });

  test('cause chain is limited to 3 levels', () => {
    const logger = createBrowserLogger();
    let current = new Error('level 4');
    for (let i = 3; i >= 1; i--) {
      const next = new Error(`level ${i}`);
      next.cause = current;
      current = next;
    }
    const error = createLowdefyError({ message: 'top' });
    error.cause = current;
    logger.error(error);
    // 1 top-level + 3 causes (level 1, 2, 3) — level 4 is excluded
    expect(mockConsoleError).toHaveBeenCalledTimes(4);
    expect(mockConsoleError).toHaveBeenNthCalledWith(2, '  Caused by: [Error] level 1');
    expect(mockConsoleError).toHaveBeenNthCalledWith(3, '  Caused by: [Error] level 2');
    expect(mockConsoleError).toHaveBeenNthCalledWith(4, '  Caused by: [Error] level 3');
  });

  test('Lowdefy error without cause does not log extra lines', () => {
    const logger = createBrowserLogger();
    logger.error(createLowdefyError({ message: 'no cause' }));
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenCalledWith('[ConfigError] no cause');
  });

  test('non-Error cause is not logged', () => {
    const logger = createBrowserLogger();
    const error = createLowdefyError({ message: 'string cause' });
    error.cause = 'not an error';
    logger.error(error);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
  });
});

describe('isLowdefyError marker detection', () => {
  test('error with isLowdefyError: true is detected as Lowdefy error', () => {
    const logger = createBrowserLogger();
    const error = new Error('marked');
    error.name = 'OperatorError';
    error.isLowdefyError = true;
    logger.error(error);
    expect(mockConsoleError).toHaveBeenCalledWith('[OperatorError] marked');
  });

  test('error without isLowdefyError is not detected as Lowdefy error', () => {
    const logger = createBrowserLogger();
    const error = new Error('not lowdefy');
    error.name = 'ConfigError';
    // No isLowdefyError property — should pass through raw
    logger.error(error);
    expect(mockConsoleError).toHaveBeenCalledWith(error);
  });

  test('error with isLowdefyError: false is not detected as Lowdefy error', () => {
    const logger = createBrowserLogger();
    const error = new Error('false marker');
    error.isLowdefyError = false;
    logger.error(error);
    expect(mockConsoleError).toHaveBeenCalledWith(error);
  });
});
