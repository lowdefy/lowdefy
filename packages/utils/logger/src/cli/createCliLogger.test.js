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

const mockOraClear = jest.fn();
const mockOraFail = jest.fn();
const mockOraRender = jest.fn();
const mockOraStart = jest.fn();
const mockOraStopAndPersist = jest.fn();
const mockOraSucceed = jest.fn();

const mockSpinner = {
  clear: mockOraClear,
  fail: mockOraFail,
  isSpinning: false,
  render: mockOraRender,
  start: mockOraStart,
  stopAndPersist: mockOraStopAndPersist,
  succeed: mockOraSucceed,
};

jest.unstable_mockModule('ora', () => {
  const mockOraConstructor = jest.fn(() => mockSpinner);
  return {
    default: mockOraConstructor,
  };
});

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

// Save original CI value so tests are deterministic regardless of environment
const originalCI = process.env.CI;
afterEach(() => {
  process.env.CI = originalCI;
});

describe('memoisation', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleDebug.mockClear();
  });

  test('same print instance on repeated createCliLogger calls', async () => {
    process.env.CI = 'false';
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger1 = createCliLogger({ logLevel: 'info' });
    const logger2 = createCliLogger({ logLevel: 'info' });
    // Both loggers use the same underlying print — verify by calling both
    logger1.info('from logger1');
    logger2.info('from logger2');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: 'from logger1' }],
      [{ symbol: '∙', text: 'from logger2' }],
    ]);
  });

  test('creates ora print when CI is false', async () => {
    process.env.CI = 'false';
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info('Test');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'Test' }]]);
  });

  test('creates basic print when CI is true', async () => {
    process.env.CI = 'true';
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info('Test log');
    expect(mockConsoleLog.mock.calls).toEqual([['Test log']]);
  });
});

describe('string input', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
  });

  test('logger.info with plain string', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info('hello');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'hello' }]]);
  });

  test('logger.error with plain string uses red', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.error('boom');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31mboom\x1b[0m' }],
    ]);
  });

  test('logger.warn with plain string uses yellow', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.warn('careful');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '⚠', text: '\x1b[33mcareful\x1b[0m' }],
    ]);
  });

  test('logger.debug with plain string uses gray', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'debug' });
    logger.debug('details');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '\x1b[2m+\x1b[0m', text: '\x1b[2mdetails\x1b[0m' }],
    ]);
  });
});

