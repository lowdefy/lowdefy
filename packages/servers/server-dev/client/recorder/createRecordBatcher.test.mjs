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

import createRecordBatcher from './createRecordBatcher.js';

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
});

afterEach(() => {
  jest.useRealTimers();
});

test('createRecordBatcher sends at 20 records', () => {
  const send = jest.fn();
  const batcher = createRecordBatcher({ send });
  for (let index = 0; index < 19; index += 1) batcher.add({ index });
  expect(send).not.toHaveBeenCalled();
  batcher.add({ index: 19 });
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toHaveLength(20);
});

test('createRecordBatcher sends 5 s after the first record of a batch', () => {
  const send = jest.fn();
  const batcher = createRecordBatcher({ send });
  batcher.add({ index: 0 });
  jest.advanceTimersByTime(4000);
  batcher.add({ index: 1 });
  jest.advanceTimersByTime(999);
  expect(send).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(send).toHaveBeenCalledWith([{ index: 0 }, { index: 1 }]);
});

test('createRecordBatcher flush resolves when the send settles, and swallows a failed send', async () => {
  let settle;
  const send = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        settle = reject;
      })
  );
  const batcher = createRecordBatcher({ send });
  batcher.add({ index: 0 });
  let resolved = false;
  const flushed = batcher.flush().then(() => {
    resolved = true;
  });
  await Promise.resolve();
  expect(resolved).toBe(false);
  settle(new Error('offline'));
  await flushed;
  expect(resolved).toBe(true);
});

test('createRecordBatcher flush with nothing batched sends nothing', async () => {
  const send = jest.fn();
  await createRecordBatcher({ send }).flush();
  expect(send).not.toHaveBeenCalled();
});
