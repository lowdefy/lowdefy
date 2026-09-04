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
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.unstable_mockModule('../../utils/addCustomPluginsAsDeps.js', () => ({
  default: jest.fn(),
}));
jest.unstable_mockModule('../../utils/ensurePnpmWorkspaceYaml.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/getServer.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/installServer.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/resetServerPackageJson.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/runLowdefyBuild.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/runClientBuild.js', () => ({ default: jest.fn() }));

const teamUsers = {
  source: 'github:acme/team-users@main',
  ref: 'main',
  commit: '4f0a1c9b2e7d5a3f8c1b6e0d9a4f7c2b5e8d1a30',
};
const billing = {
  source: 'github:acme/billing@v2.1.0',
  ref: 'v2.1.0',
  commit: '9c3e5b1f7a2d4e8c0b6f3a9d5e1c7b4a2f6d0e83',
};

let modulesUpdate;
let readModuleLockfile;
let writeModuleLockfile;
let runLowdefyBuild;
let runClientBuild;
let getServer;

const lockfileName = 'lowdefy-modules.lock.yaml';

function makeContext(configDirectory) {
  return {
    directories: { config: configDirectory, server: path.join(configDirectory, '.lowdefy/server') },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    options: {},
    sendTelemetry: jest.fn(),
  };
}

function logLines(context) {
  return context.logger.info.mock.calls.map((call) => call[call.length - 1]);
}

beforeEach(async () => {
  jest.clearAllMocks();
  modulesUpdate = (await import('./modulesUpdate.js')).default;
  ({ readModuleLockfile, writeModuleLockfile } = await import('@lowdefy/node-utils'));
  runLowdefyBuild = (await import('../../utils/runLowdefyBuild.js')).default;
  runClientBuild = (await import('../../utils/runClientBuild.js')).default;
  getServer = (await import('../../utils/getServer.js')).default;
});

async function setupConfigDir(lockfile) {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-modules-update-'));
  await writeModuleLockfile({ configDirectory, lockfile });
  return configDirectory;
}

test('modulesUpdate deletes only the named entry', async () => {
  const configDirectory = await setupConfigDir({ 'team-users': teamUsers, billing });
  const context = makeContext(configDirectory);

  await modulesUpdate({ context, params: ['team-users'] });

  // runLowdefyBuild is mocked, so the lockfile stays as modulesUpdate left it.
  await expect(readModuleLockfile({ configDirectory })).resolves.toEqual({ billing });

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate deletes every entry when no name is given', async () => {
  const configDirectory = await setupConfigDir({ 'team-users': teamUsers, billing });
  const context = makeContext(configDirectory);

  await modulesUpdate({ context, params: [] });

  await expect(readModuleLockfile({ configDirectory })).resolves.toEqual({});

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate errors for an unknown name and lists the known entries', async () => {
  const configDirectory = await setupConfigDir({ 'team-users': teamUsers, billing });
  const context = makeContext(configDirectory);

  await expect(modulesUpdate({ context, params: ['nope'] })).rejects.toThrow(
    'Module "nope" has no entry in lowdefy-modules.lock.yaml. Known entries: billing, team-users.'
  );
  expect(runLowdefyBuild).not.toHaveBeenCalled();

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate errors for a name when the lockfile has no entries', async () => {
  const configDirectory = await setupConfigDir({});
  const context = makeContext(configDirectory);

  await expect(modulesUpdate({ context, params: ['team-users'] })).rejects.toThrow(
    'Module "team-users" has no entry in lowdefy-modules.lock.yaml. The lockfile has no entries.'
  );

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate runs the build with the lockfile write opt-in and skips the client build', async () => {
  const configDirectory = await setupConfigDir({ billing });
  const context = makeContext(configDirectory);

  await modulesUpdate({ context, params: [] });

  expect(getServer).toHaveBeenCalledWith({
    context,
    packageName: '@lowdefy/server',
    directory: context.directories.server,
  });
  expect(runLowdefyBuild).toHaveBeenCalledWith({
    context,
    directory: context.directories.server,
    env: { LOWDEFY_BUILD_WRITE_MODULE_LOCK: '1' },
  });
  expect(runClientBuild).not.toHaveBeenCalled();
  expect(context.sendTelemetry).toHaveBeenCalled();

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate logs the commit change for each module', async () => {
  const configDirectory = await setupConfigDir({ 'team-users': teamUsers, billing });
  const context = makeContext(configDirectory);

  // Stand in for the build: rewrite the entry that was invalidated.
  runLowdefyBuild.mockImplementation(async () => {
    await writeModuleLockfile({
      configDirectory,
      lockfile: {
        billing,
        'team-users': { ...teamUsers, commit: '9b2e7d5a3f8c1b6e0d9a4f7c2b5e8d1a304f0a1c' },
      },
    });
  });

  await modulesUpdate({ context, params: ['team-users'] });

  const lines = logLines(context);
  expect(lines).toContain('billing  v2.1.0  unchanged');
  expect(lines).toContain('team-users  main  4f0a1c9 → 9b2e7d5');

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate logs an added module and a removed module', async () => {
  const configDirectory = await setupConfigDir({ 'team-users': teamUsers });
  const context = makeContext(configDirectory);

  runLowdefyBuild.mockImplementation(async () => {
    await writeModuleLockfile({ configDirectory, lockfile: { billing } });
  });

  await modulesUpdate({ context, params: [] });

  const lines = logLines(context);
  expect(lines).toContain('billing  v2.1.0  added 9c3e5b1');
  expect(lines).toContain('team-users  main  removed');

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate works when no lockfile exists yet', async () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-modules-update-'));
  const context = makeContext(configDirectory);

  await modulesUpdate({ context, params: [] });

  expect(runLowdefyBuild).toHaveBeenCalled();
  expect(fs.existsSync(path.join(configDirectory, lockfileName))).toBe(true);

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate refuses a malformed lockfile instead of wiping every pin', async () => {
  // A hand-edited or merge-conflicted lockfile used to read as {}, so the
  // command rewrote it empty and reported success, destroying every pin.
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-modules-update-'));
  const filePath = path.join(configDirectory, lockfileName);
  const content = ['<<<<<<< HEAD', 'team-users:', '  ref: main', '=======', '>>>>>>> other'].join(
    '\n'
  );
  fs.writeFileSync(filePath, content);
  const context = makeContext(configDirectory);

  await expect(modulesUpdate({ context, params: [] })).rejects.toThrow(
    /Could not parse lowdefy-modules.lock.yaml/
  );

  expect(fs.readFileSync(filePath, 'utf8')).toEqual(content);
  expect(runLowdefyBuild).not.toHaveBeenCalled();

  fs.rmSync(configDirectory, { recursive: true });
});

test('modulesUpdate refuses a lockfile that is not a map of entries', async () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-modules-update-'));
  const filePath = path.join(configDirectory, lockfileName);
  fs.writeFileSync(filePath, '- team-users\n');
  const context = makeContext(configDirectory);

  await expect(modulesUpdate({ context, params: [] })).rejects.toThrow(
    /should be a map of module entry ids to lock entries/
  );

  expect(fs.readFileSync(filePath, 'utf8')).toEqual('- team-users\n');

  fs.rmSync(configDirectory, { recursive: true });
});
