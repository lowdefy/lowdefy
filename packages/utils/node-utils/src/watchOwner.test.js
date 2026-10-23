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

import { EventEmitter } from 'events';
import { vi, afterEach, beforeEach, expect, test } from 'vitest';

const mockGetProcessStartTime = vi.fn();
const mockIsPidAlive = vi.fn();
const mockReadProcessStartTime = vi.fn();
vi.doMock('./getProcessStartTime.js', () => ({
  default: mockGetProcessStartTime,
}));
vi.doMock('./readProcessStartTime.js', () => ({
  default: mockReadProcessStartTime,
}));
vi.doMock('./isPidAlive.js', () => ({
  default: mockIsPidAlive,
}));

const { default: watchOwner } = await import('./watchOwner.js');

// Epoch milliseconds.
const START_TIME = 1790000000000;

// Lets the minute check's start time read resolve.
async function flushReads() {
  await Promise.resolve();
  await Promise.resolve();
}

function createStdin() {
  const stdin = new EventEmitter();
  stdin.resume = vi.fn();
  stdin.unref = vi.fn();
  return stdin;
}

let watcher;

beforeEach(() => {
  vi.useFakeTimers({
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
  mockGetProcessStartTime.mockReset();
  mockGetProcessStartTime.mockReturnValue(START_TIME);
  mockReadProcessStartTime.mockReset();
  mockReadProcessStartTime.mockResolvedValue(START_TIME);
  mockIsPidAlive.mockReset();
  mockIsPidAlive.mockReturnValue(true);
  watcher = null;
});

afterEach(() => {
  watcher?.stop();
  vi.useRealTimers();
});

test('watchOwner does nothing when neither variable is set', () => {
  const onExit = vi.fn();
  const stdin = createStdin();
  watcher = watchOwner({ onExit, env: {}, stdin });
  expect(watcher.ownerPid).toBe(null);
  expect(stdin.resume).not.toHaveBeenCalled();
  expect(stdin.listenerCount('end')).toBe(0);
  stdin.emit('end');
  vi.advanceTimersByTime(120000);
  expect(onExit).not.toHaveBeenCalled();
  expect(mockGetProcessStartTime).not.toHaveBeenCalled();
  expect(mockReadProcessStartTime).not.toHaveBeenCalled();
  expect(mockIsPidAlive).not.toHaveBeenCalled();
});

test('watchOwner calls onExit once when stdin ends under LOWDEFY_EXIT_ON_STDIN_CLOSE', () => {
  const onExit = vi.fn();
  const stdin = createStdin();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_ON_STDIN_CLOSE: '1' }, stdin });
  expect(stdin.resume).toHaveBeenCalled();
  expect(stdin.unref).toHaveBeenCalled();
  expect(onExit).not.toHaveBeenCalled();
  stdin.emit('end');
  stdin.emit('close');
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledWith({ reason: 'stdin-closed' });
});

test('watchOwner ignores stdin when LOWDEFY_EXIT_ON_STDIN_CLOSE is not 1', () => {
  const onExit = vi.fn();
  const stdin = createStdin();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_ON_STDIN_CLOSE: 'true' }, stdin });
  stdin.emit('end');
  expect(onExit).not.toHaveBeenCalled();
  expect(stdin.resume).not.toHaveBeenCalled();
});

test('watchOwner calls onExit at once when the owner is already gone', () => {
  mockIsPidAlive.mockReturnValue(false);
  mockGetProcessStartTime.mockReturnValue(null);
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
  expect(watcher.ownerPid).toBe(4242);
});

test('watchOwner calls onExit within one poll of the owner dying', () => {
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  expect(watcher.ownerStartTime).toBe(START_TIME);
  vi.advanceTimersByTime(10000);
  expect(onExit).not.toHaveBeenCalled();
  mockIsPidAlive.mockReturnValue(false);
  vi.advanceTimersByTime(2000);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
  vi.advanceTimersByTime(10000);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(mockIsPidAlive).toHaveBeenCalledWith(4242);
});

