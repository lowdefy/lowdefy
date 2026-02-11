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

jest.unstable_mockModule('ora', () => {
  const mockOraConstructor = jest.fn(() => ({
    fail: mockOraFail,
    start: mockOraStart,
    stopAndPersist: mockOraStopAndPersist,
    succeed: mockOraSucceed,
    warn: mockOraWarn,
  }));
  return {
    default: mockOraConstructor,
  };
});

const mockOraFail = jest.fn();
const mockOraStart = jest.fn();
const mockOraStopAndPersist = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraWarn = jest.fn();
mockOraStart.mockImplementation(() => ({ stopAndPersist: mockOraStopAndPersist }));

// mock console
const mockConsoleError = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleDebug = jest.fn();
console.error = mockConsoleError;
console.log = mockConsoleLog;
console.warn = mockConsoleWarn;
console.debug = mockConsoleDebug;

// Mock timestamps
const mockGetHours = jest.fn();
const mockGetMinutes = jest.fn();
const mockGetSeconds = jest.fn();
// eslint-disable-next-line no-global-assign
Date = jest.fn(() => ({
  getHours: mockGetHours,
  getMinutes: mockGetMinutes,
  getSeconds: mockGetSeconds,
}));

Date.now = () => {};

describe('memoise', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  test('memoise print', async () => {
    const { default: createPrint } = await import('./cli/createPrint.js');
    const print1 = createPrint({ logLevel: 'info' });
    const print2 = createPrint({ logLevel: 'info' });
    expect(print1).toBe(print2);
  });

  test('Create ora print if process.env.CI is false', async () => {
    const { default: createPrint } = await import('./cli/createPrint.js');
    const realCI = process.env.CI;
    process.env.CI = 'false';
    const print = createPrint({ logLevel: 'info' });
    print.info('Test');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: 'Test' }],
    ]);
    process.env.CI = realCI;
  });

  test('Create basic print if process.env.CI is true', async () => {
    const { default: createPrint } = await import('./cli/createPrint.js');
    const realCI = process.env.CI;
    process.env.CI = 'true';
    const print = createPrint({ logLevel: 'info' });
    print.info('Test log');
    expect(mockConsoleLog.mock.calls).toEqual([['Test log']]);
    process.env.CI = realCI;
  });
});

describe('ora print', () => {
  test('create print has 6 methods', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    expect(Object.keys(print).sort()).toEqual([
      'debug', 'error', 'info', 'spin', 'succeed', 'warn',
    ]);
  });

  test('timestamp, digits less than 10', async () => {
    const { default: ora } = await import('ora');
    const { createOraPrint } = await import('./cli/createPrint.js');
    mockGetHours.mockImplementation(() => 1);
    mockGetMinutes.mockImplementation(() => 2);
    mockGetSeconds.mockImplementation(() => 3);
    createOraPrint({ logLevel: 'info' });
    const prefixTextFn = ora.mock.calls[0][0].prefixText;
    const res = prefixTextFn();
    expect(res).toEqual('\x1b[2m01:02:03\x1b[0m');
  });

  test('timestamp, digits more than 10', async () => {
    const { default: ora } = await import('ora');
    const { createOraPrint } = await import('./cli/createPrint.js');
    mockGetHours.mockImplementation(() => 11);
    mockGetMinutes.mockImplementation(() => 22);
    mockGetSeconds.mockImplementation(() => 33);
    createOraPrint({ logLevel: 'info' });
    const prefixTextFn = ora.mock.calls[0][0].prefixText;
    const res = prefixTextFn();
    expect(res).toEqual('\x1b[2m11:22:33\x1b[0m');
  });

  test('print error applies default red color', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.error('Test error');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31mTest error\x1b[0m']]);
  });

  test('print error with color override', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.error('Test error', { color: 'blue' });
    expect(mockOraFail.mock.calls).toEqual([['\x1b[34mTest error\x1b[0m']]);
  });

  test('print info applies default white (identity) color', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.info('Test info');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: 'Test info' }],
    ]);
  });

  test('print info with color override', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.info('Test info', { color: 'blue' });
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: '\x1b[34mTest info\x1b[0m' }],
    ]);
  });

  test('print spin', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.spin('Test spin');
    expect(mockOraStart.mock.calls).toEqual([['Test spin']]);
  });

  test('print succeed', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.succeed('Test succeed');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32mTest succeed\x1b[0m']]);
  });

  test('print warn applies default yellow color', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.warn('Test warn');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mTest warn\x1b[0m']]);
  });

  test('print debug applies default gray color', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'debug' });
    print.debug('Test debug');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '\x1b[2m+\x1b[0m', text: '\x1b[2mTest debug\x1b[0m' }],
    ]);
  });

  test('Log level error', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'error' });
    print.error('Test error');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31mTest error\x1b[0m']]);
    print.warn('Test warn');
    expect(mockOraWarn.mock.calls).toEqual([]);
    print.succeed('Test succeed');
    expect(mockOraSucceed.mock.calls).toEqual([]);
    print.spin('Test spin');
    expect(mockOraStart.mock.calls).toEqual([]);
    print.info('Test info');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
    print.debug('Test debug');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
  });

  test('Log level warn', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'warn' });
    print.error('Test error');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31mTest error\x1b[0m']]);
    print.warn('Test warn');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mTest warn\x1b[0m']]);
    print.succeed('Test succeed');
    expect(mockOraSucceed.mock.calls).toEqual([]);
    print.spin('Test spin');
    expect(mockOraStart.mock.calls).toEqual([]);
    print.info('Test info');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
    print.debug('Test debug');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
  });

  test('Log level info', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'info' });
    print.error('Test error');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31mTest error\x1b[0m']]);
    print.warn('Test warn');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mTest warn\x1b[0m']]);
    print.succeed('Test succeed');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32mTest succeed\x1b[0m']]);
    print.spin('Test spin');
    expect(mockOraStart.mock.calls).toEqual([['Test spin']]);
    print.info('Test info');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'Test info' }]]);
    print.debug('Test debug');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'Test info' }]]);
  });

  test('Log level debug', async () => {
    const { createOraPrint } = await import('./cli/createPrint.js');
    const print = createOraPrint({ logLevel: 'debug' });
    print.error('Test error');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31mTest error\x1b[0m']]);
    print.warn('Test warn');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mTest warn\x1b[0m']]);
    print.succeed('Test succeed');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32mTest succeed\x1b[0m']]);
    print.spin('Test spin');
    expect(mockOraStart.mock.calls).toEqual([['Test spin']]);
    print.info('Test info');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'Test info' }]]);
    print.debug('Test debug');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: 'Test info' }],
      [{ symbol: '\x1b[2m+\x1b[0m', text: '\x1b[2mTest debug\x1b[0m' }],
    ]);
  });
});

