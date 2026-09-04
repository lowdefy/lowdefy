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

const mockStartServer = jest.fn();
jest.unstable_mockModule('./startServer.mjs', () => ({
  default: mockStartServer,
}));

const { default: restartServer } = await import('./restartServer.mjs');
const { default: shutdownServer } = await import('./shutdownServer.mjs');

function createChild() {
  const child = new EventEmitter();
  child.pid = 4242;
  child.exitCode = null;
  child.signalCode = null;
  child.killed = false;
  child.kill = jest.fn(() => {
    child.killed = true;
  });
  return child;
}

function createContext() {
  const context = {
    devServer: createChild(),
    logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
  };
  context.shutdownServer = shutdownServer(context);
  context.restartServer = restartServer(context);
  // The next child, so a restart that spawns can be observed.
  mockStartServer.mockImplementation(() => {
    context.devServer = createChild();
  });
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('restartServer waits for the old child to exit before spawning the next one', async () => {
  const context = createContext();
  const child = context.devServer;

  const restarted = context.restartServer();
  await new Promise((resolve) => setTimeout(resolve, 10));

  // The child binds the internal port with --strictPort, so spawning before it
  // exits kills the new server with EADDRINUSE and nothing is serving.
  expect(child.kill).toHaveBeenCalled();
  expect(mockStartServer).not.toHaveBeenCalled();

  child.exitCode = 0;
  child.emit('exit', 0, null);
  await restarted;

  expect(mockStartServer).toHaveBeenCalledTimes(1);
});

test('two triggers firing together produce one restart', async () => {
  const context = createContext();
  const child = context.devServer;

  // A single plugin edit fires the source watcher and, after the rebuild, the
  // artifact watcher.
  const first = context.restartServer();
  const second = context.restartServer();
  expect(second).toBe(first);

  child.exitCode = 0;
  child.emit('exit', 0, null);
  await Promise.all([first, second]);

  expect(mockStartServer).toHaveBeenCalledTimes(1);
  expect(child.kill).toHaveBeenCalledTimes(1);
});

test('a trigger after the previous restart finished starts a new restart', async () => {
  const context = createContext();
  const first = context.devServer;
  const restarted = context.restartServer();
  first.exitCode = 0;
  first.emit('exit', 0, null);
  await restarted;

  const second = context.devServer;
  const again = context.restartServer();
  second.exitCode = 0;
  second.emit('exit', 0, null);
  await again;

  expect(mockStartServer).toHaveBeenCalledTimes(2);
});

test('restartServer SIGKILLs a child that ignores the shutdown signal', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  const context = createContext();
  const child = context.devServer;

  const restarted = context.restartServer();
  await Promise.resolve();
  jest.advanceTimersByTime(5000);

  expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  child.emit('exit', null, 'SIGKILL');
  jest.useRealTimers();
  await restarted;

  expect(mockStartServer).toHaveBeenCalledTimes(1);
});
