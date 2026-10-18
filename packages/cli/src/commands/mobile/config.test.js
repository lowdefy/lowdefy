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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';

const actualNodeUtils = await import('@lowdefy/node-utils');

const mockBuild = jest.fn();
const mockGetServer = jest.fn();
const mockSpawnProcess = jest.fn();

jest.unstable_mockModule('../build/build.js', () => ({ default: mockBuild }));
jest.unstable_mockModule('../../utils/getServer.js', () => ({ default: mockGetServer }));
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  ...actualNodeUtils,
  default: actualNodeUtils.default,
  spawnProcess: mockSpawnProcess,
}));

const { default: config } = await import('./config.js');
const { default: EAS_CLI_VERSION } = await import('./easCliVersion.js');

let root;
let appDirectory;

const appConfig = {
  environments: {
    production: { url: 'https://field.example.com' },
    staging: { url: 'https://staging.field.example.com' },
  },
};

const fieldShell = {
  id: 'field',
  name: 'Field',
  color: '#0B5FFF',
  profile: 'field',
  version: '1.4',
  scheme: 'field',
  distribution: 'private',
  eas: { owner: 'example', projectId: 'p1' },
  ios: { bundleId: 'com.example.field', teamId: 'ABCDE12345' },
  android: { package: 'com.example.field', sha256: ['AA:BB'] },
};

// What the published @lowdefy/shell carries that lowdefy mobile reads.
function writeShellPackage(directory) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ name: '@lowdefy/shell', version: '7.1.0', nativeVersion: 3 })
  );
  fs.writeFileSync(
    path.join(directory, 'profiles.js'),
    `const PROFILES = { basic: ['runtime'], field: ['runtime', 'camera', 'location'] };
module.exports = {
  resolveProfile(name) {
    if (!PROFILES[name]) throw new Error('Shell profile "' + name + '" does not exist.');
    return { name, capabilities: PROFILES[name] };
  },
};
`
  );
  fs.writeFileSync(
    path.join(directory, 'runtimeVersion.js'),
    `module.exports = {
  getRuntimeVersion({ nativeVersion, profile }) {
    return nativeVersion + '-' + profile;
  },
};
`
  );
}

function writeApp({ shells }) {
  appDirectory = path.join(root, 'apps', 'field');
  const buildDirectory = path.join(appDirectory, '.lowdefy', 'server', 'build');
  fs.mkdirSync(path.join(buildDirectory, 'mobile'), { recursive: true });
  fs.mkdirSync(path.join(appDirectory, 'mobile'), { recursive: true });
  fs.writeFileSync(path.join(appDirectory, 'mobile', 'icon.png'), 'icon bytes');
  fs.writeFileSync(
    path.join(buildDirectory, 'appMeta.json'),
    JSON.stringify({ slug: 'field-app', name: 'Field App' })
  );
  fs.writeFileSync(path.join(buildDirectory, 'config.json'), JSON.stringify(appConfig));
  fs.writeFileSync(path.join(buildDirectory, 'mobile', 'config.json'), JSON.stringify({ shells }));
}

function createContext(options = {}) {
  return {
    configDirectory: appDirectory,
    directories: { build: path.join(appDirectory, '.lowdefy', 'server', 'build') },
    logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    lowdefyVersion: '7.1.0',
    options: { env: 'production', ...options },
    pnpmCmd: 'pnpm',
  };
}

function projectPath(...parts) {
  return path.join(appDirectory, '.lowdefy', 'mobile', 'field', 'project', ...parts);
}

function readProjectJson(file) {
  return JSON.parse(fs.readFileSync(projectPath(file), 'utf8'));
}

const savedEnvironment = process.env.LOWDEFY_ENVIRONMENT;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-mobile-config-'));
  writeApp({
    shells: [{ ...fieldShell, icon: path.join(root, 'apps', 'field', 'mobile', 'icon.png') }],
  });
  mockBuild.mockReset();
  mockGetServer.mockReset();
  mockGetServer.mockImplementation(async ({ directory }) => writeShellPackage(directory));
  mockSpawnProcess.mockReset();
  mockSpawnProcess.mockResolvedValue();
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

