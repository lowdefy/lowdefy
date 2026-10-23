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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';
import { EventEmitter } from 'events';

const mockFindAvailablePort = vi.fn();
const mockReadDevInstance = vi.fn();
const mockSpawnProcess = vi.fn();
vi.doMock('@lowdefy/node-utils', () => ({
  findAvailablePort: mockFindAvailablePort,
  readDevInstance: mockReadDevInstance,
  spawnProcess: mockSpawnProcess,
}));

const mockGetServer = vi.fn();
const mockAddCustomPluginsAsDeps = vi.fn();
const mockEnsurePnpmWorkspaceYaml = vi.fn();
const mockInstallServer = vi.fn();
vi.doMock('../../utils/getServer.js', () => ({ default: mockGetServer }));
vi.doMock('../../utils/addCustomPluginsAsDeps.js', () => ({
  default: mockAddCustomPluginsAsDeps,
}));
vi.doMock('../../utils/ensurePnpmWorkspaceYaml.js', () => ({
  default: mockEnsurePnpmWorkspaceYaml,
}));
vi.doMock('../../utils/installServer.js', () => ({ default: mockInstallServer }));

const mockStopSampler = vi.fn();
const mockSampleServerResources = vi.fn();
vi.doMock('./sampleServerResources.js', () => ({ default: mockSampleServerResources }));

const CHILD_PID = 4242;
const isWindows = process.platform === 'win32';
const realProcessKill = process.kill;
let killedGroups;

function exitOnSignal(child, signal) {
  child.signalCode = signal;
  setImmediate(() => child.emit('exit', null, signal));
}

function createChild() {
  const child = new EventEmitter();
  child.pid = CHILD_PID;
  child.exitCode = null;
  child.signalCode = null;
  child.kill = vi.fn((signal) => exitOnSignal(child, signal));
  return child;
}

// Windows has no process groups: there the server is not detached and stop()
// signals the child itself. Elsewhere stop() signals the child's group.
function expectStoppedOnce() {
  if (isWindows) {
    expect(child.kill.mock.calls).toEqual([['SIGTERM']]);
    expect(killedGroups).toEqual([]);
    return;
  }
  expect(killedGroups).toEqual([{ pid: -CHILD_PID, signal: 'SIGTERM' }]);
  expect(child.kill).not.toHaveBeenCalled();
}

let context;
let child;

beforeEach(() => {
  context = {
    directories: { config: '/app', dev: '/app/.lowdefy/dev' },
    options: { port: 3000, logLevel: 'info', refResolver: undefined },
    pnpmCmd: 'pnpm',
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  };
  child = createChild();
  killedGroups = [];
  // stop() signals the child's process group (a negative pid); intercept it instead of
  // sending a real signal.
  process.kill = vi.fn((pid, signal) => {
    killedGroups.push({ pid, signal });
    exitOnSignal(child, signal);
  });
  mockFindAvailablePort.mockResolvedValue(3228);
  mockSpawnProcess.mockReturnValue(child);
  mockStopSampler.mockReset();
  mockStopSampler.mockResolvedValue(null);
  mockSampleServerResources.mockReturnValue({ stop: mockStopSampler });
});

afterEach(() => {
  process.kill = realProcessKill;
});

