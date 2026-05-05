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

const mockOraFail = jest.fn();
const mockOraStart = jest.fn();
const mockOraSucceed = jest.fn();

const mockSpinner = {
  fail: mockOraFail,
  start: mockOraStart,
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

// mock process.stderr.write
const originalStderrWrite = process.stderr.write.bind(process.stderr);
const mockStderrWrite = jest.fn();
process.stderr.write = mockStderrWrite;

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

afterAll(() => {
  process.stderr.write = originalStderrWrite;
});

// Default time mock returns 00:00:00
mockGetHours.mockReturnValue(0);
mockGetMinutes.mockReturnValue(0);
mockGetSeconds.mockReturnValue(0);

const TIME_PREFIX = '\x1b[2m00:00:00\x1b[0m';

function resetMocks() {
  jest.resetModules();
  mockOraFail.mockClear();
  mockOraStart.mockClear();
  mockOraSucceed.mockClear();
  mockStderrWrite.mockClear();
  mockConsoleError.mockClear();
  mockConsoleLog.mockClear();
  mockConsoleWarn.mockClear();
  mockConsoleDebug.mockClear();
}

describe('memoisation', () => {
  beforeEach(() => {
    resetMocks();
  });

  test('same print instance on repeated createCliLogger calls', async () => {
    process.env.CI = 'false';
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger1 = createCliLogger({ logLevel: 'info' });
    const logger2 = createCliLogger({ logLevel: 'info' });
    logger1.info('from logger1');
    logger2.info('from logger2');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ∙ from logger1\n`],
      [`${TIME_PREFIX} ∙ from logger2\n`],
    ]);
  });

  test('creates ora print when CI is false', async () => {
    process.env.CI = 'false';
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info('Test');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ∙ Test\n`]]);
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
    resetMocks();
  });

  test('logger.info with plain string', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info('hello');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ∙ hello\n`]]);
  });

  test('logger.error with plain string uses red', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.error('boom');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ✖ \x1b[31mboom\x1b[0m\n`]]);
  });

  test('logger.warn with plain string uses yellow', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.warn('careful');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ⚠ \x1b[33mcareful\x1b[0m\n`]]);
  });

  test('logger.debug with plain string uses gray', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'debug' });
    logger.debug('details');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} \x1b[2m+\x1b[0m \x1b[2mdetails\x1b[0m\n`],
    ]);
  });
});

