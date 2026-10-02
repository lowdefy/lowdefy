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
import { jest } from '@jest/globals';

const mockGetProcessStartTime = jest.fn();
const mockIsPidAlive = jest.fn();
jest.unstable_mockModule('./getProcessStartTime.js', () => ({
  default: mockGetProcessStartTime,
}));
jest.unstable_mockModule('./isPidAlive.js', () => ({
  default: mockIsPidAlive,
}));

const { default: watchOwner } = await import('./watchOwner.js');

const START_TIME = 'Fri Oct  2 08:00:00 2026';

function createStdin() {
  const stdin = new EventEmitter();
  stdin.resume = jest.fn();
  stdin.unref = jest.fn();
  return stdin;
}

let watcher;

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  mockGetProcessStartTime.mockReset();
  mockGetProcessStartTime.mockReturnValue(START_TIME);
  mockIsPidAlive.mockReset();
  mockIsPidAlive.mockReturnValue(true);
  watcher = null;
});

afterEach(() => {
  watcher?.stop();
  jest.useRealTimers();
});

test('watchOwner does nothing when neither variable is set', () => {
  const onExit = jest.fn();
  const stdin = createStdin();
  watcher = watchOwner({ onExit, env: {}, stdin });
  expect(watcher.ownerPid).toBe(null);
  expect(stdin.resume).not.toHaveBeenCalled();
  expect(stdin.listenerCount('end')).toBe(0);
  stdin.emit('end');
  jest.advanceTimersByTime(120000);
  expect(onExit).not.toHaveBeenCalled();
  expect(mockGetProcessStartTime).not.toHaveBeenCalled();
  expect(mockIsPidAlive).not.toHaveBeenCalled();
});

test('watchOwner calls onExit once when stdin ends under LOWDEFY_EXIT_ON_STDIN_CLOSE', () => {
  const onExit = jest.fn();
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
  const onExit = jest.fn();
  const stdin = createStdin();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_ON_STDIN_CLOSE: 'true' }, stdin });
  stdin.emit('end');
  expect(onExit).not.toHaveBeenCalled();
  expect(stdin.resume).not.toHaveBeenCalled();
});

test('watchOwner calls onExit at once when the owner is already gone', () => {
  mockIsPidAlive.mockReturnValue(false);
  mockGetProcessStartTime.mockReturnValue(null);
  const onExit = jest.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
  expect(watcher.ownerPid).toBe(4242);
});

test('watchOwner calls onExit within one poll of the owner dying', () => {
  const onExit = jest.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  expect(watcher.ownerStartTime).toBe(START_TIME);
  jest.advanceTimersByTime(10000);
  expect(onExit).not.toHaveBeenCalled();
  mockIsPidAlive.mockReturnValue(false);
  jest.advanceTimersByTime(2000);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
  jest.advanceTimersByTime(10000);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(mockIsPidAlive).toHaveBeenCalledWith(4242);
});

test('watchOwner catches a reused owner pid on the minute start time check', () => {
  const onExit = jest.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  mockGetProcessStartTime.mockReturnValue('Fri Oct  2 09:30:00 2026');
  jest.advanceTimersByTime(58000);
  expect(onExit).not.toHaveBeenCalled();
  jest.advanceTimersByTime(2000);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
});

test('watchOwner keeps running when the minute start time check cannot read ps for a live owner', () => {
  const onExit = jest.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  mockGetProcessStartTime.mockReturnValue(null);
  jest.advanceTimersByTime(120000);
  expect(onExit).not.toHaveBeenCalled();
  mockIsPidAlive.mockReturnValue(false);
  jest.advanceTimersByTime(2000);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
});

test('watchOwner reads the owner start time at most once a minute', () => {
  const onExit = jest.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(59000);
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1000);
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(60000);
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(3);
  expect(mockIsPidAlive).toHaveBeenCalledTimes(1 + 60);
  expect(onExit).not.toHaveBeenCalled();
});

test('watchOwner relies on the pid alone when no start time can be read', () => {
  mockGetProcessStartTime.mockReturnValue(null);
  const onExit = jest.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  jest.advanceTimersByTime(180000);
  expect(onExit).not.toHaveBeenCalled();
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(1);
  mockIsPidAlive.mockReturnValue(false);
  jest.advanceTimersByTime(2000);
  expect(onExit).toHaveBeenCalledWith({ reason: 'owner-gone' });
});

test('watchOwner stop clears the owner poll', () => {
  const onExit = jest.fn();
  watcher = watchOwner({ onExit, env: { LOWDEFY_EXIT_WITH_PID: '4242' }, stdin: createStdin() });
  watcher.stop();
  mockIsPidAlive.mockReturnValue(false);
  jest.advanceTimersByTime(10000);
  expect(onExit).not.toHaveBeenCalled();
});

test('watchOwner throws when LOWDEFY_EXIT_WITH_PID is not a process id', () => {
  expect(() =>
    watchOwner({ onExit: jest.fn(), env: { LOWDEFY_EXIT_WITH_PID: 'abc' }, stdin: createStdin() })
  ).toThrow('LOWDEFY_EXIT_WITH_PID must be a process id. Received "abc".');
});

test('watchOwner fires once when stdin closes and the owner dies', () => {
  const onExit = jest.fn();
  const stdin = createStdin();
  watcher = watchOwner({
    onExit,
    env: { LOWDEFY_EXIT_ON_STDIN_CLOSE: '1', LOWDEFY_EXIT_WITH_PID: '4242' },
    stdin,
  });
  stdin.emit('end');
  mockIsPidAlive.mockReturnValue(false);
  jest.advanceTimersByTime(10000);
  expect(onExit).toHaveBeenCalledTimes(1);
  expect(onExit).toHaveBeenCalledWith({ reason: 'stdin-closed' });
});