describe('error input', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
  });

  test('error with source logs source in blue then error message', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('bad thing');
    err.source = 'pages/home.yaml:5';
    logger.error(err);
    // source logged as info with blue color
    expect(mockOraStopAndPersist.mock.calls[0]).toEqual([
      { symbol: '∙', text: '\x1b[34mpages/home.yaml:5\x1b[0m' },
    ]);
    // error message logged at error level (with default red color)
    expect(mockOraStopAndPersist.mock.calls[1][0]).toEqual({
      symbol: '✖',
      text: '\x1b[31m[Error] bad thing\x1b[0m',
    });
  });

  test('plain Error logs stack trace in gray', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('unexpected');
    logger.error(err);
    expect(mockOraStopAndPersist.mock.calls.length).toBe(2);
    expect(mockOraStopAndPersist.mock.calls[0][0]).toEqual({
      symbol: '✖',
      text: '\x1b[31m[Error] unexpected\x1b[0m',
    });
    // Second call is the stack wrapped in gray ANSI
    expect(mockOraStopAndPersist.mock.calls[1][0].symbol).toBe('✖');
    expect(mockOraStopAndPersist.mock.calls[1][0].text).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
  });

  test('LowdefyInternalError logs stack trace in gray', async () => {
    const { LowdefyInternalError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new LowdefyInternalError('internal bug');
    logger.error(err);
    expect(mockOraStopAndPersist.mock.calls.length).toBe(2);
    expect(mockOraStopAndPersist.mock.calls[0][0]).toEqual({
      symbol: '✖',
      text: '\x1b[31m[LowdefyInternalError] internal bug\x1b[0m',
    });
    // Second call is the stack wrapped in gray ANSI
    expect(mockOraStopAndPersist.mock.calls[1][0].symbol).toBe('✖');
    expect(mockOraStopAndPersist.mock.calls[1][0].text).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
  });

  test('ConfigError does not log stack trace', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new ConfigError('bad config');
    logger.error(err);
    const errorCalls = mockOraStopAndPersist.mock.calls.filter((call) => call[0]?.symbol === '✖');
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0].text).toBe('\x1b[31m[ConfigError] bad config\x1b[0m');
  });

  test('OperatorError does not log stack trace', async () => {
    const { OperatorError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new OperatorError('operator broke');
    logger.error(err);
    const errorCalls = mockOraStopAndPersist.mock.calls.filter((call) => call[0]?.symbol === '✖');
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0].text).toBe('\x1b[31m[OperatorError] operator broke\x1b[0m');
  });

  test('ServiceError does not log stack trace', async () => {
    const { ServiceError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new ServiceError('service down');
    logger.error(err);
    const errorCalls = mockOraStopAndPersist.mock.calls.filter((call) => call[0]?.symbol === '✖');
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0].text).toBe('\x1b[31m[ServiceError] service down\x1b[0m');
  });

  test('UserError does not log stack trace', async () => {
    const { UserError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new UserError('user did something');
    logger.error(err);
    const errorCalls = mockOraStopAndPersist.mock.calls.filter((call) => call[0]?.symbol === '✖');
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0].text).toBe('\x1b[31m[UserError] user did something\x1b[0m');
  });

  test('TypeError logs stack trace in gray (not a Lowdefy error class)', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new TypeError('cannot read property');
    logger.error(err);
    const errorCalls = mockOraStopAndPersist.mock.calls.filter((call) => call[0]?.symbol === '✖');
    expect(errorCalls.length).toBe(2);
    expect(errorCalls[0][0].text).toBe('\x1b[31m[TypeError] cannot read property\x1b[0m');
    expect(errorCalls[1][0].text).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
  });

  test('error with received value includes it in display string', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('bad input');
    err.received = { key: 'val' };
    logger.error(err);
    expect(mockOraStopAndPersist.mock.calls[0][0]).toEqual({
      symbol: '✖',
      text: '\x1b[31m[Error] bad input Received: {"key":"val"}\x1b[0m',
    });
  });
});

describe('cause chain', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
  });

  test('error with cause shows Caused by line without cause stack at info level', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new Error('root cause');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    // wrapper message + wrapper stack + caused by (cause stack at debug only)
    expect(mockOraStopAndPersist.mock.calls[0][0].text).toBe('\x1b[31m[Error] wrapper\x1b[0m');
    expect(mockOraStopAndPersist.mock.calls[1][0].text).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraStopAndPersist.mock.calls[2][0].text).toBe(
      '\x1b[31m  Caused by: [Error] root cause\x1b[0m'
    );
    expect(mockOraStopAndPersist.mock.calls.length).toBe(3);
  });

  test('ConfigError cause does not show stack', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new ConfigError('bad config');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    // wrapper message + wrapper stack + caused by (no cause stack for ConfigError)
    expect(mockOraStopAndPersist.mock.calls[0][0].text).toBe('\x1b[31m[Error] wrapper\x1b[0m');
    expect(mockOraStopAndPersist.mock.calls[1][0].text).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraStopAndPersist.mock.calls[2][0].text).toBe(
      '\x1b[31m  Caused by: [ConfigError] bad config\x1b[0m'
    );
    // No stack for ConfigError — only 3 calls total
    expect(mockOraStopAndPersist.mock.calls.length).toBe(3);
  });

  test('plain Error cause does not show stack at info level', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new Error('root');
    const err = new ConfigError('config', { cause });
    logger.error(err);
    // ConfigError message (no stack for ConfigError) + caused by (no cause stack at info)
    expect(mockOraStopAndPersist.mock.calls[0][0].text).toBe('\x1b[31m[ConfigError] config\x1b[0m');
    expect(mockOraStopAndPersist.mock.calls[1][0].text).toBe(
      '\x1b[31m  Caused by: [Error] root\x1b[0m'
    );
    expect(mockOraStopAndPersist.mock.calls.length).toBe(2);
  });

  test('multi-level cause chain walks all levels without cause stacks at info', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const root = new Error('root');
    const mid = new Error('middle', { cause: root });
    const top = new Error('top', { cause: mid });
    logger.error(top);
    // top message + top stack + caused by mid + caused by root (no cause stacks at info)
    expect(mockOraStopAndPersist.mock.calls[0][0].text).toBe('\x1b[31m[Error] top\x1b[0m');
    expect(mockOraStopAndPersist.mock.calls[1][0].text).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraStopAndPersist.mock.calls[2][0].text).toBe(
      '\x1b[31m  Caused by: [Error] middle\x1b[0m'
    );
    expect(mockOraStopAndPersist.mock.calls[3][0].text).toBe(
      '\x1b[31m  Caused by: [Error] root\x1b[0m'
    );
    expect(mockOraStopAndPersist.mock.calls.length).toBe(4);
  });

  test('cause stacks are logged at debug level', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'debug' });
    const cause = new Error('root cause');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    const calls = mockOraStopAndPersist.mock.calls;
    // wrapper message (error level)
    expect(calls[0][0].text).toBe('\x1b[31m[Error] wrapper\x1b[0m');
    expect(calls[0][0].symbol).toBe('✖');
    // wrapper stack (error level)
    expect(calls[1][0].text).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(calls[1][0].symbol).toBe('✖');
    // caused by (error level)
    expect(calls[2][0].text).toBe('\x1b[31m  Caused by: [Error] root cause\x1b[0m');
    expect(calls[2][0].symbol).toBe('✖');
    // Cause stack logged via print.debug (debug symbol)
    const causeStackCall = calls.find((call) => call[0]?.symbol === '\x1b[2m+\x1b[0m');
    expect(causeStackCall).toBeDefined();
  });

  test('error without cause does not show Caused by line', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('no cause');
    logger.error(err);
    // message + stack only, no Caused by
    expect(mockOraStopAndPersist.mock.calls.length).toBe(2);
  });
});

