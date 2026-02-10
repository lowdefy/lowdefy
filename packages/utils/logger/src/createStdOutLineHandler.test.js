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

describe('createStdOutLineHandler (cli)', () => {
  test('logs source link for error and prints message', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    handler(
      JSON.stringify({
        print: 'error',
        msg: 'Boom',
        source: '/path/file.yaml:10',
      })
    );

    expect(ui.link).toHaveBeenCalledWith('/path/file.yaml:10');
    expect(ui.error).toHaveBeenCalledWith('Boom');
  });

  test('uses err.source when provided', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    handler(
      JSON.stringify({
        print: 'warn',
        msg: 'Warned',
        source: '/path/ignored.yaml:1',
        err: { source: '/path/preferred.yaml:2' },
      })
    );

    expect(ui.link).toHaveBeenCalledWith('/path/preferred.yaml:2');
    expect(ui.warn).toHaveBeenCalledWith('Warned');
  });

  test('does not log source link for non-error prints', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    handler(
      JSON.stringify({
        print: 'info',
        msg: 'All good',
        source: '/path/file.yaml:20',
      })
    );

    expect(ui.link).not.toHaveBeenCalled();
    expect(ui.info).toHaveBeenCalledWith('All good');
  });

  test('derives print level from pino numeric level when print is absent', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    handler(JSON.stringify({ level: 30, msg: 'Info from pino' }));
    expect(ui.info).toHaveBeenCalledWith('Info from pino');

    handler(JSON.stringify({ level: 40, msg: 'Warn from pino' }));
    expect(ui.warn).toHaveBeenCalledWith('Warn from pino');

    handler(JSON.stringify({ level: 50, msg: 'Error from pino' }));
    expect(ui.error).toHaveBeenCalledWith('Error from pino');

    handler(JSON.stringify({ level: 20, msg: 'Debug from pino' }));
    expect(ui.debug).toHaveBeenCalledWith('Debug from pino');
  });

  test('shows source link when print derived from pino level', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    handler(
      JSON.stringify({
        level: 50,
        msg: 'Boom',
        source: '/path/file.yaml:10',
      })
    );

    expect(ui.link).toHaveBeenCalledWith('/path/file.yaml:10');
    expect(ui.error).toHaveBeenCalledWith('Boom');
  });

  test('print field takes precedence over pino level', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    handler(JSON.stringify({ print: 'succeed', level: 30, msg: 'Done' }));
    expect(ui.succeed).toHaveBeenCalledWith('Done');
    expect(ui.info).not.toHaveBeenCalled();
  });

  test('logs raw JSON line when msg is missing', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    const line = JSON.stringify({ level: 30, some: 'data' });
    handler(line);
    expect(ui.log).toHaveBeenCalledWith(line);
  });

  test('falls back to log on invalid json', () => {
    const ui = {
      link: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      spin: jest.fn(),
      succeed: jest.fn(),
    };
    const handler = createCliStdOutLineHandler({ context: { logger: { ui } } });

    handler('raw output line');

    expect(ui.log).toHaveBeenCalledWith('raw output line');
  });
});
