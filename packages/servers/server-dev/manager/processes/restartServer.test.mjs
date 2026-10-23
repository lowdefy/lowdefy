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

const events = [];

vi.doMock('./startServer.mjs', () => ({
  default: vi.fn((context) => {
    events.push('start');
    context.devServer = createChild();
  }),
}));
vi.doMock('../utils/waitForServer.mjs', () => ({
  default: vi.fn(async () => true),
}));

function createChild() {
  return Object.assign(new EventEmitter(), {
    exitCode: null,
    signalCode: null,
    killed: false,
    pid: 1234,
    kill: vi.fn(),
  });
}

async function createContext({ devServer = null } = {}) {
  const { default: shutdownServer } = await import('./shutdownServer.mjs');
  const context = {
    buildActivity: { track: (fn) => fn() },
    devServer,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
    markServerReady: vi.fn(),
    serverArtifacts: { record: vi.fn() },
  };
  context.shutdownServer = shutdownServer(context);
  return context;
}

beforeEach(() => {
  events.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

async function flush() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

async function advance(ms) {
  await flush();
  vi.advanceTimersByTime(ms);
  await flush();
}

test('restartServer starts the new child only after the old child exits', async () => {
  const { default: restartServer } = await import('./restartServer.mjs');
  const oldChild = createChild();
  const context = await createContext({ devServer: oldChild });

  const restarting = restartServer(context)();
  await flush();
  expect(oldChild.kill).toHaveBeenCalledTimes(1);
  expect(events).toEqual([]);

  oldChild.signalCode = 'SIGTERM';
  oldChild.emit('exit', null, 'SIGTERM');
  await restarting;

  expect(events).toEqual(['start']);
  expect(context.devServer).not.toBe(oldChild);
  expect(context.stoppedDevServer).toBe(null);
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('restartServer SIGKILLs an old child that ignores SIGTERM, then starts the new child', async () => {
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
  const { default: restartServer } = await import('./restartServer.mjs');
  const oldChild = createChild();
  oldChild.kill.mockImplementation((signal) => {
    if (signal === 'SIGKILL') {
      oldChild.signalCode = 'SIGKILL';
      oldChild.emit('exit', null, 'SIGKILL');
    }
  });
  const context = await createContext({ devServer: oldChild });

  const restarting = restartServer(context)();
  await flush();
  expect(events).toEqual([]);
  await advance(10000);
  await restarting;

  expect(oldChild.kill).toHaveBeenCalledWith('SIGKILL');
  expect(events).toEqual(['start']);
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('restartServer finishes after both timeouts and warns when the old child never exits', async () => {
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
  const { default: restartServer } = await import('./restartServer.mjs');
  const oldChild = createChild();
  const context = await createContext({ devServer: oldChild });

  const restarting = restartServer(context)();
  await advance(10000);
  expect(events).toEqual([]);
  await advance(5000);
  await restarting;

  expect(oldChild.kill).toHaveBeenCalledWith('SIGKILL');
  expect(events).toEqual(['start']);
  expect(context.logger.warn).toHaveBeenCalledWith(expect.stringContaining('did not exit'));
});

test('restartServer waits for a child that syncServer shut down before installing', async () => {
  const { default: restartServer } = await import('./restartServer.mjs');
  const oldChild = createChild();
  const context = await createContext({ devServer: oldChild });
  context.shutdownServer();
  expect(context.devServer).toBe(null);

  const restarting = restartServer(context)();
  await flush();
  expect(events).toEqual([]);
  oldChild.exitCode = 0;
  oldChild.emit('exit', 0, null);
  await restarting;

  expect(events).toEqual(['start']);
});

test('restartServer with no previous child starts at once', async () => {
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
  const { default: restartServer } = await import('./restartServer.mjs');
  const context = await createContext();

  await restartServer(context)();

  expect(events).toEqual(['start']);
  expect(vi.getTimerCount()).toBe(0);
});
