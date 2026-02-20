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
import { ConfigError, OperatorError } from '@lowdefy/errors';

import createStdOutLineHandler from './createStdOutLineHandler.js';

function createMockLogger() {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

describe('createStdOutLineHandler', () => {
  test('reconstructs error with source and forwards to logger', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Boom',
        err: {
          name: 'ConfigError',
          message: 'Block type not found.',
          stack: 'ConfigError: Block type not found.\n    at buildBlocks',
          source: '/path/file.yaml:10',
        },
      })
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    const error = logger.error.mock.calls[0][0];
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Block type not found.');
    expect(error.source).toBe('/path/file.yaml:10');
    expect(error.stack).toBe('ConfigError: Block type not found.\n    at buildBlocks');
  });

  test('reconstructs OperatorError with correct prototype', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Operator failed',
        err: {
          name: 'OperatorError',
          message: '_if requires boolean.',
          _message: '_if requires boolean.',
          typeName: '_if',
        },
      })
    );

    const error = logger.error.mock.calls[0][0];
    expect(error).toBeInstanceOf(OperatorError);
    expect(error.typeName).toBe('_if');
  });

  test('falls back to Error for unknown error name', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Unknown',
        err: { name: 'SomeCustomError', message: 'Unexpected.' },
      })
    );

    const error = logger.error.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Unexpected.');
  });

  test('forwards spin, succeed, color, source via two-arg form', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 30, spin: true, msg: 'Building...' }));
    expect(logger.info).toHaveBeenCalledWith(
      { source: undefined, color: undefined, spin: true, succeed: undefined },
      'Building...'
    );

    logger.info.mockClear();
    handler(JSON.stringify({ level: 30, succeed: true, msg: 'Done' }));
    expect(logger.info).toHaveBeenCalledWith(
      { source: undefined, color: undefined, spin: undefined, succeed: true },
      'Done'
    );

    logger.info.mockClear();
    handler(JSON.stringify({ level: 30, color: 'blue', msg: 'src/config.yaml:5' }));
    expect(logger.info).toHaveBeenCalledWith(
      { source: undefined, color: 'blue', spin: undefined, succeed: undefined },
      'src/config.yaml:5'
    );

    logger.info.mockClear();
    handler(JSON.stringify({ level: 30, source: '/path/file.yaml:10', msg: 'Something happened' }));
    expect(logger.info).toHaveBeenCalledWith(
      { source: '/path/file.yaml:10', color: undefined, spin: undefined, succeed: undefined },
      'Something happened'
    );
  });

  test('derives level name from pino numeric level', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 30, msg: 'Info from pino' }));
    expect(logger.info).toHaveBeenCalledWith(expect.anything(), 'Info from pino');

    handler(JSON.stringify({ level: 40, msg: 'Warn from pino' }));
    expect(logger.warn).toHaveBeenCalledWith(expect.anything(), 'Warn from pino');

    handler(JSON.stringify({ level: 50, msg: 'Error from pino' }));
    expect(logger.error).toHaveBeenCalledWith(expect.anything(), 'Error from pino');

    handler(JSON.stringify({ level: 20, msg: 'Debug from pino' }));
    expect(logger.debug).toHaveBeenCalledWith(expect.anything(), 'Debug from pino');
  });

  test('falls back to logger.info(line) on invalid JSON', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler('raw output line');

    expect(logger.info).toHaveBeenCalledWith('raw output line');
  });

  test('formats data as key:value lines when msg is missing', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 30, some: 'data', count: 42 }));
    expect(logger.info).toHaveBeenCalledWith(
      { source: undefined, color: undefined, spin: undefined, succeed: undefined },
      '  some: data'
    );
    expect(logger.info).toHaveBeenCalledWith('  count: 42');
  });

  test('formats data at correct level when msg is missing', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 20, url: '/api/root', method: 'GET' }));
    expect(logger.debug).toHaveBeenCalledWith(
      { source: undefined, color: undefined, spin: undefined, succeed: undefined },
      '  url: /api/root'
    );
    expect(logger.debug).toHaveBeenCalledWith('  method: GET');
  });

  test('formats nested objects as JSON in data lines', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 20, user: { id: 'abc' }, url: '/api/root' }));
    expect(logger.debug).toHaveBeenCalledWith(
      { source: undefined, color: undefined, spin: undefined, succeed: undefined },
      '  user: {"id":"abc"}'
    );
    expect(logger.debug).toHaveBeenCalledWith('  url: /api/root');
  });

  test('logs msg then data fields as separate lines', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 20, msg: 'adapter_getSessionAndUser', rid: '123', args: ['a'] }));
    expect(logger.debug).toHaveBeenCalledWith(
      { source: undefined, color: undefined, spin: undefined, succeed: undefined },
      'adapter_getSessionAndUser'
    );
    expect(logger.debug).toHaveBeenCalledWith('  rid: 123');
    expect(logger.debug).toHaveBeenCalledWith('  args: ["a"]');
  });

  test('strips pino metadata from data output', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 20,
        time: 1234567890,
        name: 'lowdefy_server',
        pid: 12345,
        hostname: 'localhost',
        msg: 'request',
        url: '/api/root',
      })
    );
    expect(logger.debug).toHaveBeenCalledWith(
      { source: undefined, color: undefined, spin: undefined, succeed: undefined },
      'request'
    );
    expect(logger.debug).toHaveBeenCalledWith('  url: /api/root');
    expect(logger.debug).toHaveBeenCalledTimes(2);
  });

  test('falls back to raw line at correct level when no msg and no data', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    const line = JSON.stringify({ level: 30, msg: '' });
    handler(line);
    expect(logger.info).toHaveBeenCalledWith(line);
  });

  test('falls back to raw line at debug level when no msg and no data', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    const line = JSON.stringify({ level: 20 });
    handler(line);
    expect(logger.debug).toHaveBeenCalledWith(line);
  });

  test('forwards error with source at warn level', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 40,
        msg: 'Config warning',
        err: {
          name: 'ConfigError',
          message: 'Deprecated feature.',
          source: '/path/config.yaml:15',
        },
      })
    );

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const error = logger.warn.mock.calls[0][0];
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.source).toBe('/path/config.yaml:15');
  });

  test('reconstructs err with only message property as Error instance', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Something broke',
        err: { message: 'just a message' },
      })
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    const error = logger.error.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('just a message');
  });

  test('maps error level for err objects', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 40,
        msg: 'Warning error',
        err: { name: 'Error', message: 'Warned' },
      })
    );

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  test('reconstructs error with cause as instanceof Error', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Wrapped error',
        err: {
          name: 'OperatorError',
          message: '_if failed',
          typeName: '_if',
          cause: {
            name: 'Error',
            message: 'root cause',
            code: 'ROOT',
          },
        },
      })
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    const error = logger.error.mock.calls[0][0];
    expect(error).toBeInstanceOf(OperatorError);
    expect(error.cause).toBeInstanceOf(Error);
    expect(error.cause.message).toBe('root cause');
    expect(error.cause.code).toBe('ROOT');
  });

  test('reconstructs multi-level cause chain from pino JSON', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Deep chain',
        err: {
          name: 'OperatorError',
          message: 'top',
          cause: {
            name: 'ConfigError',
            message: 'middle',
            cause: {
              name: 'Error',
              message: 'root',
            },
          },
        },
      })
    );

    const error = logger.error.mock.calls[0][0];
    expect(error).toBeInstanceOf(OperatorError);
    expect(error.cause).toBeInstanceOf(ConfigError);
    expect(error.cause.cause).toBeInstanceOf(Error);
    expect(error.cause.cause.message).toBe('root');
  });
});
