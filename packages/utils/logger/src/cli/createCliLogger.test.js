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

describe('memoisation', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('same print instance on repeated createCliLogger calls', async () => {
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
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const realCI = process.env.CI;
    process.env.CI = 'false';
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info('Test');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'Test' }]]);
    process.env.CI = realCI;
  });

  test('creates basic print when CI is true', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const realCI = process.env.CI;
    process.env.CI = 'true';
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info('Test log');
    expect(mockConsoleLog.mock.calls).toEqual([['Test log']]);
    process.env.CI = realCI;
  });
});

describe('string input', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOraFail.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockOraWarn.mockClear();
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
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31mboom\x1b[0m']]);
  });

  test('logger.warn with plain string uses yellow', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.warn('careful');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mcareful\x1b[0m']]);
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
    jest.resetModules();
    mockOraFail.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockOraWarn.mockClear();
  });

  test('error with source logs source in blue then error message', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('bad thing');
    err.source = 'pages/home.yaml:5';
    logger.error(err);
    // source logged as info with blue color
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: '\x1b[34mpages/home.yaml:5\x1b[0m' }],
    ]);
    // error message logged at error level (with default red color)
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[Error] bad thing\x1b[0m');
  });

  test('plain Error logs stack trace in gray', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('unexpected');
    logger.error(err);
    expect(mockOraFail.mock.calls.length).toBe(2);
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[Error] unexpected\x1b[0m');
    // Second call is the stack wrapped in gray ANSI
    expect(mockOraFail.mock.calls[1][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
  });

  test('LowdefyInternalError logs stack trace in gray', async () => {
    const { LowdefyInternalError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new LowdefyInternalError('internal bug');
    logger.error(err);
    expect(mockOraFail.mock.calls.length).toBe(2);
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[LowdefyInternalError] internal bug\x1b[0m');
    // Second call is the stack wrapped in gray ANSI
    expect(mockOraFail.mock.calls[1][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
  });

  test('ConfigError does not log stack trace', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new ConfigError('bad config');
    logger.error(err);
    expect(mockOraFail.mock.calls.length).toBe(1);
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[ConfigError] bad config\x1b[0m');
  });

  test('OperatorError does not log stack trace', async () => {
    const { OperatorError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new OperatorError('operator broke');
    logger.error(err);
    expect(mockOraFail.mock.calls.length).toBe(1);
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[OperatorError] operator broke\x1b[0m');
  });

  test('ServiceError does not log stack trace', async () => {
    const { ServiceError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new ServiceError('service down');
    logger.error(err);
    expect(mockOraFail.mock.calls.length).toBe(1);
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[ServiceError] service down\x1b[0m');
  });

  test('UserError does not log stack trace', async () => {
    const { UserError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new UserError('user did something');
    logger.error(err);
    expect(mockOraFail.mock.calls.length).toBe(1);
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[UserError] user did something\x1b[0m');
  });

  test('TypeError logs stack trace in gray (not a Lowdefy error class)', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new TypeError('cannot read property');
    logger.error(err);
    expect(mockOraFail.mock.calls.length).toBe(2);
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[TypeError] cannot read property\x1b[0m');
    expect(mockOraFail.mock.calls[1][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
  });

  test('error with received value includes it in display string', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('bad input');
    err.received = { key: 'val' };
    logger.error(err);
    expect(mockOraFail.mock.calls[0][0]).toBe(
      '\x1b[31m[Error] bad input Received: {"key":"val"}\x1b[0m'
    );
  });
});

describe('cause chain', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOraFail.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockOraWarn.mockClear();
  });

  test('error with cause shows Caused by line', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new Error('root cause');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    // wrapper message + wrapper stack + caused by + cause stack
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[Error] wrapper\x1b[0m');
    // Stack for wrapper (plain Error shows stack)
    expect(mockOraFail.mock.calls[1][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    // Caused by line
    expect(mockOraFail.mock.calls[2][0]).toBe('\x1b[31m  Caused by: [Error] root cause\x1b[0m');
    // Cause stack (plain Error shows stack)
    expect(mockOraFail.mock.calls[3][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
  });

  test('ConfigError cause does not show stack', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new ConfigError('bad config');
    const err = new Error('wrapper', { cause });
    logger.error(err);
    // wrapper message + wrapper stack + caused by (no cause stack for ConfigError)
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[Error] wrapper\x1b[0m');
    expect(mockOraFail.mock.calls[1][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraFail.mock.calls[2][0]).toBe(
      '\x1b[31m  Caused by: [ConfigError] bad config\x1b[0m'
    );
    // No stack for ConfigError — only 3 calls total
    expect(mockOraFail.mock.calls.length).toBe(3);
  });

  test('plain Error cause shows stack', async () => {
    const { ConfigError } = await import('@lowdefy/errors');
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const cause = new Error('root');
    const err = new ConfigError('config', { cause });
    logger.error(err);
    // ConfigError message (no stack for ConfigError)
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[ConfigError] config\x1b[0m');
    // Caused by line
    expect(mockOraFail.mock.calls[1][0]).toBe('\x1b[31m  Caused by: [Error] root\x1b[0m');
    // Cause stack (plain Error shows stack)
    expect(mockOraFail.mock.calls[2][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraFail.mock.calls.length).toBe(3);
  });

  test('multi-level cause chain walks all levels', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const root = new Error('root');
    const mid = new Error('middle', { cause: root });
    const top = new Error('top', { cause: mid });
    logger.error(top);
    // top message + top stack + caused by mid + mid stack + caused by root + root stack
    expect(mockOraFail.mock.calls[0][0]).toBe('\x1b[31m[Error] top\x1b[0m');
    expect(mockOraFail.mock.calls[1][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraFail.mock.calls[2][0]).toBe('\x1b[31m  Caused by: [Error] middle\x1b[0m');
    expect(mockOraFail.mock.calls[3][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraFail.mock.calls[4][0]).toBe('\x1b[31m  Caused by: [Error] root\x1b[0m');
    expect(mockOraFail.mock.calls[5][0]).toMatch(/^\x1b\[2m[\s\S]*\x1b\[0m$/);
    expect(mockOraFail.mock.calls.length).toBe(6);
  });

  test('error without cause does not show Caused by line', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    const err = new Error('no cause');
    logger.error(err);
    // message + stack only, no Caused by
    expect(mockOraFail.mock.calls.length).toBe(2);
  });
});

describe('pino two-arg form', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOraFail.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockOraWarn.mockClear();
  });

  test('logger.info({ spin: true }, "text") calls print.spin', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ spin: true }, 'Building pages...');
    expect(mockOraStart.mock.calls).toEqual([['Building pages...']]);
  });

  test('logger.info({ succeed: true }, "text") calls print.succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.info({ succeed: true }, 'Done!');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32mDone!\x1b[0m']]);
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
    expect(mockOraFail.mock.calls).toEqual([['\x1b[34mblue error\x1b[0m']]);
  });
});

describe('fallback', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOraFail.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockOraWarn.mockClear();
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
    jest.resetModules();
    mockOraFail.mockClear();
    mockOraStart.mockClear();
    mockOraStopAndPersist.mockClear();
    mockOraSucceed.mockClear();
    mockOraWarn.mockClear();
  });

  test('log level error silences warn/info/debug/spin/succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'error' });
    logger.error('err');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31merr\x1b[0m']]);
    logger.warn('w');
    expect(mockOraWarn.mock.calls).toEqual([]);
    logger.info('i');
    logger.info({ spin: true }, 'spin');
    logger.info({ succeed: true }, 'succeed');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
    expect(mockOraStart.mock.calls).toEqual([]);
    expect(mockOraSucceed.mock.calls).toEqual([]);
    logger.debug('d');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
  });

  test('log level warn allows error and warn', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'warn' });
    logger.error('err');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31merr\x1b[0m']]);
    logger.warn('w');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mw\x1b[0m']]);
    logger.info('i');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
    logger.debug('d');
    expect(mockOraStopAndPersist.mock.calls).toEqual([]);
  });

  test('log level info allows error, warn, info, spin, succeed', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'info' });
    logger.error('err');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31merr\x1b[0m']]);
    logger.warn('w');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mw\x1b[0m']]);
    logger.info('i');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'i' }]]);
    logger.info({ spin: true }, 'spin');
    expect(mockOraStart.mock.calls).toEqual([['spin']]);
    logger.info({ succeed: true }, 'succ');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32msucc\x1b[0m']]);
    logger.debug('d');
    // debug is silenced at info level — no additional stopAndPersist call
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'i' }]]);
  });

  test('log level debug allows all levels', async () => {
    const { default: createCliLogger } = await import('./createCliLogger.js');
    const logger = createCliLogger({ logLevel: 'debug' });
    logger.error('err');
    expect(mockOraFail.mock.calls).toEqual([['\x1b[31merr\x1b[0m']]);
    logger.warn('w');
    expect(mockOraWarn.mock.calls).toEqual([['\x1b[33mw\x1b[0m']]);
    logger.info('i');
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙', text: 'i' }]]);
    logger.info({ spin: true }, 'spin');
    expect(mockOraStart.mock.calls).toEqual([['spin']]);
    logger.info({ succeed: true }, 'succ');
    expect(mockOraSucceed.mock.calls).toEqual([['\x1b[32msucc\x1b[0m']]);
    logger.debug('d');
    expect(mockOraStopAndPersist.mock.calls).toEqual([
      [{ symbol: '∙', text: 'i' }],
      [{ symbol: '\x1b[2m+\x1b[0m', text: '\x1b[2md\x1b[0m' }],
    ]);
  });
});
