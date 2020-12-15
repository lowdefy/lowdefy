/*
  Copyright 2020 Lowdefy, Inc

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

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

beforeEach(() => {
  print.error.mockReset();
});

test('Error boundary with synchronous function', async () => {
  const fn = jest.fn(() => 1 + 1);
  const wrapped = errorHandler(fn);
  const res = await wrapped();
  expect(res).toBe(2);
  expect(fn).toHaveBeenCalled();
});

test('Error boundary with asynchronous function', async () => {
  const fn = jest.fn(async () => {
    await wait(3);
    return 4;
  });
  const wrapped = errorHandler(fn);
  const res = await wrapped();
  expect(res).toBe(4);
  expect(fn).toHaveBeenCalled();
});

test('Pass args to synchronous function', async () => {
  const fn = jest.fn((arg1, arg2) => ({ arg1, arg2 }));
  const wrapped = errorHandler(fn);
  const res = await wrapped('1', '2');
  expect(res).toEqual({ arg1: '1', arg2: '2' });
});

test('Catch error synchronous function', async () => {
  const fn = jest.fn(() => {
    throw new Error('Error');
  });
  const wrapped = errorHandler(fn);
  await wrapped();
  expect(fn).toHaveBeenCalled();
  expect(print.error.mock.calls).toEqual([['Error']]);
  const axiosAgruments = axios.request.mock.calls[0][0];
  expect(axiosAgruments.headers).toEqual({
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(axiosAgruments.url).toEqual('https://api.lowdefy.net/errors');
  expect(axiosAgruments.method).toEqual('post');
  expect(axiosAgruments.data.cliVersion).toEqual('cliVersion');
  expect(axiosAgruments.data.message).toEqual('Error');
  expect(axiosAgruments.data.name).toEqual('Error');
  expect(axiosAgruments.data.source).toEqual('cli');
  expect(axiosAgruments.data.stack).toMatch('Error: Error');
});

test('Catch error asynchronous function', async () => {
  const fn = jest.fn(async () => {
    await wait(3);
    throw new Error('Async Error');
  });
  const wrapped = errorHandler(fn);
  await wrapped();
  expect(fn).toHaveBeenCalled();
  expect(print.error.mock.calls).toEqual([['Async Error']]);
  const axiosAgruments = axios.request.mock.calls[0][0];
  expect(axiosAgruments.headers).toEqual({
    'User-Agent': 'Lowdefy CLI vcliVersion',
  });
  expect(axiosAgruments.url).toEqual('https://api.lowdefy.net/errors');
  expect(axiosAgruments.method).toEqual('post');
  expect(axiosAgruments.data.cliVersion).toEqual('cliVersion');
  expect(axiosAgruments.data.message).toEqual('Async Error');
  expect(axiosAgruments.data.name).toEqual('Error');
  expect(axiosAgruments.data.source).toEqual('cli');
  expect(axiosAgruments.data.stack).toMatch('Error: Async Error');
});

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
