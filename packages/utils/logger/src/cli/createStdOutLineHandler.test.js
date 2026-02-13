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

import createStdOutLineHandler from './createStdOutLineHandler.js';

function createMockLogger() {
  const info = jest.fn();
  info.blue = jest.fn();
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info,
    debug: jest.fn(),
  };
}

describe('createStdOutLineHandler', () => {
  test('logs source link for error and prints message', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Boom',
        source: '/path/file.yaml:10',
      })
    );

    expect(logger.info.blue).toHaveBeenCalledWith('/path/file.yaml:10');
    expect(logger.error).toHaveBeenCalledWith('Boom');
  });

  test('uses err.source when provided', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 40,
        msg: 'Warned',
        source: '/path/ignored.yaml:1',
        err: { source: '/path/preferred.yaml:2' },
      })
    );

    expect(logger.info.blue).toHaveBeenCalledWith('/path/preferred.yaml:2');
    expect(logger.warn).toHaveBeenCalledWith('Warned');
  });

  test('does not log source link for non-error levels', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 30,
        msg: 'All good',
        source: '/path/file.yaml:20',
      })
    );

    expect(logger.info.blue).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('All good');
  });

  test('derives level name from pino numeric level', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 30, msg: 'Info from pino' }));
    expect(logger.info).toHaveBeenCalledWith('Info from pino');

    handler(JSON.stringify({ level: 40, msg: 'Warn from pino' }));
    expect(logger.warn).toHaveBeenCalledWith('Warn from pino');

    handler(JSON.stringify({ level: 50, msg: 'Error from pino' }));
    expect(logger.error).toHaveBeenCalledWith('Error from pino');

    handler(JSON.stringify({ level: 20, msg: 'Debug from pino' }));
    expect(logger.debug).toHaveBeenCalledWith('Debug from pino');
  });

  test('handles spin field', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 30, spin: true, msg: 'Building...' }));
    expect(logger.info).toHaveBeenCalledWith('Building...', { spin: true });
  });

  test('handles succeed field', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 30, succeed: true, msg: 'Done' }));
    expect(logger.info).toHaveBeenCalledWith('Done', { succeed: true });
  });

  test('handles color field', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ level: 30, color: 'blue', msg: 'src/config.yaml:5' }));
    expect(logger.info).toHaveBeenCalledWith('src/config.yaml:5', { color: 'blue' });
  });

  test('logs raw JSON line when msg is missing', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    const line = JSON.stringify({ level: 30, some: 'data' });
    handler(line);
    expect(logger.info).toHaveBeenCalledWith(line);
  });

  test('falls back to info on invalid json', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler('raw output line');

    expect(logger.info).toHaveBeenCalledWith('raw output line');
  });

  test('shows source link when derived from pino level', () => {
    const logger = createMockLogger();
    const handler = createStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Boom',
        source: '/path/file.yaml:10',
      })
    );

    expect(logger.info.blue).toHaveBeenCalledWith('/path/file.yaml:10');
    expect(logger.error).toHaveBeenCalledWith('Boom');
  });
});
