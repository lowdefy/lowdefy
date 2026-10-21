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

import { EventEmitter } from 'node:events';

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import createRequestActivity from './createRequestActivity.mjs';

beforeEach(() => {
  vi.useFakeTimers({
    now: new Date('2026-10-02T10:00:00.000Z'),
    toFake: [
      'Date',
      'hrtime',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

test('createRequestActivity writes the starting activity at once', () => {
  const onChange = vi.fn();
  createRequestActivity({ onChange });
  expect(onChange.mock.calls).toEqual([
    [{ lastActivityAt: '2026-10-02T10:00:00.000Z', activeRequests: 0 }],
  ]);
});

test('createRequestActivity counts requests in and out of flight', () => {
  const onChange = vi.fn();
  const activity = createRequestActivity({ onChange });
  vi.advanceTimersByTime(10000);
  activity.begin();
  activity.begin();
  activity.end();
  vi.advanceTimersByTime(5000);
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(1);
  activity.end();
  vi.advanceTimersByTime(5000);
  expect(onChange.mock.calls.at(-1)[0]).toEqual({
    lastActivityAt: '2026-10-02T10:00:15.000Z',
    activeRequests: 0,
  });
});

test('createRequestActivity writes a request starting on an idle record at once', () => {
  const onChange = vi.fn();
  const activity = createRequestActivity({ onChange });
  vi.advanceTimersByTime(1000);
  activity.begin();
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1][0]).toEqual({
    lastActivityAt: '2026-10-02T10:00:01.000Z',
    activeRequests: 1,
  });
});

test('createRequestActivity writes the end of the last request at once when the record is older than the throttle', () => {
  const onChange = vi.fn();
  const activity = createRequestActivity({ onChange });
  activity.begin();
  vi.advanceTimersByTime(60000);
  activity.end();
  expect(onChange.mock.calls.at(-1)[0]).toEqual({
    lastActivityAt: '2026-10-02T10:01:00.000Z',
    activeRequests: 0,
  });
});

test('createRequestActivity bounds the writes for a burst of short requests and lands the final value', () => {
  const onChange = vi.fn();
  const activity = createRequestActivity({ onChange });
  onChange.mockClear();
  for (let i = 0; i < 100; i += 1) {
    activity.begin();
    vi.advanceTimersByTime(20);
    activity.end();
    vi.advanceTimersByTime(20);
  }
  vi.advanceTimersByTime(5000);
  expect(onChange.mock.calls.length).toBeLessThanOrEqual(3);
  expect(onChange.mock.calls.at(-1)[0]).toEqual({
    lastActivityAt: new Date(Date.parse('2026-10-02T10:00:00.000Z') + 3980).toISOString(),
    activeRequests: 0,
  });
});

test('createRequestActivity touch refreshes lastActivityAt through the throttle', () => {
  const onChange = vi.fn();
  const activity = createRequestActivity({ onChange });
  vi.advanceTimersByTime(2000);
  activity.touch();
  expect(onChange).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(3000);
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1][0].lastActivityAt).toBe('2026-10-02T10:00:02.000Z');
});

test('createRequestActivity trackResponse ends a request once, on finish or close', () => {
  const onChange = vi.fn();
  const activity = createRequestActivity({ onChange });
  const res = new EventEmitter();
  activity.trackResponse(res);
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(1);
  res.emit('finish');
  res.emit('close');
  vi.advanceTimersByTime(5000);
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(0);
  activity.begin();
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(1);
});
