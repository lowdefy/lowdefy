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
import fs from 'fs';
import os from 'os';
import path from 'path';

const mockReadDevInstance = jest.fn();
const mockSpawnProcess = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  readDevInstance: mockReadDevInstance,
  spawnProcess: mockSpawnProcess,
}));
const mockLineHandler = jest.fn();
jest.unstable_mockModule('@lowdefy/logger/cli', () => ({
  createStdOutLineHandler: () => mockLineHandler,
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

const { default: pull } = await import('./pull.js');

let configDirectory;
let context;
const originalExitCode = process.exitCode;

function spawnChildExiting(code) {
  mockSpawnProcess.mockImplementation(() => {
    const child = new EventEmitter();
    setImmediate(() => child.emit('exit', code));
    return child;
  });
}

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-pull-'));
  const dev = path.join(configDirectory, '.lowdefy', 'dev');
  fs.mkdirSync(path.join(dev, 'lib', 'data'), { recursive: true });
  fs.writeFileSync(path.join(dev, 'lib', 'data', 'pullDataSet.mjs'), '');
  context = {
    directories: { config: configDirectory, dev },
    options: { logLevel: 'info', refResolver: undefined },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    sendTelemetry: jest.fn(),
  };
  mockReadDevInstance.mockReturnValue(null);
});

afterEach(() => {
  delete process.env.LOWDEFY_TEST_SENTINEL;
  process.exitCode = originalExitCode;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('data pull spawns the pull script with the shell environment and LOWDEFY_DIRECTORY_CONFIG', async () => {
  process.env.LOWDEFY_TEST_SENTINEL = 'from-the-shell';
  spawnChildExiting(0);
  await pull({ context, name: 'staging-sample' });
  expect(mockSpawnProcess).toHaveBeenCalledTimes(1);
  const [{ command, args, processOptions, returnProcess }] = mockSpawnProcess.mock.calls[0];
  expect(command).toEqual(process.execPath);
  expect(args).toEqual([
    path.join(context.directories.dev, 'lib', 'data', 'pullDataSet.mjs'),
    'staging-sample',
  ]);
  expect(returnProcess).toBe(true);
  expect(processOptions.cwd).toEqual(context.directories.dev);
  expect(processOptions.env.LOWDEFY_TEST_SENTINEL).toEqual('from-the-shell');
  expect(processOptions.env.LOWDEFY_DIRECTORY_CONFIG).toEqual(configDirectory);
  expect(process.exitCode).toEqual(0);
});

test("data pull exits with the pull script's code", async () => {
  spawnChildExiting(1);
  await pull({ context, name: 'staging-sample' });
  expect(process.exitCode).toEqual(1);
});

test('data pull installs .lowdefy/dev first when no dev server is running', async () => {
  spawnChildExiting(0);
  await pull({ context, name: 'staging-sample' });
  expect(mockGetServer).toHaveBeenCalledWith({
    context,
    packageName: '@lowdefy/server-dev',
    directory: context.directories.dev,
  });
  expect(mockInstallServer).toHaveBeenCalledWith({ context, directory: context.directories.dev });
  expect(mockInstallServer.mock.invocationCallOrder[0]).toBeLessThan(
    mockSpawnProcess.mock.invocationCallOrder[0]
  );
});

test("data pull uses a running dev server's installation without reinstalling", async () => {
  mockReadDevInstance.mockReturnValue({ pid: 1, state: 'ready', url: 'http://localhost:3228' });
  spawnChildExiting(0);
  await pull({ context, name: 'staging-sample' });
  expect(mockGetServer).not.toHaveBeenCalled();
  expect(mockInstallServer).not.toHaveBeenCalled();
  expect(mockSpawnProcess).toHaveBeenCalledTimes(1);
});

test('data pull fails when the installed dev server has no pull script', async () => {
  fs.rmSync(path.join(context.directories.dev, 'lib'), { recursive: true });
  mockReadDevInstance.mockReturnValue({ pid: 1, state: 'ready' });
  await expect(pull({ context, name: 'staging-sample' })).rejects.toThrow(
    'has no data pull script'
  );
  expect(mockSpawnProcess).not.toHaveBeenCalled();
});