test('startDevServer prepares .lowdefy/dev, spawns the server headless and resolves once its instance record is ready', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockReadDevInstance
    .mockReturnValueOnce(null)
    .mockReturnValueOnce({ state: 'starting', port: 3228 })
    .mockReturnValue({ state: 'ready', port: 3228, url: 'http://localhost:3228' });

  const server = await startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 1000 });

  expect(mockFindAvailablePort).toHaveBeenCalledWith({ port: 3000 });
  expect(mockGetServer).toHaveBeenCalledWith({
    context,
    packageName: '@lowdefy/server-dev',
    directory: '/app/.lowdefy/dev',
  });
  expect(mockAddCustomPluginsAsDeps).toHaveBeenCalled();
  expect(mockEnsurePnpmWorkspaceYaml).toHaveBeenCalled();
  expect(mockInstallServer).toHaveBeenCalled();

  const spawnArgs = mockSpawnProcess.mock.calls[0][0];
  expect(spawnArgs.command).toEqual(process.execPath);
  expect(spawnArgs.args).toEqual(['manager/run.mjs']);
  expect(spawnArgs.returnProcess).toBe(true);
  expect(spawnArgs.processOptions.cwd).toEqual('/app/.lowdefy/dev');
  expect(spawnArgs.processOptions.detached).toBe(!isWindows);
  expect(spawnArgs.processOptions.stdio).toEqual(['pipe', 'pipe', 'pipe']);
  expect(spawnArgs.processOptions.env.LOWDEFY_EXIT_WITH_PID).toEqual(String(process.pid));
  expect(spawnArgs.processOptions.env.LOWDEFY_EXIT_ON_STDIN_CLOSE).toEqual('1');
  expect(spawnArgs.processOptions.env.LOWDEFY_SERVER_DEV_OPEN_BROWSER).toBe(false);
  expect(spawnArgs.processOptions.env.PORT).toEqual(3228);
  expect(spawnArgs.processOptions.env.LOWDEFY_DIRECTORY_CONFIG).toEqual('/app');

  expect(mockReadDevInstance).toHaveBeenCalledWith({ configDirectory: '/app' });
  expect(mockReadDevInstance).toHaveBeenCalledTimes(3);
  expect(server.url).toEqual('http://localhost:3228');
  expect(server.port).toEqual(3228);

  await server.stop();
  expectStoppedOnce();
});

test('startDevServer resolves with the basePath url the dev server records', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockReadDevInstance.mockReturnValue({
    state: 'ready',
    port: 3228,
    url: 'http://localhost:3228/app',
  });

  const server = await startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 1000 });

  expect(server.url).toEqual('http://localhost:3228/app');
  await server.stop();
});

test('startDevServer throws with the last captured output lines when the server never becomes ready', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockReadDevInstance.mockReturnValue({ state: 'starting', port: 3228 });
  mockSpawnProcess.mockImplementation(({ stdOutLineHandler }) => {
    for (let i = 0; i < 45; i += 1) {
      stdOutLineHandler(`line ${i}`);
    }
    return child;
  });

  let error;
  try {
    await startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 20 });
  } catch (e) {
    error = e;
  }
  expect(error.message).toEqual('Development server was not ready within 20ms.');
  expect(error.serverOutput).toHaveLength(40);
  expect(error.serverOutput[0]).toEqual('line 5');
  expect(error.serverOutput[39]).toEqual('line 44');
  expectStoppedOnce();
});

test('startDevServer throws when the server process exits before it is ready', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockReadDevInstance.mockReturnValue(null);
  mockSpawnProcess.mockImplementation(({ stdOutLineHandler }) => {
    stdOutLineHandler('Build failed with 1 error.');
    child.exitCode = 1;
    return child;
  });

  await expect(startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 1000 })).rejects.toThrow(
    'Development server exited with code 1 before it was ready.'
  );
});

test('startDevServer samples the server from its spawn and ends stop() with the resource line', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockReadDevInstance.mockReturnValue({ state: 'ready', url: 'http://localhost:3228' });
  mockStopSampler.mockImplementation(async () => {
    // The last sample is taken before the server is signalled.
    expect(child.signalCode).toBeNull();
    return { peakBytes: 0.71 * 1024 ** 3, cpuSeconds: 94.4 };
  });
  const server = await startDevServer({ context, pollIntervalMs: 1 });
  expect(mockSampleServerResources).toHaveBeenCalledWith({ pid: CHILD_PID });
  await server.stop();
  expect(mockStopSampler).toHaveBeenCalledTimes(1);
  expectStoppedOnce();
  expect(context.logger.info).toHaveBeenLastCalledWith(
    'Resources (approximate): server peak 0.71 GB, CPU 94 s, including data store and browsers.'
  );
});

test('startDevServer logs no resource line when nothing was measured', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockReadDevInstance.mockReturnValue({ state: 'ready', url: 'http://localhost:3228' });
  const server = await startDevServer({ context, pollIntervalMs: 1 });
  await server.stop();
  expect(context.logger.info.mock.calls.flat().some((line) => line.startsWith('Resources'))).toBe(
    false
  );
});

test('startDevServer stops the sampler when the server never becomes ready', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockReadDevInstance.mockReturnValue(null);
  await expect(startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 20 })).rejects.toThrow(
    'Development server was not ready within 20ms.'
  );
  expect(mockStopSampler).toHaveBeenCalledTimes(1);
});
