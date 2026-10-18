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
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';

const actualNodeUtils = await import('@lowdefy/node-utils');

const mockBuild = jest.fn();
const mockGetServer = jest.fn();
const mockSpawnProcess = jest.fn();
const mockViewNpmPackage = jest.fn();

jest.unstable_mockModule('../build/build.js', () => ({ default: mockBuild }));
jest.unstable_mockModule('../../utils/getServer.js', () => ({ default: mockGetServer }));
jest.unstable_mockModule('./viewNpmPackage.js', () => ({ default: mockViewNpmPackage }));
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  ...actualNodeUtils,
  default: actualNodeUtils.default,
  spawnProcess: mockSpawnProcess,
}));

const { default: config } = await import('./config.js');
const { default: mobileChecklist } = await import('./checklist.js');

// The shell package's own plugin functions and test plugin, so the refusals are the ones a copied
// shell makes.
const shellRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../shell');
const printerRoot = path.join(shellRoot, 'fixtures', 'printer-plugin');
const printerPackageJson = JSON.parse(
  fs.readFileSync(path.join(printerRoot, 'package.json'), 'utf8')
);
const SHELL_FILES = [
  'checkShellPlugins.js',
  'profiles.js',
  'resolveShellPlugins.js',
  'runtimeVersion.js',
  'shellVariant.js',
  'src/plugins/appTypes.js',
];

const SHELL_DEPENDENCIES = { expo: '58.0.14', 'expo-camera': '17.0.10', react: '19.2.0' };

let root;
let appDirectory;
let registry;

const printer = { name: '@example/lowdefy-printer', version: '2.1.0' };

const fieldShell = {
  id: 'field',
  name: 'Field',
  profile: 'field',
  version: '1.4',
  scheme: 'field',
  distribution: 'private',
  eas: { owner: 'example', projectId: 'p1' },
  ios: { bundleId: 'com.example.field', teamId: 'ABCDE12345' },
  android: { package: 'com.example.field' },
};

const shellPackageJsonText = `${JSON.stringify(
  { name: '@lowdefy/shell', version: '7.1.0', nativeVersion: 3, dependencies: SHELL_DEPENDENCIES },
  null,
  2
)}\n`;

function writeShellPackage(directory) {
  fs.mkdirSync(path.join(directory, 'src', 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'package.json'), shellPackageJsonText);
  SHELL_FILES.forEach((file) => {
    fs.copyFileSync(path.join(shellRoot, file), path.join(directory, file));
  });
}

