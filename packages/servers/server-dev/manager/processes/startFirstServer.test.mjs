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

const mockSpawn = jest.fn();
const { spawnSync, execSync, exec, execFile, fork } = await import('child_process');
jest.unstable_mockModule('child_process', () => ({
  spawn: mockSpawn,
  spawnSync,
  execSync,
  exec,
  execFile,
  fork,
}));
jest.unstable_mockModule('../utils/readBasePath.mjs', () => ({ default: () => '' }));

const { default: optimizeDependencies } = await import('./optimizeDependencies.mjs');
const { default: startFirstServer } = await import('./startFirstServer.mjs');

function createProcess() {
  return Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
}

function createContext() {
  const context = {
    bin: { vite: '/server/node_modules/vite/bin/vite.js' },
    directories: { config: '/apps/tenant', server: '/server' },
    instance: { update: jest.fn() },
    internalPort: 3211,
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    mailSink: null,
    options: { port: 3210 },
    serverArtifacts: { record: jest.fn() },
    shutdownServer: jest.fn(),
  };
  context.optimizeDependencies = optimizeDependencies(context);
  return context;
}

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
}

let processes;

beforeEach(() => {
  processes = [];
  mockSpawn.mockImplementation(() => {
    const child = createProcess();
    processes.push(child);
    return child;
  });
});

test('startFirstServer runs the optimiser and waits for it to exit before it spawns the child', async () => {
  const context = createContext();

  const started = startFirstServer(context);
  await flush();

  expect(mockSpawn).toHaveBeenCalledTimes(1);
  expect(mockSpawn.mock.calls[0][0]).toBe('node');
  expect(mockSpawn.mock.calls[0][1]).toEqual(['/server/node_modules/vite/bin/vite.js', 'optimize']);
  expect(mockSpawn.mock.calls[0][2].cwd).toBe('/server');

  processes[0].emit('exit', 0);
  await started;

  expect(mockSpawn).toHaveBeenCalledTimes(2);
  expect(mockSpawn.mock.calls[1][1].slice(0, 3)).toEqual([
    '--expose-gc',
    '/server/node_modules/vite/bin/vite.js',
    '--host',
  ]);
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('startFirstServer still starts the child when the optimiser fails, and warns', async () => {
  const context = createContext();

  const started = startFirstServer(context);
  await flush();
  processes[0].stderr.emit('data', Buffer.from('error when optimizing deps:\nboom\n'));
  processes[0].stderr.emit('end');
  processes[0].emit('exit', 1);
  await started;

  expect(mockSpawn).toHaveBeenCalledTimes(2);
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][0]).toContain('boom');
});

test('the optimiser resolves the same environment as the child, apart from the browser tag', async () => {
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  try {
    const context = createContext();
    context.mailSink = {};

    const started = startFirstServer(context);
    await flush();
    processes[0].emit('exit', 0);
    await started;

    const optimiserEnv = mockSpawn.mock.calls[0][2].env;
    const { LOWDEFY_BROWSER_TAG, ...childEnv } = mockSpawn.mock.calls[1][2].env;
    expect(LOWDEFY_BROWSER_TAG).toBeDefined();
    expect(optimiserEnv).toEqual(childEnv);
    expect(optimiserEnv.BETTER_AUTH_URL).toBe('http://localhost:3210');
    expect(optimiserEnv.LOWDEFY_SERVER_DEV_MAIL_SINK).toBe('true');
    expect(optimiserEnv.LOWDEFY_DIRECTORY_CONFIG).toBe('/apps/tenant');
  } finally {
    delete process.env.BETTER_AUTH_URL;
  }
});
