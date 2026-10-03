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
const { default: startServer } = await import('./startServer.mjs');
const { default: syncServer } = await import('./syncServer.mjs');

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
  context.syncServer = syncServer(context);
  return context;
}

// Like createServerArtifactTracker over a set of file contents. Its baseline
// is taken when the context is made, before the initial build, so before the
// first record every artifact reads as changed.
function createTracker(files) {
  let started = {};
  return {
    record: jest.fn(() => {
      started = { ...files };
    }),
    check: jest.fn(() => {
      const changed = Object.keys(files).filter((file) => files[file] !== started[file]);
      return { install: changed.includes('package.json'), restart: changed.length > 0 };
    }),
  };
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

test('a watcher sync during the optimise waits for the first start and restarts nothing', async () => {
  const context = createContext();
  context.serverArtifacts = createTracker({ 'build/config.json': 'a', 'package.json': 'a' });
  context.restartServer = jest.fn(async () => startServer(context));

  const started = startFirstServer(context);
  await flush();
  // A late file event from the initial build: its batch syncs during the optimise.
  let synced = false;
  const sync = context.syncServer().then(() => {
    synced = true;
  });
  await flush();
  expect(synced).toBe(false);

  processes[0].emit('exit', 0);
  await Promise.all([started, sync]);

  expect(synced).toBe(true);
  expect(context.restartServer).not.toHaveBeenCalled();
  // The optimiser and one child.
  expect(mockSpawn).toHaveBeenCalledTimes(2);
  expect(mockSpawn.mock.calls[1][1]).toContain('--host');
});

test('a config edit during the optimise is rebuilt at once, and its sync resolves after the first start', async () => {
  const context = createContext();
  const files = { 'build/config.json': 'a', 'package.json': 'a' };
  context.serverArtifacts = createTracker(files);
  context.lowdefyBuild = jest.fn(async () => {
    files['build/config.json'] = 'b';
  });
  context.restartServer = jest.fn(async () => {
    context.serverArtifacts.record();
    startServer(context);
  });

  const started = startFirstServer(context);
  await flush();
  // The lowdefyBuildWatcher batch for the edit.
  let childrenAtSync;
  const batch = (async () => {
    await context.lowdefyBuild();
    await context.syncServer();
    childrenAtSync = mockSpawn.mock.calls.length;
  })();
  await flush();
  expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
  expect(childrenAtSync).toBeUndefined();

  processes[0].emit('exit', 0);
  await Promise.all([started, batch]);

  // The child may have read the edited config at spawn; one restart covers the window.
  expect(context.restartServer).toHaveBeenCalledTimes(1);
  expect(childrenAtSync).toBe(3);
});

test('a plugin package added during the optimise is installed by the queued sync', async () => {
  const context = createContext();
  const files = { 'build/config.json': 'a', 'package.json': 'a' };
  context.serverArtifacts = createTracker(files);
  const events = [];
  context.buildActivity = { track: (task) => task() };
  context.installPlugins = jest.fn(async () => events.push('install'));
  context.lowdefyBuild = jest.fn(async () => events.push('build'));
  context.restartServer = jest.fn(async () => events.push('restart'));
  let finishOptimise;
  context.optimizeDependencies = jest.fn(async () => events.push('optimise'));
  context.optimizeDependencies.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        events.push('first optimise');
        finishOptimise = resolve;
      })
  );
  context.syncServer = syncServer(context);

  const started = startFirstServer(context);
  await flush();
  // A config build during the optimise adds a plugin package to package.json.
  files['package.json'] = 'b';
  const sync = context.syncServer();
  finishOptimise();
  await Promise.all([started, sync]);

  // The first child spawns with the new package.json, but it was never
  // installed: the baseline is the one from before the optimise.
  expect(mockSpawn).toHaveBeenCalledTimes(1);
  expect(events).toEqual(['first optimise', 'install', 'build', 'optimise', 'restart']);
});
