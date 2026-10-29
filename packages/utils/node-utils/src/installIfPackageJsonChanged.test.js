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
import fsExtra from 'fs-extra';
import path from 'path';
import { vi, afterAll, beforeEach, expect, test } from 'vitest';
import installIfPackageJsonChanged from './installIfPackageJsonChanged.js';

const baseDir = path.resolve(process.cwd(), 'test/installIfPackageJsonChanged');

beforeEach(async () => {
  await new Promise((resolve) => fsExtra.emptyDir(baseDir, resolve));
});

afterAll(async () => {
  await new Promise((resolve) => fsExtra.emptyDir(baseDir, resolve));
});

test('installIfPackageJsonChanged installs on first run and writes the hash', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = vi.fn();
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(1);
  expect(fs.existsSync(path.join(baseDir, 'node_modules', '.lowdefy-install-hash'))).toBe(true);
});

test('installIfPackageJsonChanged skips when package.json is unchanged', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = vi.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(false);
  expect(install).toHaveBeenCalledTimes(1);
});

test('installIfPackageJsonChanged installs again when package.json changes', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = vi.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{"a":"1.0.0"}}');
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged installs again when pnpm-workspace.yaml changes', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = vi.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  fs.writeFileSync(path.join(baseDir, 'pnpm-workspace.yaml'), 'overrides:\n  a: 1.0.0\n');
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
  const skipped = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(skipped).toBe(false);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged installs again when .npmrc changes', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = vi.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  fs.writeFileSync(path.join(baseDir, '.npmrc'), '@scope:registry=https://npm.example.com/\n');
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
  const skipped = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(skipped).toBe(false);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged installs when node_modules was deleted', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = vi.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  fs.rmSync(path.join(baseDir, 'node_modules'), { recursive: true, force: true });
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged does not write the hash when install throws', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = vi.fn(() => {
    throw new Error('Install failed.');
  });
  await expect(installIfPackageJsonChanged({ directory: baseDir, install })).rejects.toThrow(
    'Install failed.'
  );
  expect(fs.existsSync(path.join(baseDir, 'node_modules', '.lowdefy-install-hash'))).toBe(false);
});

test('installIfPackageJsonChanged throws when package.json is missing', async () => {
  const install = vi.fn();
  await expect(installIfPackageJsonChanged({ directory: baseDir, install })).rejects.toThrow(
    `Could not read package.json in ${baseDir}.`
  );
  expect(install).not.toHaveBeenCalled();
});

test('installIfPackageJsonChanged throws when directory is not a string', async () => {
  await expect(
    installIfPackageJsonChanged({ directory: undefined, install: vi.fn() })
  ).rejects.toThrow('installIfPackageJsonChanged requires a directory string.');
});

test('installIfPackageJsonChanged throws when install is not a function', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  await expect(
    installIfPackageJsonChanged({ directory: baseDir, install: undefined })
  ).rejects.toThrow('installIfPackageJsonChanged requires an install function.');
});

const statePath = () => path.join(baseDir, 'node_modules', '.lowdefy-install-state.json');
const hashPath = () => path.join(baseDir, 'node_modules', '.lowdefy-install-hash');

function writePackageJson(packageJson) {
  fs.writeFileSync(path.join(baseDir, 'package.json'), JSON.stringify(packageJson, null, 2));
}

const installedPackageJson = {
  name: 'server',
  dependencies: { a: '^1.0.0', b: 'link:../plugins/b', c: '2.0.0' },
  devDependencies: { d: '3.0.0' },
};

async function installFirst() {
  writePackageJson(installedPackageJson);
  const install = vi.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(install).toHaveBeenCalledTimes(1);
  return install;
}

test('installIfPackageJsonChanged writes the installed dependencies to the state file', async () => {
  await installFirst();
  const state = JSON.parse(fs.readFileSync(statePath(), 'utf8'));
  expect(state.dependencies).toEqual(installedPackageJson.dependencies);
  expect(state.devDependencies).toEqual(installedPackageJson.devDependencies);
  expect(typeof state.settingsHash).toBe('string');
});

test('installIfPackageJsonChanged with skipIfInstalled skips when the dependencies are a strict subset of the installed ones', async () => {
  const install = await installFirst();
  writePackageJson({ name: 'server', dependencies: { a: '^1.0.0' }, devDependencies: {} });
  const installed = await installIfPackageJsonChanged({
    directory: baseDir,
    install,
    skipIfInstalled: true,
  });
  expect(installed).toBe(false);
  expect(install).toHaveBeenCalledTimes(1);
});