afterAll(() => {
  if (savedEnvironment === undefined) {
    delete process.env.LOWDEFY_ENVIRONMENT;
  } else {
    process.env.LOWDEFY_ENVIRONMENT = savedEnvironment;
  }
});

test('config builds the app for the environment, without the client build', async () => {
  const context = createContext({ env: 'staging' });
  await config({ context });
  expect(mockBuild).toHaveBeenCalledTimes(1);
  expect(mockBuild.mock.calls[0][0].context.options.clientBuild).toBe(false);
  expect(process.env.LOWDEFY_ENVIRONMENT).toBe('staging');
});

test('config fetches @lowdefy/shell into .lowdefy/mobile/<shell>/project', async () => {
  const context = createContext();
  await config({ context });
  expect(mockGetServer).toHaveBeenCalledWith({
    context,
    packageName: '@lowdefy/shell',
    directory: projectPath(),
  });
});

test('config writes shell.json, eas.json and the icon', async () => {
  const result = await config({ context: createContext() });
  expect(readProjectJson('shell.json')).toEqual({
    id: 'field',
    name: 'Field',
    scheme: 'field',
    profile: 'field',
    capabilities: ['runtime', 'camera', 'location'],
    environment: 'production',
    version: '1.4.0',
    icon: './icon.png',
    color: '#0B5FFF',
    ios: { bundleIdentifier: 'com.example.field' },
    android: { package: 'com.example.field' },
    eas: { owner: 'example', projectId: 'p1' },
    app: {
      id: 'field-app',
      name: 'Field App',
      urls: { production: 'https://field.example.com' },
    },
    store: {},
  });
  expect(readProjectJson('eas.json')).toEqual({
    cli: { version: EAS_CLI_VERSION, appVersionSource: 'remote' },
    build: {
      production: {
        channel: 'production',
        autoIncrement: true,
        distribution: 'store',
        env: { LOWDEFY_SHELL_CONFIG: './shell.json', LOWDEFY_SHELL_VARIANT: 'release' },
      },
      staging: {
        channel: 'staging',
        autoIncrement: true,
        distribution: 'store',
        env: { LOWDEFY_SHELL_CONFIG: './shell.json', LOWDEFY_SHELL_VARIANT: 'release' },
      },
      development: {
        developmentClient: true,
        distribution: 'internal',
        env: { LOWDEFY_SHELL_CONFIG: './shell.json', LOWDEFY_SHELL_VARIANT: 'dev' },
      },
    },
    submit: {
      production: { android: { track: 'internal' } },
      staging: { android: { track: 'internal' } },
    },
  });
  expect(fs.readFileSync(projectPath('icon.png'), 'utf8')).toBe('icon bytes');
  expect(result).toEqual({
    environment: 'production',
    projectDirectory: projectPath(),
    runtimeVersion: '3-field',
    shell: expect.objectContaining({ id: 'field' }),
    shellJson: readProjectJson('shell.json'),
    shellVersion: '7.1.0',
  });
});

test('config prints the runtime version', async () => {
  const context = createContext();
  await config({ context });
  expect(context.logger.info).toHaveBeenCalledWith(
    `Shell "field" for production written to ${projectPath()}: @lowdefy/shell@7.1.0, profile field, runtime version 3-field.`
  );
});

test('config --env staging writes the staging environment and url', async () => {
  await config({ context: createContext({ env: 'staging' }) });
  const shellJson = readProjectJson('shell.json');
  expect(shellJson.environment).toBe('staging');
  expect(shellJson.app.urls).toEqual({ staging: 'https://staging.field.example.com' });
});

test('config fails on an environment not in config.environments, listing them', async () => {
  await expect(config({ context: createContext({ env: 'preview' }) })).rejects.toThrow(
    'Environment "preview" is not declared in "config.environments". Environments: production, staging.'
  );
  expect(mockGetServer).not.toHaveBeenCalled();
});

