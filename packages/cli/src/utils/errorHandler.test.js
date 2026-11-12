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

import { vi, beforeEach, expect, test } from 'vitest';

vi.doMock('@lowdefy/logger/cli', () => {
  const logger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
  const createCliLogger = vi.fn(() => logger);
  return {
    default: createCliLogger,
    createCliLogger,
  };
});

const mockFetch = vi.fn(async () => new Response(null, { status: 204 }));
vi.stubGlobal('fetch', mockFetch);

function sentRequest(index = 0) {
  const [url, init] = mockFetch.mock.calls[index];
  return { url, method: init.method, headers: init.headers, data: JSON.parse(init.body) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('Print and log error with full context', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    options: { disableTelemetry: false },
  };
  await errorHandler({ context, error });
  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  const request = sentRequest();
  expect(request.headers).toEqual({
    'Content-Type': 'application/json',
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(request.url).toEqual('https://api.lowdefy.net/errors');
  expect(request.method).toEqual('POST');
  expect(request.data.cliVersion).toEqual('cliVersion');
  expect(request.data.message).toEqual('Test error');
  expect(request.data.name).toEqual('Error');
  expect(request.data.source).toEqual('cli');
  expect(request.data.stack).toMatch(/^ +at /);
  expect(request.data.lowdefyVersion).toEqual('lowdefyVersion');
  expect(request.data.command).toEqual('command');
});

test('Print and log error with starting context', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
  };
  await errorHandler({ context, error });

  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  const request = sentRequest();
  expect(request.headers).toEqual({
    'Content-Type': 'application/json',
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(request.url).toEqual('https://api.lowdefy.net/errors');
  expect(request.method).toEqual('POST');
  expect(request.data.cliVersion).toEqual('cliVersion');
  expect(request.data.message).toEqual('Test error');
  expect(request.data.name).toEqual('Error');
  expect(request.data.source).toEqual('cli');
  expect(request.data.stack).toMatch(/^ +at /);
  expect(request.data.lowdefyVersion).toBe(undefined);
  expect(request.data.command).toBe(undefined);
});

test('errorHandler does not report the error when options.disableTelemetry is set', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    options: { disableTelemetry: true },
  };
  await errorHandler({ context, error });

  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  expect(mockFetch.mock.calls).toEqual([]);
});

test('errorHandler does not report the error when startUp failed before options were resolved', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
    commandLineOptions: { disableTelemetry: true },
  };
  await errorHandler({ context, error });
  expect(mockFetch.mock.calls).toEqual([]);
});

test('Pass if logError fails', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  let didThrow = false;
  mockFetch.mockImplementationOnce(() => {
    didThrow = true;
    throw new Error('Network error');
  });
  const error = new Error('Test error');
  const context = {
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    options: { disableTelemetry: false },
  };
  await errorHandler({ context, error });
  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  expect(mockFetch.mock.calls.length).toBe(1);
  expect(didThrow).toBe(true);
});
