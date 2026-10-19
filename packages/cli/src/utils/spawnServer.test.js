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
import path from 'path';
import { jest } from '@jest/globals';

const mockSpawnProcess = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  spawnProcess: mockSpawnProcess,
}));

const { default: spawnServer } = await import('./spawnServer.js');

const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'];
const savedHome = process.env.LOWDEFY_HOME;
let child;
let listenerCounts;

beforeEach(() => {
  process.env.LOWDEFY_HOME = '/tmp/lowdefy-home';
  child = new EventEmitter();
  child.kill = jest.fn();
  mockSpawnProcess.mockReset();
  mockSpawnProcess.mockReturnValue(child);
  listenerCounts = Object.fromEntries(SIGNALS.map((s) => [s, process.listenerCount(s)]));
});

afterEach(() => {
  if (savedHome === undefined) {
    delete process.env.LOWDEFY_HOME;
  } else {
    process.env.LOWDEFY_HOME = savedHome;
  }
});

test('spawnServer starts the entry with node itself, holding its stdin, with the registry directory', async () => {
  const promise = spawnServer({
    directory: '/app/.lowdefy/server',
    entry: 'src/index.js',
    env: { PORT: 3112 },
    stdOutLineHandler: jest.fn(),
  });
  const { command, args, returnProcess, processOptions } = mockSpawnProcess.mock.calls[0][0];
  expect(command).toEqual(process.execPath);
  expect(args).toEqual(['src/index.js']);
  expect(returnProcess).toBe(true);
  expect(processOptions.cwd).toEqual('/app/.lowdefy/server');
  expect(processOptions.shell).toBeUndefined();
  expect(processOptions.detached).toBe(false);
  expect(processOptions.stdio).toEqual(['pipe', 'pipe', 'pipe']);
  expect(processOptions.env).toEqual({
    PORT: 3112,
    LOWDEFY_EXIT_ON_STDIN_CLOSE: '1',
    LOWDEFY_SERVER_REGISTRY_DIR: path.join('/tmp/lowdefy-home', 'servers'),
  });
  child.emit('exit', 0, null);
  await expect(promise).resolves.toBeUndefined();
});

test('spawnServer forwards SIGINT, SIGTERM and SIGHUP to the server until it exits', async () => {
  const promise = spawnServer({
    directory: '/app',
    entry: 'src/index.js',
    env: {},
    stdOutLineHandler: jest.fn(),
  });
  SIGNALS.forEach((signal) => {
    expect(process.listenerCount(signal)).toBe(listenerCounts[signal] + 1);
  });
  process.listeners('SIGTERM').at(-1)('SIGTERM');
  process.listeners('SIGHUP').at(-1)('SIGHUP');
  expect(child.kill.mock.calls).toEqual([['SIGTERM'], ['SIGHUP']]);
  child.emit('exit', 0, null);
  await promise;
  SIGNALS.forEach((signal) => {
    expect(process.listenerCount(signal)).toBe(listenerCounts[signal]);
  });
});

test('spawnServer rejects with the exit code when the server fails', async () => {
  const promise = spawnServer({
    directory: '/app',
    entry: 'src/index.js',
    env: {},
    stdOutLineHandler: jest.fn(),
  });
  child.emit('exit', 1, null);
  await expect(promise).rejects.toThrow('Server exited with code 1.');
});

test('spawnServer returns the child, forwarding nothing, with returnProcess', () => {
  const result = spawnServer({
    directory: '/app',
    entry: 'manager/run.mjs',
    env: {},
    detached: true,
    returnProcess: true,
    stdOutLineHandler: jest.fn(),
  });
  expect(result).toBe(child);
  expect(mockSpawnProcess.mock.calls[0][0].processOptions.detached).toBe(true);
  SIGNALS.forEach((signal) => {
    expect(process.listenerCount(signal)).toBe(listenerCounts[signal]);
  });
});