function writeApp({ shells }) {
  appDirectory = path.join(root, 'apps', 'field');
  const buildDirectory = path.join(appDirectory, '.lowdefy', 'server', 'build');
  fs.mkdirSync(path.join(buildDirectory, 'mobile'), { recursive: true });
  fs.writeFileSync(path.join(buildDirectory, 'appMeta.json'), JSON.stringify({ slug: 'field' }));
  fs.writeFileSync(
    path.join(buildDirectory, 'config.json'),
    JSON.stringify({ environments: { production: { url: 'https://field.example.com' } } })
  );
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

function readProjectFile(file) {
  return fs.readFileSync(projectPath(file), 'utf8');
}

// What pnpm install leaves: each test plugin the project's package.json lists, in node_modules.
function installProject({ cwd }) {
  const { dependencies } = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  fs.rmSync(path.join(cwd, 'node_modules'), { recursive: true, force: true });
  Object.keys(dependencies)
    .filter((name) => registry.has(name))
    .forEach((name) => {
      const target = path.join(cwd, 'node_modules', name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.symlinkSync(registry.get(name).directory, target, 'dir');
    });
}

function addPlugin({ name, version = '1.0.0', packageJson = {}, shellEntry, native = false }) {
  const directory = path.join(root, 'registry', name);
  fs.mkdirSync(directory, { recursive: true });
  const published = {
    name,
    version,
    exports: { './shell': './shell.cjs', ...(native ? { './native': './native.js' } : {}) },
    peerDependencies: { expo: '>=58.0.0 <59.0.0' },
    peerDependenciesMeta: { expo: { optional: true } },
    ...packageJson,
  };
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(published));
  fs.writeFileSync(
    path.join(directory, 'shell.cjs'),
    `module.exports = ${JSON.stringify({ plugins: [], ...shellEntry })};`
  );
  registry.set(name, { directory, packageJson: published });
}

let typeManifestError;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-mobile-plugins-'));
  registry = new Map([[printer.name, { directory: printerRoot, packageJson: printerPackageJson }]]);
  typeManifestError = null;
  writeApp({ shells: [{ ...fieldShell, plugins: [{ ...printer, typePrefix: 'Printer' }] }] });
  mockBuild.mockReset();
  mockGetServer.mockReset();
  mockGetServer.mockImplementation(async ({ directory }) => {
    if (!fs.existsSync(path.join(directory, 'package.json'))) {
      writeShellPackage(directory);
    }
  });
  mockViewNpmPackage.mockReset();
  mockViewNpmPackage.mockImplementation(async ({ name, version }) => {
    const published = registry.get(name)?.packageJson;
    return published?.version === version ? published : null;
  });
  mockSpawnProcess.mockReset();
  mockSpawnProcess.mockImplementation(async ({ args, processOptions, stdErrLineHandler }) => {
    if (args[0] === 'install') {
      installProject(processOptions);
      return;
    }
    if (typeManifestError !== null) {
      stdErrLineHandler('file:///project/scripts/createTypeManifest.mjs:72');
      stdErrLineHandler(`Error: ${typeManifestError}`);
      throw new Error('node exited with code 1');
    }
  });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function typeManifestCalls() {
  return mockSpawnProcess.mock.calls.filter(([{ args }]) => args[0] !== 'install');
}

test('config adds the plugin and its native peers to the project dependencies', async () => {
  await config({ context: createContext() });
  expect(readProjectJson('package.json').dependencies).toEqual({
    '@example/lowdefy-printer': '2.1.0',
    expo: '58.0.14',
    'expo-camera': '17.0.10',
    react: '19.2.0',
    'react-native-ble-plx': '3.5.0',
  });
  expect(readProjectFile('package.original.json')).toBe(shellPackageJsonText);
  expect(mockViewNpmPackage).toHaveBeenCalledWith({
    context: expect.anything(),
    name: '@example/lowdefy-printer',
    version: '2.1.0',
  });
});

test('config writes shell.json plugins and a runtime version with the plugins hash', async () => {
  writeApp({
    shells: [
      {
        ...fieldShell,
        plugins: [{ ...printer, typePrefix: 'Printer', options: { tenant: 'field-team' } }],
      },
    ],
  });
  const result = await config({ context: createContext() });
  expect(readProjectJson('shell.json').plugins).toEqual([
    { ...printer, typePrefix: 'Printer', options: { tenant: 'field-team' } },
  ]);
  expect(result.runtimeVersion).toMatch(/^3-field-[0-9a-f]{8}$/);
});

test('config writes appTypes.js importing the plugin native types with its typePrefix', async () => {
  await config({ context: createContext() });
  expect(readProjectFile('src/plugins/appTypes.js')).toBe(
    `// Written by lowdefy mobile config from shell.json \`plugins\`. Do not edit.

import * as plugin0 from "@example/lowdefy-printer/native";
import prefixTypes from './prefixTypes.js';

export default {
  actions: { ...prefixTypes({ types: plugin0.actions, typePrefix: "Printer" }) },
  blocks: { ...prefixTypes({ types: plugin0.blocks, typePrefix: "Printer" }) },
};
`
  );
});

test('config imports no native types for a plugin without "./native"', async () => {
  addPlugin({ name: '@example/lowdefy-mdm' });
  writeApp({
    shells: [{ ...fieldShell, plugins: [{ name: '@example/lowdefy-mdm', version: '1.0.0' }] }],
  });
  await config({ context: createContext() });
  expect(readProjectFile('src/plugins/appTypes.js')).toBe(
    `// Written by lowdefy mobile config from shell.json \`plugins\`. Do not edit.

export default {
  actions: {},
  blocks: {},
};
`
  );
});

test('config checks the installed plugins with the type manifest', async () => {
  await config({ context: createContext() });
  const calls = typeManifestCalls();
  expect(calls).toHaveLength(1);
  const [{ command, args, processOptions }] = calls[0];
  expect(command).toBe(process.execPath);
  expect(args).toEqual([path.join('scripts', 'createTypeManifest.mjs')]);
  expect(processOptions.cwd).toBe(projectPath());
  expect(processOptions.env.LOWDEFY_SHELL_CONFIG).toBe(projectPath('shell.json'));
});

test('removing the plugin restores the shell dependencies, appTypes.js and runtime version', async () => {
  const shippedAppTypes = fs.readFileSync(path.join(shellRoot, 'src/plugins/appTypes.js'), 'utf8');
  const withPlugin = await config({ context: createContext() });
  writeApp({ shells: [fieldShell] });
  const without = await config({ context: createContext() });
  expect(readProjectFile('package.json')).toBe(shellPackageJsonText);
  expect(readProjectJson('shell.json').plugins).toBeUndefined();
  expect(without.runtimeVersion).toBe('3-field');
  expect(withPlugin.runtimeVersion).not.toBe('3-field');
  expect(readProjectFile('src/plugins/appTypes.js')).not.toBe(shippedAppTypes);
  expect(readProjectFile('src/plugins/appTypes.js')).toContain('actions: {},');
  expect(fs.existsSync(projectPath('node_modules', '@example', 'lowdefy-printer'))).toBe(false);
});

test('a shell without plugins leaves package.json and appTypes.js as fetched', async () => {
  writeApp({ shells: [fieldShell] });
  const shippedAppTypes = fs.readFileSync(path.join(shellRoot, 'src/plugins/appTypes.js'), 'utf8');
  const { runtimeVersion } = await config({ context: createContext() });
  expect(readProjectFile('package.json')).toBe(shellPackageJsonText);
  expect(fs.existsSync(projectPath('package.original.json'))).toBe(false);
  expect(readProjectFile('src/plugins/appTypes.js')).toBe(shippedAppTypes);
  expect(runtimeVersion).toBe('3-field');
  expect(mockViewNpmPackage).not.toHaveBeenCalled();
  expect(typeManifestCalls()).toHaveLength(0);
});

test('config --dry-run reads and checks the plugins, logs what it would add, writes no dependencies', async () => {
  const context = createContext({ dryRun: true });
  await config({ context });
  expect(mockViewNpmPackage).toHaveBeenCalledTimes(1);
  expect(context.logger.info).toHaveBeenCalledWith(
    '[dry run] add dependency @example/lowdefy-printer@2.1.0'
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    '[dry run] add dependency react-native-ble-plx@3.5.0'
  );
  expect(readProjectFile('package.json')).toBe(shellPackageJsonText);
  expect(fs.existsSync(projectPath('package.original.json'))).toBe(false);
  expect(readProjectFile('src/plugins/appTypes.js')).toBe(
    fs.readFileSync(path.join(shellRoot, 'src/plugins/appTypes.js'), 'utf8')
  );
  expect(mockSpawnProcess).not.toHaveBeenCalled();
});

describe('refusals, before anything is written', () => {
  async function expectRefusal({ plugin, message }) {
    writeApp({ shells: [{ ...fieldShell, plugins: [plugin] }] });
    await expect(config({ context: createContext() })).rejects.toThrow(message);
    expect(fs.existsSync(projectPath('shell.json'))).toBe(false);
    expect(mockSpawnProcess).not.toHaveBeenCalled();
  }

  test('an unknown version', async () => {
    await expectRefusal({
      plugin: { ...printer, version: '9.9.9' },
      message: 'Shell "field" plugin "@example/lowdefy-printer" has no published version 9.9.9.',
    });
  });

  test('an unknown package', async () => {
    mockViewNpmPackage.mockRejectedValueOnce(
      new Error('Could not read "@example/missing@1.0.0" from the registry. 404 Not Found')
    );
    await expectRefusal({
      plugin: { name: '@example/missing', version: '1.0.0' },
      message: 'Could not read "@example/missing@1.0.0" from the registry. 404 Not Found',
    });
  });

  test('an expo range that leaves out the shell expo version', async () => {
    addPlugin({
      name: '@example/old',
      packageJson: { peerDependencies: { expo: '>=57.0.0 <58.0.0' } },
    });
    await expectRefusal({
      plugin: { name: '@example/old', version: '1.0.0' },
      message:
        'Shell "field" plugin "@example/old@1.0.0" supports expo ">=57.0.0 <58.0.0", and @lowdefy/shell@7.1.0 uses expo 58.0.14.',
    });
  });

  test('no expo peer', async () => {
    addPlugin({ name: '@example/no-expo', packageJson: { peerDependencies: {} } });
    await expectRefusal({
      plugin: { name: '@example/no-expo', version: '1.0.0' },
      message: 'Shell "field" plugin "@example/no-expo@1.0.0" declares no "expo" peer range.',
    });
  });

  test('a native peer that is not an exact version', async () => {
    addPlugin({
      name: '@example/ranged',
      packageJson: {
        peerDependencies: { expo: '^58.0.0', 'react-native-ble-plx': '^3.5.0' },
        peerDependenciesMeta: {
          expo: { optional: true },
          'react-native-ble-plx': { optional: true },
        },
      },
    });
    await expectRefusal({
      plugin: { name: '@example/ranged', version: '1.0.0' },
      message:
        'Shell "field" plugin "@example/ranged@1.0.0" peer "react-native-ble-plx" should be an exact version, like 1.2.3. Received "^3.5.0".',
    });
  });

  test('a required peer', async () => {
    addPlugin({
      name: '@example/required',
      packageJson: {
        peerDependencies: { expo: '^58.0.0', 'react-native-ble-plx': '3.5.0' },
        peerDependenciesMeta: { expo: { optional: true } },
      },
    });
    await expectRefusal({
      plugin: { name: '@example/required', version: '1.0.0' },
      message:
        'Shell "field" plugin "@example/required@1.0.0" peer "react-native-ble-plx" is not marked optional in peerDependenciesMeta.',
    });
  });

  test('an optional expo is needed too', async () => {
    addPlugin({ name: '@example/required-expo', packageJson: { peerDependenciesMeta: {} } });
    await expectRefusal({
      plugin: { name: '@example/required-expo', version: '1.0.0' },
      message: 'peer "expo" is not marked optional in peerDependenciesMeta.',
    });
  });

  test('a peer the shell has at another version', async () => {
    addPlugin({
      name: '@example/react',
      packageJson: {
        peerDependencies: { expo: '^58.0.0', react: '19.1.0' },
        peerDependenciesMeta: { expo: { optional: true }, react: { optional: true } },
      },
    });
    await expectRefusal({
      plugin: { name: '@example/react', version: '1.0.0' },
      message:
        'Shell "field" plugin "@example/react@1.0.0" peer "react" is 19.1.0, and @lowdefy/shell@7.1.0 uses 19.2.0.',
    });
  });
});

describe('refusals after install, before EAS', () => {
  test('a module the shell carries in a profile', async () => {
    addPlugin({
      name: '@example/camera',
      shellEntry: { modules: { 'expo-camera': 'ExpoCamera' } },
    });
    writeApp({
      shells: [{ ...fieldShell, plugins: [{ name: '@example/camera', version: '1.0.0' }] }],
    });
    await expect(config({ context: createContext() })).rejects.toThrow(
      'Shell plugin "@example/camera" links "expo-camera", which @lowdefy/shell carries in the "field" profile.'
    );
  });

  test('a permission the shell profile leaves out', async () => {
    addPlugin({
      name: '@example/scanner',
      shellEntry: { permissions: ['NSCameraUsageDescription'] },
    });
    writeApp({
      shells: [
        {
          ...fieldShell,
          profile: 'basic',
          plugins: [{ name: '@example/scanner', version: '1.0.0' }],
        },
      ],
    });
    await expect(config({ context: createContext() })).rejects.toThrow(
      'Shell plugin "@example/scanner" asks for "NSCameraUsageDescription", which the "basic" profile leaves out. Pick the "field" profile, which carries it.'
    );
  });

  test('a type name that clashes with a built-in', async () => {
    typeManifestError =
      'Shell plugin "@example/lowdefy-printer" gives the block type "Tag", which "@lowdefy/blocks-native" already gives. Set a typePrefix on the plugin in mobile.shells[].plugins.';
    writeApp({ shells: [{ ...fieldShell, plugins: [printer] }] });
    await expect(config({ context: createContext() })).rejects.toThrow(
      `Shell "field": ${typeManifestError}`
    );
  });

  test('a shell package without shell plugin support', async () => {
    mockGetServer.mockImplementation(async ({ directory }) => {
      writeShellPackage(directory);
      fs.rmSync(path.join(directory, 'resolveShellPlugins.js'));
    });
    await expect(config({ context: createContext() })).rejects.toThrow(
      'Shell "field" lists plugins, and @lowdefy/shell@7.1.0 does not carry shell plugins.'
    );
    expect(mockViewNpmPackage).not.toHaveBeenCalled();
  });
});

describe('checklist', () => {
  test('names each plugin with what it declares, and joins its data to the privacy step', async () => {
    await config({ context: createContext() });
    const context = createContext();
    const steps = await mobileChecklist({ context });
    const privacy = steps.find((step) => step.id === 'privacy');
    expect(privacy.details).toContain(
      'Device ID: collected, linked to the user, for app functionality.'
    );
    const plugins = steps.find((step) => step.id === 'shell-plugins');
    expect(plugins.details[0]).toBe(
      '@example/lowdefy-printer@2.1.0: permissions NSBluetoothAlwaysUsageDescription, android.permission.BLUETOOTH_CONNECT; privacy reasons NSPrivacyAccessedAPICategoryUserDefaults (1C8F.1), NSPrivacyAccessedAPICategoryActiveKeyboards (3EC4.1); data Device ID for app functionality.'
    );
    expect(plugins.details.join('\n')).toContain('signed privacy manifest');
    expect(plugins.details.join('\n')).toContain('background modes, Bluetooth or tracking');
  });

  test('fails saying to run config first when a plugin is not installed', async () => {
    await expect(mobileChecklist({ context: createContext() })).rejects.toThrow(
      `Shell "field" plugin "@example/lowdefy-printer@2.1.0" is not installed in ${projectPath()}. Run lowdefy mobile config --shell field --env production first.`
    );
  });
});
