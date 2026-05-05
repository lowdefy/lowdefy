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

import createRateLimiter from './createRateLimiter.js';

test('createRateLimiter without perSecond always allows events', () => {
  const limiter = createRateLimiter({});
  for (let i = 0; i < 1000; i++) {
    expect(limiter.check()).toBe(true);
  }
});

test('createRateLimiter allows up to perSecond events in a window', () => {
  let now = 1_000_000;
  const limiter = createRateLimiter({ perSecond: 5, now: () => now });
  for (let i = 0; i < 5; i++) {
    expect(limiter.check()).toBe(true);
  }
  expect(limiter.check()).toBe(false);
});

test('createRateLimiter resets counter when window rolls over', () => {
  let now = 1_000_000;
  const limiter = createRateLimiter({ perSecond: 2, now: () => now });
  expect(limiter.check()).toBe(true);
  expect(limiter.check()).toBe(true);
  expect(limiter.check()).toBe(false);
  now += 1001;
  expect(limiter.check()).toBe(true);
  expect(limiter.check()).toBe(true);
});

test('createRateLimiter accumulates dropped count', () => {
  let now = 1_000_000;
  const limiter = createRateLimiter({ perSecond: 1, now: () => now });
  limiter.check();
  limiter.check();
  limiter.check();
  expect(limiter.droppedSinceLastReport()).toBe(2);
});

test('createRateLimiter calls onDrop after report interval', () => {
  let now = 1_000_000;
  const onDrop = jest.fn();
  const limiter = createRateLimiter({ perSecond: 1, now: () => now, onDrop });
  limiter.check();
  limiter.check();
  expect(onDrop).not.toHaveBeenCalled();
  now += 60_001;
  limiter.check();
  expect(onDrop).toHaveBeenCalledTimes(1);
  expect(onDrop).toHaveBeenCalledWith(expect.any(Number));
});

test('createRateLimiter.flushReport returns and resets dropped count', () => {
  let now = 1_000_000;
  const limiter = createRateLimiter({ perSecond: 1, now: () => now });
  limiter.check();
  limiter.check();
  limiter.check();
  expect(limiter.flushReport()).toBe(2);
  expect(limiter.droppedSinceLastReport()).toBe(0);
});
