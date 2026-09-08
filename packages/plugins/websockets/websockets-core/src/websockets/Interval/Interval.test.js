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
import Interval from './Interval.js';

// Node's global performance object is not configurable, so it cannot be faked.
function useFakeTimers() {
  jest.useFakeTimers({ doNotFake: ['performance'] });
}

afterEach(() => {
  jest.useRealTimers();
});

test('Interval publishes an incrementing tick with a date every ms', async () => {
  useFakeTimers();
  const controller = new AbortController();
  const publish = jest.fn();
  const promise = Interval({ properties: { ms: 200 }, publish, signal: controller.signal });

  jest.advanceTimersByTime(200);
  expect(publish.mock.calls).toEqual([[{ data: { tick: 1, at: expect.any(Date) } }]]);

  jest.advanceTimersByTime(400);
  expect(publish.mock.calls).toEqual([
    [{ data: { tick: 1, at: expect.any(Date) } }],
    [{ data: { tick: 2, at: expect.any(Date) } }],
    [{ data: { tick: 3, at: expect.any(Date) } }],
  ]);

  controller.abort();
  await promise;
});

test('Interval defaults to 1000ms when ms is not set', async () => {
  useFakeTimers();
  const controller = new AbortController();
  const publish = jest.fn();
  const promise = Interval({ properties: {}, publish, signal: controller.signal });

  jest.advanceTimersByTime(999);
  expect(publish).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(publish).toHaveBeenCalledTimes(1);

  controller.abort();
  await promise;
});

test('Interval clamps ms below the minimum to 100ms', async () => {
  useFakeTimers();
  const controller = new AbortController();
  const publish = jest.fn();
  const promise = Interval({ properties: { ms: 10 }, publish, signal: controller.signal });

  jest.advanceTimersByTime(99);
  expect(publish).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(publish).toHaveBeenCalledTimes(1);

  controller.abort();
  await promise;
});

test('Interval throws when ms is not a number', async () => {
  const controller = new AbortController();
  const publish = jest.fn();

  await expect(
    Interval({ properties: { ms: 'fast' }, publish, signal: controller.signal })
  ).rejects.toThrow('Interval "ms" property should be a number.');
  expect(publish).not.toHaveBeenCalled();
});

test('Interval stops publishing and resolves when the signal aborts', async () => {
  useFakeTimers();
  const controller = new AbortController();
  const publish = jest.fn();
  const promise = Interval({ properties: { ms: 100 }, publish, signal: controller.signal });

  jest.advanceTimersByTime(100);
  expect(publish).toHaveBeenCalledTimes(1);

  controller.abort();
  await promise;

  jest.advanceTimersByTime(1000);
  expect(publish).toHaveBeenCalledTimes(1);
});

test('Interval returns without publishing when the signal is already aborted', async () => {
  useFakeTimers();
  const controller = new AbortController();
  controller.abort();
  const publish = jest.fn();

  await Interval({ properties: { ms: 100 }, publish, signal: controller.signal });

  jest.advanceTimersByTime(1000);
  expect(publish).not.toHaveBeenCalled();
});

test('Interval does not allow publishing', () => {
  expect(Interval.meta.publish).toBe(false);
});

test('Interval has a schema', () => {
  expect(Interval.schema).toBeDefined();
});