test('config fails naming both shells when the app has two and no --shell', async () => {
  writeApp({ shells: [fieldShell, { ...fieldShell, id: 'ops' }] });
  await expect(config({ context: createContext() })).rejects.toThrow(
    'The app declares 2 shells (field, ops). Pick one with --shell <id>.'
  );
});

test('config fails on an unknown --shell', async () => {
  await expect(config({ context: createContext({ shell: 'ops' }) })).rejects.toThrow(
    'The app has no shell "ops". Shells: field.'
  );
});

test('config fails on a profile the copied shell does not have', async () => {
  writeApp({ shells: [{ ...fieldShell, profile: 'field-nfc' }] });
  await expect(config({ context: createContext() })).rejects.toThrow(
    'Shell profile "field-nfc" does not exist.'
  );
});

test('config reads a shell without a profile as basic', async () => {
  const { profile, ...shell } = fieldShell;
  writeApp({ shells: [shell] });
  const { runtimeVersion } = await config({ context: createContext() });
  expect(readProjectJson('shell.json').profile).toBe('basic');
  expect(readProjectJson('shell.json').capabilities).toEqual(['runtime']);
  expect(runtimeVersion).toBe('3-basic');
});

test('config fails when the copied shell has no runtime version function', async () => {
  mockGetServer.mockImplementation(async ({ directory }) => {
    writeShellPackage(directory);
    fs.rmSync(path.join(directory, 'runtimeVersion.js'));
  });
  await expect(config({ context: createContext() })).rejects.toThrow(
    '@lowdefy/shell@7.1.0 has no runtimeVersion.js. lowdefy mobile needs a shell with capability profiles and a native version.'
  );
});

test('config refuses an app on the local Lowdefy version', async () => {
  const context = createContext();
  context.lowdefyVersion = 'local';
  await expect(config({ context })).rejects.toThrow('this app\'s version is "local"');
  expect(mockBuild).not.toHaveBeenCalled();
});

test('config installs the project as its own workspace inside an app pnpm workspace', async () => {
  fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'apps/*'\n");
  fs.writeFileSync(
    path.join(root, '.npmrc'),
    '@example:registry=https://npm.example.com/\n//npm.example.com/:_authToken=literal-secret\n'
  );
  const context = createContext();
  await config({ context });
  expect(fs.readFileSync(projectPath('pnpm-workspace.yaml'), 'utf8')).toBe("packages:\n  - '.'\n");
  const npmrc = fs.readFileSync(projectPath('.npmrc'), 'utf8');
  expect(npmrc).toContain('@example:registry=https://npm.example.com/');
  expect(npmrc).not.toContain('literal-secret');
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(mockSpawnProcess).toHaveBeenCalledTimes(1);
  const [{ command, args, processOptions }] = mockSpawnProcess.mock.calls[0];
  expect(command).toBe('pnpm');
  expect(args).toEqual(['install', '--no-frozen-lockfile']);
  expect(processOptions.cwd).toBe(projectPath());
});

test('config writes a standalone pnpm-workspace.yaml and no .npmrc outside a workspace', async () => {
  await config({ context: createContext() });
  expect(fs.readFileSync(projectPath('pnpm-workspace.yaml'), 'utf8')).toBe("packages:\n  - '.'\n");
  expect(fs.existsSync(projectPath('.npmrc'))).toBe(false);
});

test('config skips an install whose package.json did not change', async () => {
  await config({ context: createContext() });
  await config({ context: createContext() });
  expect(mockSpawnProcess).toHaveBeenCalledTimes(1);
});

test('config --dry-run writes the project, prints the install and runs none', async () => {
  const context = createContext({ dryRun: true });
  await config({ context });
  expect(mockSpawnProcess).not.toHaveBeenCalled();
  expect(fs.existsSync(projectPath('shell.json'))).toBe(true);
  expect(context.logger.info).toHaveBeenCalledWith('[dry run] pnpm install --no-frozen-lockfile');
  expect(context.logger.info).toHaveBeenCalledWith(`[dry run]   cwd: ${projectPath()}`);
});
