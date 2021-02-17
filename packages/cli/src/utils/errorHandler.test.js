/*
  Copyright 2020-2021 Lowdefy, Inc

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

import axios from 'axios';
import errorHandler from './errorHandler';
import createPrint from './print';
// eslint-disable-next-line no-unused-vars
import packageJson from '../../package.json';

jest.mock('../../package.json', () => ({ version: 'cliVersion' }));

jest.mock('./print', () => {
  const error = jest.fn();
  return () => ({
    error,
  });
});
jest.mock('axios');

const print = createPrint();

beforeEach(() => {
  print.error.mockReset();
});

test('Print and log error with full context', async () => {
  const error = new Error('Test error');
  const context = {
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    disableTelemetry: false,
  };
  await errorHandler({ context, error });

  expect(print.error.mock.calls).toEqual([['Test error']]);
  const axiosAgruments = axios.request.mock.calls[0][0];
  expect(axiosAgruments.headers).toEqual({
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(axiosAgruments.url).toEqual('https://api.lowdefy.net/errors');
  expect(axiosAgruments.method).toEqual('post');
  expect(axiosAgruments.data.cliVersion).toEqual('cliVersion');
  expect(axiosAgruments.data.message).toEqual('Test error');
  expect(axiosAgruments.data.name).toEqual('Error');
  expect(axiosAgruments.data.source).toEqual('cli');
  expect(axiosAgruments.data.stack).toMatch('Error: Test error');
  expect(axiosAgruments.data.lowdefyVersion).toEqual('lowdefyVersion');
  expect(axiosAgruments.data.command).toEqual('command');
});

test('Print and log error with empty context', async () => {
  const error = new Error('Test error');
  const context = {};
  await errorHandler({ context, error });

  expect(print.error.mock.calls).toEqual([['Test error']]);
  const axiosAgruments = axios.request.mock.calls[0][0];
  expect(axiosAgruments.headers).toEqual({
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(axiosAgruments.url).toEqual('https://api.lowdefy.net/errors');
  expect(axiosAgruments.method).toEqual('post');
  expect(axiosAgruments.data.cliVersion).toEqual('cliVersion');
  expect(axiosAgruments.data.message).toEqual('Test error');
  expect(axiosAgruments.data.name).toEqual('Error');
  expect(axiosAgruments.data.source).toEqual('cli');
  expect(axiosAgruments.data.stack).toMatch('Error: Test error');
  expect(axiosAgruments.data.lowdefyVersion).toBe(undefined);
  expect(axiosAgruments.data.command).toBe(undefined);
});

test('Do not log error if telemetry is disabled', async () => {
  const error = new Error('Test error');
  const context = {
    lowdefyVersion: 'lowdefyVersion',
    command: 'command',
    disableTelemetry: true,
  };
  await errorHandler({ context, error });

  expect(print.error.mock.calls).toEqual([['Test error']]);
  expect(axios.request.mock.calls).toEqual([]);
});

test('Pass if logError fails', async () => {
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
//   const axiosAgruments = axios.request.mock.calls[0][0];
//   expect(axiosAgruments.headers).toEqual({
//     'User-Agent': 'Lowdefy CLI vcliVersion',
//   });
//   expect(axiosAgruments.url).toEqual('https://api.lowdefy.net/errors');
//   expect(axiosAgruments.method).toEqual('post');
//   expect(axiosAgruments.data.cliVersion).toEqual('cliVersion');
//   expect(axiosAgruments.data.message).toEqual('Async Error');
//   expect(axiosAgruments.data.name).toEqual('Error');
//   expect(axiosAgruments.data.source).toEqual('cli');
//   expect(axiosAgruments.data.stack).toMatch('Error: Async Error');
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
