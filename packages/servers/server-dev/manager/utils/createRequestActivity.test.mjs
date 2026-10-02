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

import { jest } from '@jest/globals';

import createRequestActivity from './createRequestActivity.mjs';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-10-02T10:00:00.000Z'), doNotFake: ['performance'] });
});

afterEach(() => {
  jest.useRealTimers();
});

test('createRequestActivity writes the starting activity at once', () => {
  const onChange = jest.fn();
  createRequestActivity({ onChange });
  expect(onChange.mock.calls).toEqual([
    [{ lastActivityAt: '2026-10-02T10:00:00.000Z', activeRequests: 0 }],
  ]);
});

test('createRequestActivity counts requests in and out of flight', () => {
  const onChange = jest.fn();
  const activity = createRequestActivity({ onChange });
  jest.advanceTimersByTime(10000);
  activity.begin();
  activity.begin();
  activity.end();
  jest.advanceTimersByTime(5000);
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(1);
  activity.end();
  jest.advanceTimersByTime(5000);
  expect(onChange.mock.calls.at(-1)[0]).toEqual({
    lastActivityAt: '2026-10-02T10:00:15.000Z',
    activeRequests: 0,
  });
});

test('createRequestActivity writes a request starting on an idle record at once', () => {
  const onChange = jest.fn();
  const activity = createRequestActivity({ onChange });
  jest.advanceTimersByTime(1000);
  activity.begin();
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1][0]).toEqual({
    lastActivityAt: '2026-10-02T10:00:01.000Z',
    activeRequests: 1,
  });
});

test('createRequestActivity writes the end of the last request at once when the record is older than the throttle', () => {
  const onChange = jest.fn();
  const activity = createRequestActivity({ onChange });
  activity.begin();
  jest.advanceTimersByTime(60000);
  activity.end();
  expect(onChange.mock.calls.at(-1)[0]).toEqual({
    lastActivityAt: '2026-10-02T10:01:00.000Z',
    activeRequests: 0,
  });
});

test('createRequestActivity bounds the writes for a burst of short requests and lands the final value', () => {
  const onChange = jest.fn();
  const activity = createRequestActivity({ onChange });
  onChange.mockClear();
  for (let i = 0; i < 100; i += 1) {
    activity.begin();
    jest.advanceTimersByTime(20);
    activity.end();
    jest.advanceTimersByTime(20);
  }
  jest.advanceTimersByTime(5000);
  expect(onChange.mock.calls.length).toBeLessThanOrEqual(3);
  expect(onChange.mock.calls.at(-1)[0]).toEqual({
    lastActivityAt: new Date(Date.parse('2026-10-02T10:00:00.000Z') + 3980).toISOString(),
    activeRequests: 0,
  });
});

test('createRequestActivity touch refreshes lastActivityAt through the throttle', () => {
  const onChange = jest.fn();
  const activity = createRequestActivity({ onChange });
  jest.advanceTimersByTime(2000);
  activity.touch();
  expect(onChange).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(3000);
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1][0].lastActivityAt).toBe('2026-10-02T10:00:02.000Z');
});

test('createRequestActivity trackResponse ends a request once, on finish or close', () => {
  const onChange = jest.fn();
  const activity = createRequestActivity({ onChange });
  const res = new EventEmitter();
  activity.trackResponse(res);
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(1);
  res.emit('finish');
  res.emit('close');
  jest.advanceTimersByTime(5000);
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(0);
  activity.begin();
  expect(onChange.mock.calls.at(-1)[0].activeRequests).toBe(1);
});