describe('pino two-arg form', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
  });

  test('logger.info({ spin: "start" }, "text") calls print.spin', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ spin: 'start' }, 'Building pages...');
    expect(mockOraStart.mock.calls).toEqual([['Building pages...']]);
  });

  test('logger.info({ spin: "succeed" }, "text") calls print.succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ spin: 'succeed' }, 'Done!');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32mDone!\x1b[0m']]);
  });

  test('logger.info({ spin: "fail" }, "text") calls print.fail', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ spin: 'fail' }, 'Build failed.');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31mBuild failed.\x1b[0m']]);
  });

  test('logger.info({ color: "blue" }, "text") applies blue color', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ color: 'blue' }, 'some info');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: '\x1b[34msome info\x1b[0m' }],
    ]);
  });

  test('logger.info({ source: "file.yaml:5" }, "text") logs source in blue then message', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ source: 'file.yaml:5' }, 'config issue');
    // source logged in blue
    expect(mockOraStopAndPersist.mock.calls[0]).toEqual([
      { symbol: '∙', text: '\x1b[34mfile.yaml:5\x1b[0m' },
    ]);
    // message logged at info level
    expect(mockOraStopAndPersist.mock.calls[1]).toEqual([{ symbol: '∙', text: 'config issue' }]);
  });

  test('logger.error({ color: "blue" }, "text") applies blue at error level', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.error({ color: 'blue' }, 'blue error');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[34mblue error\x1b[0m' }],
    ]);
  });
});

describe('fallback', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
  });

  test('non-error non-string object is JSON.stringified', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ foo: 'bar', baz: 42 });
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: JSON.stringify({ foo: 'bar', baz: 42 }, null, 2) }],
    ]);
  });
});