test('watchOwner catches a reused owner pid on the minute start time check', async () => {
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  mockReadProcessStartTime.mockResolvedValue(START_TIME + 5400000);
  vi.advanceTimersByTime(58000);
  await flushReads();
  expect(onExit).not.toHaveBeenCalled();
  vi.advanceTimersByTime(2000);
  await flushReads();
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
});

test('watchOwner keeps running when the minute start time check cannot read ps for a live owner', async () => {
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  mockReadProcessStartTime.mockResolvedValue(null);
  vi.advanceTimersByTime(60000);
  await flushReads();
  vi.advanceTimersByTime(60000);
  await flushReads();
  expect(mockReadProcessStartTime).toHaveBeenCalledTimes(2);
  expect(onExit).not.toHaveBeenCalled();
  mockIsPidAlive.mockReturnValue(false);
  vi.advanceTimersByTime(2000);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
});

test('watchOwner reads the owner start time at most once a minute, without blocking', async () => {
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(59000);
  expect(mockReadProcessStartTime).toHaveBeenCalledTimes(0);
  vi.advanceTimersByTime(1000);
  await flushReads();
  expect(mockReadProcessStartTime).toHaveBeenCalledTimes(1);
  expect(mockReadProcessStartTime).toHaveBeenCalledWith({ pid: 4242 });
  vi.advanceTimersByTime(60000);
  await flushReads();
  expect(mockReadProcessStartTime).toHaveBeenCalledTimes(2);
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(1);
  expect(mockIsPidAlive).toHaveBeenCalledTimes(1 + 60);
  expect(onExit).not.toHaveBeenCalled();
});

test('watchOwner starts no second start time read while one is still running', () => {
  mockReadProcessStartTime.mockReturnValue(new Promise(() => {}));
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  vi.advanceTimersByTime(180000);
  expect(mockReadProcessStartTime).toHaveBeenCalledTimes(1);
  expect(onExit).not.toHaveBeenCalled();
});

test('watchOwner ignores a start time read that finishes after stop', async () => {
  let finishRead;
  mockReadProcessStartTime.mockReturnValue(
    new Promise((resolve) => {
      finishRead = resolve;
    })
  );
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  vi.advanceTimersByTime(60000);
  watcher.stop();
  finishRead('Fri Oct  2 09:30:00 2026');
  await flushReads();
  expect(onExit).not.toHaveBeenCalled();
});

test('watchOwner relies on the pid alone when no start time can be read', () => {
  mockGetProcessStartTime.mockReturnValue(null);
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  vi.advanceTimersByTime(180000);
  expect(onExit).not.toHaveBeenCalled();
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(1);
  expect(mockReadProcessStartTime).not.toHaveBeenCalled();
  mockIsPidAlive.mockReturnValue(false);
  vi.advanceTimersByTime(2000);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
});

test('watchOwner stop clears the owner poll', () => {
  const onExit = vi.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  watcher.stop();
  mockIsPidAlive.mockReturnValue(false);
  vi.advanceTimersByTime(10000);
  expect(onExit).not.toHaveBeenCalled();
});

test('watchOwner throws when LOWDEFY_EXIT_WITH_PID is not a process id', () => {
  expect(() =>
    watchOwner({ onExit: vi.fn(), env: { LOWDEFY_EXIT_WITH_PID: 'abc' }, stdin: createStdin() })
  ).toThrow('LOWDEFY_EXIT_WITH_PID must be a process id. Received "abc".');
});

test('watchOwner fires once when stdin closes and the owner dies', () => {
  const onExit = vi.fn();
  const stdin = createStdin();
  watcher = watchOwner({
    onExit,
    env: { LOWDEFY_EXIT_ON_STDIN_CLOSE: '1', LOWDEFY_EXIT_WITH_PID: '4242' },
    stdin,
  });
  stdin.emit('end');
  mockIsPidAlive.mockReturnValue(false);
  vi.advanceTimersByTime(10000);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledWith({ reason: 'stdin-closed' });
});
