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

jest.unstable_mockModule('./createPrint.js', () => {
  const error = jest.fn();
  return {
    default: () => ({
      error,
    }),
  };
});

jest.unstable_mockModule('axios', () => ({
  default: {
    request: jest.fn(),
  },
}));

test('Print and log error with full context', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: axios } = await import('axios');
  const { default: createPrint } = await import('./createPrint.js');
  const print = createPrint();
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    disableTelemetry: false,
  };
  await errorHandler({ context, error });
  expect(print.error.mock.calls).toEqual([['Test error']]);
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
  const { default: createPrint } = await import('./createPrint.js');
  const print = createPrint();
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
  };
  await errorHandler({ context, error });

  expect(print.error.mock.calls).toEqual([['Test error']]);
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
  const { default: createPrint } = await import('./createPrint.js');
  const print = createPrint();
  const error = new Error('Test error');
  const context = {
    cliVersion: 'cliVersion',
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    disableTelemetry: true,
  };
  await errorHandler({ context, error });

  expect(print.error.mock.calls).toEqual([['Test error']]);
  expect(axios.request.mock.calls).toEqual([]);
});

test('Pass if logError fails', async () => {
  const { default: errorHandler } = await import('./errorHandler.js');
  const { default: axios } = await import('axios');
  const { default: createPrint } = await import('./createPrint.js');
  const print = createPrint();
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
  expect(print.error.mock.calls).toEqual([['Test error']]);
  expect(axios.request.mock.calls.length).toBe(1);
  expect(didThrow).toBe(true);
});

// test('Catch error synchronous function', async () => {
//   const fn = jest.fn(() => {
//     throw new Error('Error');
//   });
//   const wrapped = errorHandler(fn);
//   await wrapped();
//   expect(fn).toHaveBeenCalled();

//   const error =
// });

// test('Catch error asynchronous function', async () => {
//   const fn = jest.fn(async () => {
//     await wait(3);
//     throw new Error('Async Error');
//   });
//   const wrapped = errorHandler(fn);
//   await wrapped();
//   expect(fn).toHaveBeenCalled();
//   expect(print.error.mock.calls).toEqual([['Async Error']]);
//   const axiosArguments = axios.request.mock.calls[0][0];
//   expect(axiosArguments.headers).toEqual({
//     'User-Agent': 'Lowdefy CLI vcliVersion',
//   });
//   expect(axiosArguments.url).toEqual('https://api.lowdefy.net/errors');
//   expect(axiosArguments.method).toEqual('post');
//   expect(axiosArguments.data.cliVersion).toEqual('cliVersion');
//   expect(axiosArguments.data.message).toEqual('Async Error');
//   expect(axiosArguments.data.name).toEqual('Error');
//   expect(axiosArguments.data.source).toEqual('cli');
//   expect(axiosArguments.data.stack).toMatch('Error: Async Error');
// });

// test('Catch error synchronous function, stay alive', async () => {
//   const fn = jest.fn(() => {
//     throw new Error('Error');
//   });
//   const wrapped = errorHandler(fn, { stayAlive: true });
//   const res = await wrapped();
//   expect(res).toBe(undefined);
//   expect(fn).toHaveBeenCalled();
//   expect(print.error.mock.calls).toEqual([['Error']]);
// });

// test('Catch error asynchronous function, stay alive', async () => {
//   const fn = jest.fn(async () => {
//     await wait(3);
//     throw new Error('Async Error');
//   });
//   const wrapped = errorHandler(fn, { stayAlive: true });
//   const res = await wrapped();
//   expect(res).toBe(undefined);
//   expect(fn).toHaveBeenCalled();
//   expect(print.error.mock.calls).toEqual([['Async Error']]);
// });