describe('level filtering', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
  });

  test('log level error silences warn/info/debug/spin/succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'error' });
    logger.error('err');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
    ]);
    logger.warn('w');
    // warn is silenced — no additional stopAndPersist call
    expect(mockOraStopAndPersist.mock.calls.length).toBe(1);
    logger.info('i');
    logger.info({ spin: 'start' }, 'spin');
    logger.info({ spin: 'succeed' }, 'succeed');
    expect(mockOraStopAndPersist.mock.calls.length).toBe(1);
    expect(mockOraStart.mock.calls).toEqual([]);
    expect(mockOraSucceed.mock.calls).toEqual([]);
    logger.debug('d');
    expect(mockOraStopAndPersist.mock.calls.length).toBe(1);
  });

  test('log level warn allows error and warn', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'warn' });
    logger.error('err');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
    ]);
    logger.warn('w');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
      [{ symbol: '⚠', text: '\x1b[33mw\x1b[0m' }],
    ]);
    logger.info('i');
    expect(mockOraStopAndPersist.mock.calls.length).toBe(2);
    logger.debug('d');
    expect(mockOraStopAndPersist.mock.calls.length).toBe(2);
  });

  test('log level info allows error, warn, info, spin, succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.error('err');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
    ]);
    logger.warn('w');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
      [{ symbol: '⚠', text: '\x1b[33mw\x1b[0m' }],
    ]);
    logger.info('i');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
      [{ symbol: '⚠', text: '\x1b[33mw\x1b[0m' }],
      [{ symbol: '∙', text: 'i' }],
    ]);
    logger.info({ spin: 'start' }, 'spin');
    expect(mockOraStart.mock.calls).toEqual([['spin']]);
    logger.info({ spin: 'succeed' }, 'succ');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32msucc\x1b[0m']]);
    logger.debug('d');
    // debug is silenced at info level — no additional stopAndPersist call
    expect(mockOraStopAndPersist.mock.calls.length).toBe(3);
  });

  test('log level debug allows all levels', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'debug' });
    logger.error('err');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
    ]);
    logger.warn('w');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
      [{ symbol: '⚠', text: '\x1b[33mw\x1b[0m' }],
    ]);
    logger.info('i');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
      [{ symbol: '⚠', text: '\x1b[33mw\x1b[0m' }],
      [{ symbol: '∙', text: 'i' }],
    ]);
    logger.info({ spin: 'start' }, 'spin');
    expect(mockOraStart.mock.calls).toEqual([['spin']]);
    logger.info({ spin: 'succeed' }, 'succ');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32msucc\x1b[0m']]);
    logger.debug('d');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '✖', text: '\x1b[31merr\x1b[0m' }],
      [{ symbol: '⚠', text: '\x1b[33mw\x1b[0m' }],
      [{ symbol: '∙', text: 'i' }],
      [{ symbol: '\x1b[2m+\x1b[0m', text: '\x1b[2md\x1b[0m' }],
    ]);
  });
});

describe('writeLine while spinning', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    jest.resetModules();
    mockOraClear.mockClear();
    mockOraFail.mockClear();
    mockOraRender.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockSpinner.isSpinning = false;
  });

  test('info while spinning uses clear/write/render instead of stopAndPersist', async () => {
    const mockWrite = jest.fn();
    const origWrite = process.stderr.write;
    process.stderr.write = mockWrite;
    try {
      const { default: createCliLogger } = await import('./createCliLogger.js');
      const logger = createCliLogger({ logLevel: 'info' });
      mockSpinner.isSpinning = true;
      logger.info('intermediate log');
      expect(mockOraClear).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite.mock.calls[0][0]).toContain('∙');
      expect(mockWrite.mock.calls[0][0]).toContain('intermediate log');
      expect(mockOraRender).toHaveBeenCalledTimes(1);
      expect(mockOraStopAndPersist).not.toHaveBeenCalled();
    } finally {
      process.stderr.write = origWrite;
    }
  });

  test('error while spinning uses clear/write/render instead of stopAndPersist', async () => {
    const mockWrite = jest.fn();
    const origWrite = process.stderr.write;
    process.stderr.write = mockWrite;
    try {
      const { default: createCliLogger } = await import('./createCliLogger.js');
      const logger = createCliLogger({ logLevel: 'info' });
      mockSpinner.isSpinning = true;
      logger.error('problem');
      expect(mockOraClear).toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalled();
      expect(mockWrite.mock.calls[0][0]).toContain('✖');
      expect(mockOraRender).toHaveBeenCalled();
      expect(mockOraStopAndPersist).not.toHaveBeenCalled();
    } finally {
      process.stderr.write = origWrite;
    }
  });
});