describe('basic print', () => {
  test('create print has 6 methods', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'info' });
    expect(Object.keys(print).sort()).toEqual([
      'debug', 'error', 'info', 'spin', 'succeed', 'warn',
    ]);
  });

  test('print error', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'info' });
    print.error('Test error');
    expect(mockConsoleError.mock.calls).toEqual([['Test error']]);
  });

  test('print info', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'info' });
    print.info('Test info');
    expect(mockConsoleLog.mock.calls).toEqual([['Test info']]);
  });

  test('print spin', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'info' });
    print.spin('Test spin');
    expect(mockConsoleLog.mock.calls).toEqual([['Test spin']]);
  });

  test('print succeed', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'info' });
    print.succeed('Test succeed');
    expect(mockConsoleLog.mock.calls).toEqual([['Test succeed']]);
  });

  test('print warn', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'info' });
    print.warn('Test warn');
    expect(mockConsoleWarn.mock.calls).toEqual([['Test warn']]);
  });

  test('print debug', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'debug' });
    print.debug('Test debug');
    expect(mockConsoleDebug.mock.calls).toEqual([['Test debug']]);
  });

  test('Log level error', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'error' });
    print.error('Test error');
    expect(mockConsoleError.mock.calls).toEqual([['Test error']]);
    print.warn('Test warn');
    expect(mockConsoleWarn.mock.calls).toEqual([]);
    print.succeed('Test succeed');
    print.spin('Test spin');
    print.info('Test info');
    expect(mockConsoleLog.mock.calls).toEqual([]);
    print.debug('Test debug');
    expect(mockConsoleDebug.mock.calls).toEqual([]);
  });

  test('Log level warn', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'warn' });
    print.error('Test error');
    expect(mockConsoleError.mock.calls).toEqual([['Test error']]);
    print.warn('Test warn');
    expect(mockConsoleWarn.mock.calls).toEqual([['Test warn']]);
    print.succeed('Test succeed');
    print.spin('Test spin');
    print.info('Test info');
    expect(mockConsoleLog.mock.calls).toEqual([]);
    print.debug('Test debug');
    expect(mockConsoleDebug.mock.calls).toEqual([]);
  });

  test('Log level info', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'info' });
    print.error('Test error');
    expect(mockConsoleError.mock.calls).toEqual([['Test error']]);
    print.warn('Test warn');
    expect(mockConsoleWarn.mock.calls).toEqual([['Test warn']]);
    print.succeed('Test succeed');
    print.spin('Test spin');
    print.info('Test info');
    expect(mockConsoleLog.mock.calls).toEqual([['Test succeed'], ['Test spin'], ['Test info']]);
    print.debug('Test debug');
    expect(mockConsoleDebug.mock.calls).toEqual([]);
  });

  test('Log level debug', async () => {
    const { createBasicPrint } = await import('./cli/createPrint.js');
    const print = createBasicPrint({ logLevel: 'debug' });
    print.error('Test error');
    expect(mockConsoleError.mock.calls).toEqual([['Test error']]);
    print.warn('Test warn');
    expect(mockConsoleWarn.mock.calls).toEqual([['Test warn']]);
    print.succeed('Test succeed');
    print.spin('Test spin');
    print.info('Test info');
    expect(mockConsoleLog.mock.calls).toEqual([['Test succeed'], ['Test spin'], ['Test info']]);
    print.debug('Test debug');
    expect(mockConsoleDebug.mock.calls).toEqual([['Test debug']]);
  });
});
