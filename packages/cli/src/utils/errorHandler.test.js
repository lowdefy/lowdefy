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

jest.unstable_mockModule('@lowdefy/logger/cli', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  const createCliLogger = jest.fn(() => logger);
  return {
    default: createCliLogger,
    createCliLogger,
  };
});

jest.unstable_mockModule('axios', () => ({
  default: {
    request: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('Print and log error with full context', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: axios } = await import('axios');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    disableTelemetry: false,
  };
  await errorHandler({ context, error });
  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  const axiosArguments = axios.request.mock.calls[0][0];
  expect(axiosArguments.headers).toEqual({
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(axiosArguments.url).toEqual('https://api.lowdefy.net/errors');
  expect(axiosArguments.method).toEqual('post');
  expect(axiosArguments.data.cliVersion).toEqual('cliVersion');
  expect(axiosArguments.data.message).toEqual('Test error');
  expect(axiosArguments.data.name).toEqual('Error');
  expect(axiosArguments.data.source).toEqual('cli');
  expect(axiosArguments.data.stack).toMatch('Error: Test error');
  expect(axiosArguments.data.lowdefyVersion).toEqual('lowdefyVersion');
  expect(axiosArguments.data.command).toEqual('command');
});

test('Print and log error with starting context', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: axios } = await import('axios');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
  };
  await errorHandler({ context, error });

  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  const axiosArguments = axios.request.mock.calls[0][0];
  expect(axiosArguments.headers).toEqual({
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(axiosArguments.url).toEqual('https://api.lowdefy.net/errors');
  expect(axiosArguments.method).toEqual('post');
  expect(axiosArguments.data.cliVersion).toEqual('cliVersion');
  expect(axiosArguments.data.message).toEqual('Test error');
  expect(axiosArguments.data.name).toEqual('Error');
  expect(axiosArguments.data.source).toEqual('cli');
  expect(axiosArguments.data.stack).toMatch('Error: Test error');
  expect(axiosArguments.data.lowdefyVersion).toBe(undefined);
  expect(axiosArguments.data.command).toBe(undefined);
});

test('Do not log error if telemetry is disabled', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: axios } = await import('axios');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    disableTelemetry: true,
  };
  await errorHandler({ context, error });

  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  expect(axios.request.mock.calls).toEqual([]);
});

test('Pass if logError fails', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: axios } = await import('axios');
  const { default: createCliLogger } = await import('@lowdefy/logger/cli');
  let didThrow = false;
  axios.request.mockImplementationOnce(() => {
    didThrow = true;
    throw new Error('Network error');
  });
  const error = new Error('Test error');
  const context = {
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    disableTelemetry: false,
  };
  await errorHandler({ context, error });
  const logger = createCliLogger.mock.results[0].value;
  expect(logger.error.mock.calls).toEqual([[error]]);
  expect(axios.request.mock.calls.length).toBe(1);
  expect(didThrow).toBe(true);
});
