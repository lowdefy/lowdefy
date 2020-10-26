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

import errorBoundary from './errorBoundary';
import createPrint from './print';

jest.mock('./print', () => {
  const error = jest.fn();
  return () => ({
    error,
  });
});

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
  const wrapped = errorBoundary(fn);
  const res = await wrapped();
  expect(res).toBe(2);
  expect(fn).toHaveBeenCalled();
});

test('Error boundary with asynchronous function', async () => {
  const fn = jest.fn(async () => {
    await wait(3);
    return 4;
  });
  const wrapped = errorBoundary(fn);
  const res = await wrapped();
  expect(res).toBe(4);
  expect(fn).toHaveBeenCalled();
});

test('Pass args to synchronous function', async () => {
  const fn = jest.fn((arg1, arg2) => ({ arg1, arg2 }));
  const wrapped = errorBoundary(fn);
  const res = await wrapped('1', '2');
  expect(res).toEqual({ arg1: '1', arg2: '2' });
});

test('Catch error synchronous function, stay alive', async () => {
  const fn = jest.fn(() => {
    throw new Error('Error');
  });
  const wrapped = errorBoundary(fn, { stayAlive: true });
  const res = await wrapped();
  expect(res).toBe(undefined);
  expect(fn).toHaveBeenCalled();
  expect(print.error.mock.calls).toEqual([['Error']]);
});

test('Catch error asynchronous function, stay alive', async () => {
  const fn = jest.fn(async () => {
    await wait(3);
    throw new Error('Async Error');
  });
  const wrapped = errorBoundary(fn, { stayAlive: true });
  const res = await wrapped();
  expect(res).toBe(undefined);
  expect(fn).toHaveBeenCalled();
  expect(print.error.mock.calls).toEqual([['Async Error']]);
});

test('Catch error synchronous function, exit process', async () => {
  const realExit = process.exit;
  const mockExit = jest.fn();
  process.exit = mockExit;
  const fn = jest.fn(() => {
    throw new Error('Error');
  });
  const wrapped = errorBoundary(fn);
  await wrapped();
  expect(fn).toHaveBeenCalled();
  expect(print.error.mock.calls).toEqual([['Error']]);
  expect(mockExit).toHaveBeenCalled();
  process.exit = realExit;
});

test('Catch error asynchronous function, exit process', async () => {
  const realExit = process.exit;
  const mockExit = jest.fn();
  process.exit = mockExit;
  const fn = jest.fn(async () => {
    await wait(3);
    throw new Error('Async Error');
  });
  const wrapped = errorBoundary(fn);
  await wrapped();
  expect(fn).toHaveBeenCalled();
  expect(print.error.mock.calls).toEqual([['Async Error']]);
  expect(mockExit).toHaveBeenCalled();
  process.exit = realExit;
});
