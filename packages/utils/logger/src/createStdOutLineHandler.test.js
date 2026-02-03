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

import createCliStdOutLineHandler from './cli/createStdOutLineHandler.js';
import createDevStdOutLineHandler from './dev/createStdOutLineHandler.js';

describe('createStdOutLineHandler (cli)', () => {
  test('logs source link for error and prints message', () => {
    const print = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { print } });

    handler(
      JSON.stringify({
        print: 'error',
        msg: 'Boom',
        source: '/path/file.yaml:10',
      })
    );

    expect(print.link).toHaveBeenCalledWith('/path/file.yaml:10');
    expect(print.error).toHaveBeenCalledWith('Boom');
  });

  test('uses err.source when provided', () => {
    const print = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { print } });

    handler(
      JSON.stringify({
        print: 'warn',
        msg: 'Warned',
        source: '/path/ignored.yaml:1',
        err: { source: '/path/preferred.yaml:2' },
      })
    );

    expect(print.link).toHaveBeenCalledWith('/path/preferred.yaml:2');
    expect(print.warn).toHaveBeenCalledWith('Warned');
  });

  test('does not log source link for non-error prints', () => {
    const print = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { print } });

    handler(
      JSON.stringify({
        print: 'info',
        msg: 'All good',
        source: '/path/file.yaml:20',
      })
    );

    expect(print.link).not.toHaveBeenCalled();
    expect(print.info).toHaveBeenCalledWith('All good');
  });

  test('falls back to log on invalid json', () => {
    const print = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { print } });

    handler('raw output line');

    expect(print.log).toHaveBeenCalledWith('raw output line');
  });
});

describe('createStdOutLineHandler (dev)', () => {
  function makeLogger() {
    return {
      levels: {
        labels: {
          10: 'debug',
          20: 'debug',
          30: 'info',
          40: 'warn',
          50: 'error',
        },
      },
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
  }

  test('logs link and message for errors', () => {
    const logger = makeLogger();
    const handler = createDevStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Server error',
        source: '/path/error.yaml:3',
      })
    );

    expect(logger.info).toHaveBeenCalledWith({ print: 'link' }, '/path/error.yaml:3');
    expect(logger.error).toHaveBeenCalledWith({ print: 'error' }, 'Server error');
  });

  test('defaults info to log print style', () => {
    const logger = makeLogger();
    const handler = createDevStdOutLineHandler({ context: { logger } });

    handler(
      JSON.stringify({
        level: 30,
        msg: 'Server info',
      })
    );

    expect(logger.info).toHaveBeenCalledWith({ print: 'log' }, 'Server info');
  });

  test('falls back to info on invalid json', () => {
    const logger = makeLogger();
    const handler = createDevStdOutLineHandler({ context: { logger } });

    handler('raw output line');

    expect(logger.info).toHaveBeenCalledWith({ print: 'info' }, 'raw output line');
  });

  test('ignores entries without level', () => {
    const logger = makeLogger();
    const handler = createDevStdOutLineHandler({ context: { logger } });

    handler(JSON.stringify({ msg: 'missing level' }));

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
