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

import { jest } from '@jest/globals';
import { wait } from '@lowdefy/helpers';

import BatchChanges from './BatchChanges.js';

const context = {};

test('BatchChanges calls the provided sync function', async () => {
  const fn = jest.fn();
  const batchChanges = new BatchChanges({ fn, context });
  batchChanges.newChange();
  await wait(600);
  expect(fn).toHaveBeenCalledTimes(1);
});

test('BatchChanges calls the provided async function', async () => {
  let done = false;
  const fn = jest.fn(async () => {
    await wait(100);
    done = true;
  });
  const batchChanges = new BatchChanges({ fn, context });
  batchChanges.newChange();
  await wait(550);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(done).toBe(false);
  await wait(70);
  expect(done).toBe(true);
});

test('BatchChanges calls the provided sync function only once if newChange is called multiple times', async () => {
  const fn = jest.fn();
  const batchChanges = new BatchChanges({ fn, context });
  batchChanges.newChange();
  batchChanges.newChange();
  batchChanges.newChange();
  await wait(600);
  expect(fn).toHaveBeenCalledTimes(1);
});

test('BatchChanges has a default minDelay', async () => {
  const fn = jest.fn();
  const batchChanges = new BatchChanges({ fn, context });
  expect(batchChanges.minDelay).toBe(500);
  expect(batchChanges.delay).toBe(500);
});

test('BatchChanges set minDelay', async () => {
  const fn = jest.fn();
  const batchChanges = new BatchChanges({ fn, context, minDelay: 42 });
  expect(batchChanges.minDelay).toBe(42);
  expect(batchChanges.delay).toBe(42);
});

test('BatchChanges resets timer if newChange is called multiple times in delay window', async () => {
  const fn = jest.fn();
  const batchChanges = new BatchChanges({ fn, context });
  batchChanges.newChange();
  await wait(400);
  batchChanges.newChange();
  await wait(400);
  batchChanges.newChange();
  await wait(600);
  expect(fn).toHaveBeenCalledTimes(1);
});

test('BatchChanges retries on errors, with back-off', async () => {
  let count = 0;
  let success = false;
  const context = {
    print: {
      error: jest.fn(),
      warn: jest.fn(),
    },
  };
  const fn = jest.fn(() => {
    if (count > 1) {
      success = true;
      return;
    }
    count += 1;
    throw new Error(`Error: ${count}`);
  });
  const batchChanges = new BatchChanges({ fn, context, minDelay: 100 });
  batchChanges.newChange();
  await wait(120);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(context.print.error.mock.calls).toEqual([['Error: 1']]);
  expect(context.print.warn.mock.calls).toEqual([['Retrying in 0.2s.']]);
  expect(batchChanges.delay).toBe(200);
  expect(count).toBe(1);
  await wait(200);
  expect(fn).toHaveBeenCalledTimes(2);
  expect(context.print.error.mock.calls).toEqual([['Error: 1'], ['Error: 2']]);
  expect(context.print.warn.mock.calls).toEqual([['Retrying in 0.2s.'], ['Retrying in 0.4s.']]);
  expect(batchChanges.delay).toBe(400);
  expect(count).toBe(2);
  await wait(400);
  expect(fn).toHaveBeenCalledTimes(3);
  expect(context.print.error.mock.calls).toEqual([['Error: 1'], ['Error: 2']]);
  expect(context.print.warn.mock.calls).toEqual([['Retrying in 0.2s.'], ['Retrying in 0.4s.']]);
  expect(success).toBe(true);
});

test('BatchChanges calls function again if it receives new change while executing', async () => {
  const fn = jest.fn(async () => {
    await wait(50);
  });
  const batchChanges = new BatchChanges({ fn, context, minDelay: 50 });
  batchChanges.newChange();
  await wait(60);
  batchChanges.newChange();
  expect(fn).toHaveBeenCalledTimes(1);
  await wait(50);
  expect(fn).toHaveBeenCalledTimes(2);
});

test('BatchChanges provides arguments to the called function', async () => {
  const fn = jest.fn();
  const batchChanges = new BatchChanges({ fn, context, minDelay: 5 });
  batchChanges.newChange(1, 2, 3);
  batchChanges.newChange('a', 'b', 'c');
  batchChanges.newChange({ a: 1 });
  await wait(6);
  expect(fn.mock.calls).toEqual([[[[1, 2, 3], ['a', 'b', 'c'], [{ a: 1 }]]]]);
});