describe('error input', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    resetMocks();
  });

  test('error with source logs source in blue then error message', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('bad thing');
    err.source = 'pages/home.yaml:5';
    logger.error(err);
    expect(mockStderrWrite.mock.calls[0]).toEqual([
      `${TIME_PREFIX} ∙ \x1b[34mpages/home.yaml:5\x1b[0m\n`,
    ]);
    expect(mockStderrWrite.mock.calls[1]).toEqual([
      `${TIME_PREFIX} ✖ \x1b[31m[Error] bad thing\x1b[0m\n`,
    ]);
  });

  test('plain Error logs stack trace in gray', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('unexpected');
    logger.error(err);
    expect(mockStderrWrite.mock.calls.length).toBe(2);
    expect(mockStderrWrite.mock.calls[0][0]).toBe(`${TIME_PREFIX} ✖ \x1b[31m[Error] unexpected\x1b[0m\n`);
    expect(mockStderrWrite.mock.calls[1][0]).toMatch(
      new RegExp(`^${TIME_PREFIX.replace(/\[/g, '\\[')} ✖ \\x1b\\[2m[\\s\\S]*\\x1b\\[0m\\n$`)
    );
  });

  test('LowdefyInternalError logs stack trace in gray', async () => {
    const { LowdefyInternalError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new LowdefyInternalError('internal bug');
    logger.error(err);
    expect(mockStderrWrite.mock.calls.length).toBe(2);
    expect(mockStderrWrite.mock.calls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[LowdefyInternalError] internal bug\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls[1][0]).toMatch(
      new RegExp(`^${TIME_PREFIX.replace(/\[/g, '\\[')} ✖ \\x1b\\[2m[\\s\\S]*\\x1b\\[0m\\n$`)
    );
  });

  test('ConfigError does not log stack trace', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new ConfigError('bad config');
    logger.error(err);
    const errorCalls = mockStderrWrite.mock.calls.filter((call) => call[0].includes('✖'));
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0]).toBe(`${TIME_PREFIX} ✖ \x1b[31m[ConfigError] bad config\x1b[0m\n`);
  });

  test('OperatorError does not log stack trace', async () => {
    const { OperatorError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new OperatorError('operator broke');
    logger.error(err);
    const errorCalls = mockStderrWrite.mock.calls.filter((call) => call[0].includes('✖'));
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[OperatorError] operator broke\x1b[0m\n`
    );
  });

  test('ServiceError does not log stack trace', async () => {
    const { ServiceError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new ServiceError('service down');
    logger.error(err);
    const errorCalls = mockStderrWrite.mock.calls.filter((call) => call[0].includes('✖'));
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0]).toBe(`${TIME_PREFIX} ✖ \x1b[31m[ServiceError] service down\x1b[0m\n`);
  });

  test('UserError does not log stack trace', async () => {
    const { UserError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new UserError('user did something');
    logger.error(err);
    const errorCalls = mockStderrWrite.mock.calls.filter((call) => call[0].includes('✖'));
    expect(errorCalls.length).toBe(1);
    expect(errorCalls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[UserError] user did something\x1b[0m\n`
    );
  });

  test('TypeError logs stack trace in gray (not a Lowdefy error class)', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new TypeError('cannot read property');
    logger.error(err);
    const errorCalls = mockStderrWrite.mock.calls.filter((call) => call[0].includes('✖'));
    expect(errorCalls.length).toBe(2);
    expect(errorCalls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[TypeError] cannot read property\x1b[0m\n`
    );
    expect(errorCalls[1][0]).toMatch(
      new RegExp(`^${TIME_PREFIX.replace(/\[/g, '\\[')} ✖ \\x1b\\[2m[\\s\\S]*\\x1b\\[0m\\n$`)
    );
  });

  test('error with received value includes it in display string', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('bad input');
    err.received = { key: 'val' };
    logger.error(err);
    expect(mockStderrWrite.mock.calls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[Error] bad input Received: {"key":"val"}\x1b[0m\n`
    );
  });
});

describe('cause chain', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    resetMocks();
  });

  test('error with cause shows Caused by line without cause stack at info level', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new Error('root cause');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    expect(mockStderrWrite.mock.calls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[Error] wrapper\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls[1][0]).toMatch(
      new RegExp(`^${TIME_PREFIX.replace(/\[/g, '\\[')} ✖ \\x1b\\[2m[\\s\\S]*\\x1b\\[0m\\n$`)
    );
    expect(mockStderrWrite.mock.calls[2][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m  Caused by: [Error] root cause\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls.length).toBe(3);
  });

  test('ConfigError cause does not show stack', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new ConfigError('bad config');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    expect(mockStderrWrite.mock.calls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[Error] wrapper\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls[1][0]).toMatch(
      new RegExp(`^${TIME_PREFIX.replace(/\[/g, '\\[')} ✖ \\x1b\\[2m[\\s\\S]*\\x1b\\[0m\\n$`)
    );
    expect(mockStderrWrite.mock.calls[2][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m  Caused by: [ConfigError] bad config\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls.length).toBe(3);
  });

  test('plain Error cause does not show stack at info level', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new Error('root');
    const err = new ConfigError('config', { cause });
    logger.error(err);
    expect(mockStderrWrite.mock.calls[0][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m[ConfigError] config\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls[1][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m  Caused by: [Error] root\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls.length).toBe(2);
  });

  test('multi-level cause chain walks all levels without cause stacks at info', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const root = new Error('root');
    const mid = new Error('middle', { cause: root });
    const top = new Error('top', { cause: mid });
    logger.error(top);
    expect(mockStderrWrite.mock.calls[0][0]).toBe(`${TIME_PREFIX} ✖ \x1b[31m[Error] top\x1b[0m\n`);
    expect(mockStderrWrite.mock.calls[1][0]).toMatch(
      new RegExp(`^${TIME_PREFIX.replace(/\[/g, '\\[')} ✖ \\x1b\\[2m[\\s\\S]*\\x1b\\[0m\\n$`)
    );
    expect(mockStderrWrite.mock.calls[2][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m  Caused by: [Error] middle\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls[3][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m  Caused by: [Error] root\x1b[0m\n`
    );
    expect(mockStderrWrite.mock.calls.length).toBe(4);
  });

  test('cause stacks are logged at debug level', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'debug' });
    const cause = new Error('root cause');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    const calls = mockStderrWrite.mock.calls;
    expect(calls[0][0]).toBe(`${TIME_PREFIX} ✖ \x1b[31m[Error] wrapper\x1b[0m\n`);
    expect(calls[1][0]).toMatch(
      new RegExp(`^${TIME_PREFIX.replace(/\[/g, '\\[')} ✖ \\x1b\\[2m[\\s\\S]*\\x1b\\[0m\\n$`)
    );
    expect(calls[2][0]).toBe(
      `${TIME_PREFIX} ✖ \x1b[31m  Caused by: [Error] root cause\x1b[0m\n`
    );
    const causeStackCall = calls.find((call) => call[0].includes('\x1b[2m+\x1b[0m'));
    expect(causeStackCall).toBeDefined();
  });

  test('error without cause does not show Caused by line', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('no cause');
    logger.error(err);
    expect(mockStderrWrite.mock.calls.length).toBe(2);
  });
});

describe('pino two-arg form', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    resetMocks();
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
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ∙ \x1b[34msome info\x1b[0m\n`],
    ]);
  });

  test('logger.info({ source: "file.yaml:5" }, "text") logs source in blue then message', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ source: 'file.yaml:5' }, 'config issue');
    expect(mockStderrWrite.mock.calls[0]).toEqual([
      `${TIME_PREFIX} ∙ \x1b[34mfile.yaml:5\x1b[0m\n`,
    ]);
    expect(mockStderrWrite.mock.calls[1]).toEqual([`${TIME_PREFIX} ∙ config issue\n`]);
  });

  test('logger.error({ color: "blue" }, "text") applies blue at error level', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.error({ color: 'blue' }, 'blue error');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ✖ \x1b[34mblue error\x1b[0m\n`],
    ]);
  });
});

describe('fallback', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    resetMocks();
  });

  test('non-error non-string object is JSON.stringified', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ foo: 'bar', baz: 42 });
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ∙ ${JSON.stringify({ foo: 'bar', baz: 42 }, null, 2)}\n`],
    ]);
  });
});

describe('level filtering', () => {
  beforeEach(() => {
    process.env.CI = 'false';
    resetMocks();
  });

  test('log level error silences warn/info/debug/spin/succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'error' });
    logger.error('err');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`]]);
    logger.warn('w');
    expect(mockStderrWrite.mock.calls.length).toBe(1);
    logger.info('i');
    logger.info({ spin: 'start' }, 'spin');
    logger.info({ spin: 'succeed' }, 'succeed');
    expect(mockStderrWrite.mock.calls.length).toBe(1);
    expect(mockOraStart.mock.calls).toEqual([]);
    expect(mockOraSucceed.mock.calls).toEqual([]);
    logger.debug('d');
    expect(mockStderrWrite.mock.calls.length).toBe(1);
  });

  test('log level warn allows error and warn', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'warn' });
    logger.error('err');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`]]);
    logger.warn('w');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`],
      [`${TIME_PREFIX} ⚠ \x1b[33mw\x1b[0m\n`],
    ]);
    logger.info('i');
    expect(mockStderrWrite.mock.calls.length).toBe(2);
    logger.debug('d');
    expect(mockStderrWrite.mock.calls.length).toBe(2);
  });

  test('log level info allows error, warn, info, spin, succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.error('err');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`]]);
    logger.warn('w');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`],
      [`${TIME_PREFIX} ⚠ \x1b[33mw\x1b[0m\n`],
    ]);
    logger.info('i');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`],
      [`${TIME_PREFIX} ⚠ \x1b[33mw\x1b[0m\n`],
      [`${TIME_PREFIX} ∙ i\n`],
    ]);
    logger.info({ spin: 'start' }, 'spin');
    expect(mockOraStart.mock.calls).toEqual([['spin']]);
    logger.info({ spin: 'succeed' }, 'succ');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32msucc\x1b[0m']]);
    logger.debug('d');
    expect(mockStderrWrite.mock.calls.length).toBe(3);
  });

  test('log level debug allows all levels', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'debug' });
    logger.error('err');
    expect(mockStderrWrite.mock.calls).toEqual([[`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`]]);
    logger.warn('w');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`],
      [`${TIME_PREFIX} ⚠ \x1b[33mw\x1b[0m\n`],
    ]);
    logger.info('i');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`],
      [`${TIME_PREFIX} ⚠ \x1b[33mw\x1b[0m\n`],
      [`${TIME_PREFIX} ∙ i\n`],
    ]);
    logger.info({ spin: 'start' }, 'spin');
    expect(mockOraStart.mock.calls).toEqual([['spin']]);
    logger.info({ spin: 'succeed' }, 'succ');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32msucc\x1b[0m']]);
    logger.debug('d');
    expect(mockStderrWrite.mock.calls).toEqual([
      [`${TIME_PREFIX} ✖ \x1b[31merr\x1b[0m\n`],
      [`${TIME_PREFIX} ⚠ \x1b[33mw\x1b[0m\n`],
      [`${TIME_PREFIX} ∙ i\n`],
      [`${TIME_PREFIX} \x1b[2m+\x1b[0m \x1b[2md\x1b[0m\n`],
    ]);
  });
});
