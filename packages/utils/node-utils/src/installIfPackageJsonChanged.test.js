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
import { jest } from '@jest/globals';
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
  const install = jest.fn();
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(1);
  expect(fs.existsSync(path.join(baseDir, 'node_modules', '.lowdefy-install-hash'))).toBe(true);
});

test('installIfPackageJsonChanged skips when package.json is unchanged', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = jest.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(false);
  expect(install).toHaveBeenCalledTimes(1);
});

test('installIfPackageJsonChanged installs again when package.json changes', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = jest.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{"a":"1.0.0"}}');
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged installs when node_modules was deleted', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = jest.fn();
  await installIfPackageJsonChanged({ directory: baseDir, install });
  fs.rmSync(path.join(baseDir, 'node_modules'), { recursive: true, force: true });
  const installed = await installIfPackageJsonChanged({ directory: baseDir, install });
  expect(installed).toBe(true);
  expect(install).toHaveBeenCalledTimes(2);
});

test('installIfPackageJsonChanged does not write the hash when install throws', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  const install = jest.fn(() => {
    throw new Error('Install failed.');
  });
  await expect(installIfPackageJsonChanged({ directory: baseDir, install })).rejects.toThrow(
    'Install failed.'
  );
  expect(fs.existsSync(path.join(baseDir, 'node_modules', '.lowdefy-install-hash'))).toBe(false);
});

test('installIfPackageJsonChanged throws when package.json is missing', async () => {
  const install = jest.fn();
  await expect(installIfPackageJsonChanged({ directory: baseDir, install })).rejects.toThrow(
    `Could not read package.json in ${baseDir}.`
  );
  expect(install).not.toHaveBeenCalled();
});

test('installIfPackageJsonChanged throws when directory is not a string', async () => {
  await expect(
    installIfPackageJsonChanged({ directory: undefined, install: jest.fn() })
  ).rejects.toThrow('installIfPackageJsonChanged requires a directory string.');
});

test('installIfPackageJsonChanged throws when install is not a function', async () => {
  fs.writeFileSync(path.join(baseDir, 'package.json'), '{"dependencies":{}}');
  await expect(
    installIfPackageJsonChanged({ directory: baseDir, install: undefined })
  ).rejects.toThrow('installIfPackageJsonChanged requires an install function.');
});