test('installIfPackageJsonChanged with skipIfInstalled skips when the dependencies match exactly', async () => {
  const install = await installFirst();
  // Key order and formatting differ from the installed package.json.
  fs.writeFileSync(
    path.join(baseDir, 'package.json'),
    JSON.stringify({
      name: 'server',
      devDependencies: { d: '3.0.0' },
      dependencies: { c: '2.0.0', b: 'link:../plugins/b', a: '^1.0.0' },
    })
  );
  const installed = await installIfPackageJsonChanged({
    directory: baseDir,
    install,
    skipIfInstalled: true,
  });
  expect(installed).toBe(false);
  expect(install).toHaveBeenCalledTimes(1);
});

test.each([
  ['a dependency that was not installed', { dependencies: { a: '^1.0.0', e: '1.0.0' } }],
  ['an exact version against an installed range', { dependencies: { a: '1.0.0' } }],
  ['a changed link: path', { dependencies: { b: 'link:../other/b' } }],
  [
    'a dependency moved from dependencies to devDependencies',
    { dependencies: {}, devDependencies: { a: '^1.0.0' } },
  ],
  [
    'a dependency moved from devDependencies to dependencies',
    { dependencies: { d: '3.0.0' }, devDependencies: {} },
  ],
  ['a new optionalDependencies field', { dependencies: {}, optionalDependencies: { a: '^1.0.0' } }],
  ['changed pnpm overrides', { dependencies: {}, pnpm: { overrides: { a: '1.0.1' } } }],
])('installIfPackageJsonChanged with skipIfInstalled installs for %s', async (_, packageJson) => {
  const install = await installFirst();
  writePackageJson({ name: 'server', ...packageJson });
  const installed = await installIfPackageJsonChanged({
    directory: baseDir,
    install,
    skipIfInstalled: true,
  });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test.each([
  ['pnpm-workspace.yaml', 'changes', 'overrides:\n  a: 1.0.0\n', 'overrides:\n  a: 1.0.1\n'],
  ['pnpm-workspace.yaml', 'appears', null, 'overrides:\n  a: 1.0.0\n'],
  ['pnpm-workspace.yaml', 'disappears', 'overrides:\n  a: 1.0.0\n', null],
  ['pnpm-workspace.yaml', 'appears empty', null, ''],
  [
    '.npmrc',
    'changes',
    '@a:registry=https://a.example.com/\n',
    '@a:registry=https://b.example.com/\n',
  ],
  ['.npmrc', 'appears', null, '@a:registry=https://a.example.com/\n'],
  ['.npmrc', 'disappears', '@a:registry=https://a.example.com/\n', null],
])(
  'installIfPackageJsonChanged with skipIfInstalled installs when %s %s, also with a subset of the dependencies',
  async (fileName, _, before, after) => {
    const filePath = path.join(baseDir, fileName);
    if (before !== null) fs.writeFileSync(filePath, before);
    const install = await installFirst();
    if (after === null) {
      fs.rmSync(filePath);
    } else {
      fs.writeFileSync(filePath, after);
    }
    writePackageJson({ name: 'server', dependencies: { a: '^1.0.0' } });
    const installed = await installIfPackageJsonChanged({
      directory: baseDir,
      install,
      skipIfInstalled: true,
    });
    expect(installed).toBe(true);
    expect(install).toHaveBeenCalledTimes(2);
  }
);

test('installIfPackageJsonChanged with skipIfInstalled skips when the install itself rewrote pnpm-workspace.yaml', async () => {
  const workspacePath = path.join(baseDir, 'pnpm-workspace.yaml');
  fs.writeFileSync(workspacePath, "packages:\n  - '.'\n");
  writePackageJson(installedPackageJson);
  const install = vi.fn(() => {
    fs.writeFileSync(workspacePath, "packages:\n  - '.'\nminimumReleaseAgeExclude:\n  - a@1.0.1\n");
  });
  await installIfPackageJsonChanged({ directory: baseDir, install });
  writePackageJson({ name: 'server', dependencies: { a: '^1.0.0' } });
  const installed = await installIfPackageJsonChanged({
    directory: baseDir,
    install,
    skipIfInstalled: true,
  });
  expect(installed).toBe(false);
  expect(install).toHaveBeenCalledTimes(1);
});

test('installIfPackageJsonChanged with skipIfInstalled installs on the first run', async () => {
  writePackageJson(installedPackageJson);
  const install = vi.fn();
  const installed = await installIfPackageJsonChanged({
    directory: baseDir,
    install,
    skipIfInstalled: true,
  });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(1);
  expect(fs.existsSync(statePath())).toBe(true);
});

test('installIfPackageJsonChanged with skipIfInstalled installs when node_modules was deleted', async () => {
  const install = await installFirst();
  fs.rmSync(path.join(baseDir, 'node_modules'), { recursive: true, force: true });
  writePackageJson({ name: 'server', dependencies: { a: '^1.0.0' } });
  const installed = await installIfPackageJsonChanged({
    directory: baseDir,
    install,
    skipIfInstalled: true,
  });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged with skipIfInstalled installs a subset on a server an older version installed with only the hash', async () => {
  const install = await installFirst();
  fs.rmSync(statePath());
  writePackageJson({ name: 'server', dependencies: { a: '^1.0.0' } });
  const installed = await installIfPackageJsonChanged({
    directory: baseDir,
    install,
    skipIfInstalled: true,
  });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
  expect(JSON.parse(fs.readFileSync(statePath(), 'utf8')).dependencies).toEqual({
    a: '^1.0.0',
  });
});

test('installIfPackageJsonChanged leaves the state file unchanged after a skip', async () => {
  const install = await installFirst();
  const stateBefore = fs.readFileSync(statePath(), 'utf8');
  const hashBefore = fs.readFileSync(hashPath(), 'utf8');
  writePackageJson({ name: 'server', dependencies: { a: '^1.0.0' } });
  await installIfPackageJsonChanged({ directory: baseDir, install, skipIfInstalled: true });
  expect(fs.readFileSync(statePath(), 'utf8')).toBe(stateBefore);
  expect(fs.readFileSync(hashPath(), 'utf8')).toBe(hashBefore);
  // The next run still compares with what is installed: c is installed, e is not.
  writePackageJson({ name: 'server', dependencies: { c: '2.0.0' } });
  expect(
    await installIfPackageJsonChanged({ directory: baseDir, install, skipIfInstalled: true })
  ).toBe(false);
  writePackageJson({ name: 'server', dependencies: { e: '1.0.0' } });
  expect(
    await installIfPackageJsonChanged({ directory: baseDir, install, skipIfInstalled: true })
  ).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged without skipIfInstalled installs a subset of the installed dependencies', async () => {
  const install = await installFirst();
  writePackageJson({ name: 'server', dependencies: { a: '^1.0.0' } });
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged writes neither file when install throws', async () => {
  writePackageJson(installedPackageJson);
  const install = vi.fn(() => {
    throw new Error('Install failed.');
  });
  await expect(
    installIfPackageJsonChanged({ directory: baseDir, install, skipIfInstalled: true })
  ).rejects.toThrow('Install failed.');
  expect(fs.existsSync(hashPath())).toBe(false);
  expect(fs.existsSync(statePath())).toBe(false);
});

test('installIfPackageJsonChanged keeps the previous state when a later install throws', async () => {
  await installFirst();
  const stateBefore = fs.readFileSync(statePath(), 'utf8');
  writePackageJson({ name: 'server', dependencies: { e: '1.0.0' } });
  const install = vi.fn(() => {
    throw new Error('Install failed.');
  });
  await expect(
    installIfPackageJsonChanged({ directory: baseDir, install, skipIfInstalled: true })
  ).rejects.toThrow('Install failed.');
  expect(fs.readFileSync(statePath(), 'utf8')).toBe(stateBefore);
});

test.each([['yes'], [1], [null], [{}]])(
  'installIfPackageJsonChanged throws when skipIfInstalled is %j',
  async (skipIfInstalled) => {
    writePackageJson(installedPackageJson);
    const install = vi.fn();
    await expect(
      installIfPackageJsonChanged({ directory: baseDir, install, skipIfInstalled })
    ).rejects.toThrow(
      `installIfPackageJsonChanged skipIfInstalled must be a boolean. Received ${JSON.stringify(
        skipIfInstalled
      )}.`
    );
    expect(install).not.toHaveBeenCalled();
  }
);
