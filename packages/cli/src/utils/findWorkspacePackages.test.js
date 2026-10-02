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

import findWorkspacePackages from './findWorkspacePackages.js';

let workspaceRoot;

function writePackage(directory, packageJson) {
  fs.mkdirSync(path.join(workspaceRoot, directory), { recursive: true });
  fs.writeFileSync(
    path.join(workspaceRoot, directory, 'package.json'),
    JSON.stringify(packageJson)
  );
}

beforeEach(() => {
  workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-find-workspace-packages-'));
});

afterEach(() => {
  fs.rmSync(workspaceRoot, { recursive: true, force: true });
});

test('findWorkspacePackages maps package names to directories matched by the workspace globs', () => {
  writePackage('.', { name: 'root' });
  writePackage('plugins/plugin-a', { name: '@scope/plugin-a' });
  writePackage('plugins/plugin-a/node_modules/dep', { name: 'dep' });
  writePackage('plugins/test-plugin', { name: 'test-plugin' });
  writePackage('apps/app', { private: true });
  writePackage('other/plugin-b', { name: 'plugin-b' });
  const packages = findWorkspacePackages({
    packages: ['plugins/*', 'apps/*', '!plugins/test-*'],
    workspaceRoot,
  });
  expect(packages).toEqual(
    new Map([
      ['root', workspaceRoot],
      ['@scope/plugin-a', path.join(workspaceRoot, 'plugins/plugin-a')],
    ])
  );
});

test('findWorkspacePackages finds packages under recursive globs but not in node_modules', () => {
  writePackage('packages/nested/plugin-c', { name: 'plugin-c' });
  writePackage('packages/node_modules/dep', { name: 'dep' });
  const packages = findWorkspacePackages({ packages: ['packages/**'], workspaceRoot });
  expect(packages).toEqual(
    new Map([['plugin-c', path.join(workspaceRoot, 'packages/nested/plugin-c')]])
  );
});
