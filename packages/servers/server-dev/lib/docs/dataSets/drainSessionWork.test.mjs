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

import drainSessionWork from './drainSessionWork.js';

afterEach(() => {
  jest.useRealTimers();
});

test('drainSessionWork resolves true once every promise, including one added while waiting, settles', async () => {
  const work = new Set();
  let releaseFirst;
  let releaseSecond;
  const second = new Promise((resolve) => {
    releaseSecond = resolve;
  });
  const first = new Promise((resolve) => {
    releaseFirst = resolve;
  }).then(() => {
    work.delete(first);
    work.add(second);
  });
  second.then(() => work.delete(second));
  work.add(first);
  const draining = drainSessionWork({ work, timeoutMs: 30000 });
  releaseFirst();
  await Promise.resolve();
  releaseSecond();
  await expect(draining).resolves.toBe(true);
});

test('drainSessionWork resolves true at once with no work', async () => {
  await expect(drainSessionWork({ work: new Set(), timeoutMs: 30000 })).resolves.toBe(true);
});

test('drainSessionWork resolves false after the timeout when work never settles', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  const work = new Set([new Promise(() => {})]);
  const draining = drainSessionWork({ work, timeoutMs: 30000 });
  let done = false;
  draining.then(() => {
    done = true;
  });
  jest.advanceTimersByTime(29999);
  await Promise.resolve();
  expect(done).toBe(false);
  jest.advanceTimersByTime(1);
  await expect(draining).resolves.toBe(false);
});
