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
import { EventEmitter } from 'events';

const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { get: mockGet },
}));

const mockFindAvailablePort = jest.fn();
const mockSpawnProcess = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  findAvailablePort: mockFindAvailablePort,
  spawnProcess: mockSpawnProcess,
}));

const mockGetServer = jest.fn();
const mockAddCustomPluginsAsDeps = jest.fn();
const mockEnsurePnpmWorkspaceYaml = jest.fn();
const mockInstallServer = jest.fn();
jest.unstable_mockModule('../../utils/getServer.js', () => ({ default: mockGetServer }));
jest.unstable_mockModule('../../utils/addCustomPluginsAsDeps.js', () => ({
  default: mockAddCustomPluginsAsDeps,
}));
jest.unstable_mockModule('../../utils/ensurePnpmWorkspaceYaml.js', () => ({
  default: mockEnsurePnpmWorkspaceYaml,
}));
jest.unstable_mockModule('../../utils/installServer.js', () => ({ default: mockInstallServer }));

const CHILD_PID = 4242;
const realProcessKill = process.kill;
let killedGroups;

function createChild() {
  const child = new EventEmitter();
  child.pid = CHILD_PID;
  child.exitCode = null;
  child.signalCode = null;
  child.kill = jest.fn();
  return child;
}

let context;
let child;

beforeEach(() => {
  context = {
    commandLineOptions: {},
    directories: { config: '/app', dev: '/app/.lowdefy/dev' },
    options: { port: 3000, logLevel: 'info', refResolver: undefined },
    pnpmCmd: 'pnpm',
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  };
  child = createChild();
  killedGroups = [];
  // stop() signals the child's process group (a negative pid); intercept it instead of
  // sending a real signal.
  process.kill = jest.fn((pid, signal) => {
    killedGroups.push({ pid, signal });
    child.signalCode = signal;
    setImmediate(() => child.emit('exit', null, signal));
  });
  mockFindAvailablePort.mockResolvedValue(3228);
  mockSpawnProcess.mockReturnValue(child);
});

afterEach(() => {
  process.kill = realProcessKill;
});

test('startDevServer prepares .lowdefy/test, spawns the server headless and resolves once ping answers', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockGet.mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValue({ data: {} });

  const server = await startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 1000 });

  // A run beside `lowdefy dev` must never reach for the developer's port.
  const { port: startPort } = mockFindAvailablePort.mock.calls[0][0];
  expect(startPort).toBeGreaterThanOrEqual(40000);
  expect(startPort).toBeLessThan(60000);
  expect(mockGetServer).toHaveBeenCalledWith({
    context,
    packageName: '@lowdefy/server-dev',
    directory: '/app/.lowdefy/test',
  });
  expect(mockAddCustomPluginsAsDeps).toHaveBeenCalled();
  expect(mockEnsurePnpmWorkspaceYaml).toHaveBeenCalled();
  expect(mockInstallServer).toHaveBeenCalled();

  const spawnArgs = mockSpawnProcess.mock.calls[0][0];
  expect(spawnArgs.command).toEqual('pnpm');
  expect(spawnArgs.args).toEqual(['run', 'start']);
  expect(spawnArgs.returnProcess).toBe(true);
  expect(spawnArgs.processOptions.cwd).toEqual('/app/.lowdefy/test');
  expect(spawnArgs.processOptions.detached).toBe(true);
  expect(spawnArgs.processOptions.env.LOWDEFY_SERVER_DEV_OPEN_BROWSER).toBe(false);
  expect(spawnArgs.processOptions.env.PORT).toEqual(3228);
  expect(spawnArgs.processOptions.env.LOWDEFY_DIRECTORY_CONFIG).toEqual('/app');
  // The runner's own server carries the write allowance, so an endpoint request
  // test never needs cli.agentTools.allowWriteRequests in committed config.
  expect(spawnArgs.processOptions.env.LOWDEFY_TEST_RUN).toEqual('1');

  expect(mockGet).toHaveBeenCalledWith('http://localhost:3228/api/ping', { timeout: 1000 });
  expect(server.url).toEqual('http://localhost:3228');
  expect(server.port).toEqual(3228);

  await server.stop();
  expect(killedGroups).toEqual([{ pid: -CHILD_PID, signal: 'SIGTERM' }]);
});

test('startDevServer merges an env object into the child environment', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockGet.mockResolvedValue({ data: {} });
  const server = await startDevServer({
    context,
    env: { LOWDEFY_TEST_CONNECTION_OVERRIDES: '{"controls":{"databaseUri":"mongodb://x/"}}' },
    pollIntervalMs: 1,
    bootTimeoutMs: 1000,
  });
  const env = mockSpawnProcess.mock.calls[0][0].processOptions.env;
  expect(env.LOWDEFY_TEST_CONNECTION_OVERRIDES).toEqual(
    '{"controls":{"databaseUri":"mongodb://x/"}}'
  );
  expect(env.PORT).toEqual(3228);
  await server.stop();
});

test('startDevServer throws with the last captured output lines when ping never answers', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockGet.mockRejectedValue(new Error('ECONNREFUSED'));
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
  expect(error.message).toEqual('Development server did not answer GET /api/ping within 20ms.');
  expect(error.serverOutput).toHaveLength(40);
  expect(error.serverOutput[0]).toEqual('line 5');
  expect(error.serverOutput[39]).toEqual('line 44');
  expect(killedGroups).toEqual([{ pid: -CHILD_PID, signal: 'SIGTERM' }]);
});

test('startDevServer throws when the server process exits before it is ready', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockGet.mockRejectedValue(new Error('ECONNREFUSED'));
  mockSpawnProcess.mockImplementation(({ stdOutLineHandler }) => {
    stdOutLineHandler('Build failed with 1 error.');
    child.exitCode = 1;
    return child;
  });

  await expect(startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 1000 })).rejects.toThrow(
    'Development server exited with code 1 before it was ready.'
  );
});

test('startDevServer starts port discovery at --port when one was given', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockGet.mockResolvedValue({ data: {} });
  context.commandLineOptions = { port: '3111' };
  const server = await startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 1000 });
  expect(mockFindAvailablePort).toHaveBeenCalledWith({ port: 3111 });
  await server.stop();
});

test('startDevServer uses --dev-directory when the caller named one', async () => {
  const { default: startDevServer } = await import('./startDevServer.js');
  mockGet.mockResolvedValue({ data: {} });
  context.commandLineOptions = { devDirectory: '/app/.lowdefy/dev' };
  const server = await startDevServer({ context, pollIntervalMs: 1, bootTimeoutMs: 1000 });
  expect(mockSpawnProcess.mock.calls[0][0].processOptions.cwd).toEqual('/app/.lowdefy/dev');
  await server.stop();
});
