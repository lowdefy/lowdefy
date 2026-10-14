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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

const calls = [];
const record = (name, impl) =>
  jest.fn(async (...args) => {
    calls.push(name);
    if (impl) await impl(...args);
  });

const mockGetServer = record('getServer');
const mockResetServerPackageJson = record('resetServerPackageJson');
const mockAddCustomPluginsAsDeps = record('addCustomPluginsAsDeps');
const mockEnsurePnpmWorkspaceYaml = record('ensurePnpmWorkspaceYaml');
const mockInstallServer = record('installServer');
const mockRunLowdefyBuild = jest.fn();
const mockRunClientBuild = record('runClientBuild');

jest.unstable_mockModule('../../utils/getServer.js', () => ({ default: mockGetServer }));
jest.unstable_mockModule('../../utils/resetServerPackageJson.js', () => ({
  default: mockResetServerPackageJson,
}));
jest.unstable_mockModule('../../utils/addCustomPluginsAsDeps.js', () => ({
  default: mockAddCustomPluginsAsDeps,
}));
jest.unstable_mockModule('../../utils/ensurePnpmWorkspaceYaml.js', () => ({
  default: mockEnsurePnpmWorkspaceYaml,
}));
jest.unstable_mockModule('../../utils/installServer.js', () => ({ default: mockInstallServer }));
jest.unstable_mockModule('../../utils/runLowdefyBuild.js', () => ({
  default: mockRunLowdefyBuild,
}));
jest.unstable_mockModule('../../utils/runClientBuild.js', () => ({ default: mockRunClientBuild }));

const { default: build } = await import('./build.js');

let serverDirectory;

function pendingPath() {
  return path.join(serverDirectory, 'build', 'plugin-checks-pending.json');
}

function writePending() {
  fs.mkdirSync(path.join(serverDirectory, 'build'), { recursive: true });
  fs.writeFileSync(pendingPath(), JSON.stringify({ packages: ['@acme/plugin'] }));
}

function createContext() {
  return {
    directories: { server: serverDirectory },
    logger: { info: jest.fn() },
    options: {},
    sendTelemetry: jest.fn(),
  };
}

beforeEach(() => {
  calls.length = 0;
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-cli-build-'));
});

afterEach(() => {
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

test('build runs the Lowdefy build once when no plugin checks are pending', async () => {
  mockRunLowdefyBuild.mockImplementation(async () => {
    calls.push('runLowdefyBuild');
  });
  const context = createContext();
  await build({ context });
  expect(mockRunLowdefyBuild).toHaveBeenCalledTimes(1);
  expect(mockRunLowdefyBuild).toHaveBeenCalledWith({ context, directory: serverDirectory });
  expect(calls).toEqual([
    'getServer',
    'resetServerPackageJson',
    'addCustomPluginsAsDeps',
    'ensurePnpmWorkspaceYaml',
    'installServer',
    'runLowdefyBuild',
    'installServer',
    'runClientBuild',
  ]);
  expect(context.logger.info).not.toHaveBeenCalledWith(
    'Building again to run the rules of newly installed plugins.'
  );
});

test('build runs the Lowdefy build again after the install when plugin checks are pending', async () => {
  mockRunLowdefyBuild.mockImplementationOnce(async () => {
    calls.push('runLowdefyBuild');
    writePending();
  });
  mockRunLowdefyBuild.mockImplementation(async () => {
    calls.push('runLowdefyBuild');
    fs.rmSync(pendingPath());
  });
  const context = createContext();
  await build({ context });
  expect(mockRunLowdefyBuild).toHaveBeenCalledTimes(2);
  expect(calls).toEqual([
    'getServer',
    'resetServerPackageJson',
    'addCustomPluginsAsDeps',
    'ensurePnpmWorkspaceYaml',
    'installServer',
    'runLowdefyBuild',
    'installServer',
    'runLowdefyBuild',
    'runClientBuild',
  ]);
  expect(context.logger.info).toHaveBeenCalledWith(
    'Building again to run the rules of newly installed plugins.'
  );
});

test('build runs at most two Lowdefy build passes when checks stay pending', async () => {
  mockRunLowdefyBuild.mockImplementation(async () => {
    calls.push('runLowdefyBuild');
    writePending();
  });
  const context = createContext();
  await build({ context });
  expect(fs.existsSync(pendingPath())).toBe(true);
  expect(mockRunLowdefyBuild).toHaveBeenCalledTimes(2);
  expect(calls).toEqual([
    'getServer',
    'resetServerPackageJson',
    'addCustomPluginsAsDeps',
    'ensurePnpmWorkspaceYaml',
    'installServer',
    'runLowdefyBuild',
    'installServer',
    'runLowdefyBuild',
    'runClientBuild',
  ]);
});

test('build runs the Lowdefy build once with --skip-plugin-checks, even when checks are pending', async () => {
  mockRunLowdefyBuild.mockImplementation(async () => {
    calls.push('runLowdefyBuild');
    writePending();
  });
  const context = createContext();
  context.options.skipPluginChecks = true;
  await build({ context });
  expect(mockRunLowdefyBuild).toHaveBeenCalledTimes(1);
  expect(calls).toEqual([
    'getServer',
    'resetServerPackageJson',
    'addCustomPluginsAsDeps',
    'ensurePnpmWorkspaceYaml',
    'installServer',
    'runLowdefyBuild',
    'installServer',
    'runClientBuild',
  ]);
});
