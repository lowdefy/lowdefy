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

import findPackageManager from './findPackageManager.js';

let base;
let root;

function write(relativePath, content = '') {
  const filePath = path.join(base, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

beforeEach(() => {
  base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-package-manager-')));
  root = path.join(base, 'repo');
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

test.each([
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
])('findPackageManager maps %s at the workspace root to %s', (lockfile, packageManager) => {
  write(`repo/${lockfile}`);
  const configDirectory = path.join(root, 'apps', 'main');
  fs.mkdirSync(configDirectory, { recursive: true });

  expect(findPackageManager({ configDirectory, root })).toEqual({
    directory: root,
    packageManager,
  });
});

test('findPackageManager takes the nearest lockfile', () => {
  write('repo/pnpm-lock.yaml');
  write('repo/apps/main/package-lock.json');
  const configDirectory = path.join(root, 'apps', 'main');

  expect(findPackageManager({ configDirectory, root })).toEqual({
    directory: configDirectory,
    packageManager: 'npm',
  });
});

test('findPackageManager prefers the packageManager field over a lockfile', () => {
  write('repo/package.json', JSON.stringify({ packageManager: 'pnpm@9.1.0+sha512.abc' }));
  write('repo/apps/main/package-lock.json');
  const configDirectory = path.join(root, 'apps', 'main');

  expect(findPackageManager({ configDirectory, root })).toEqual({
    directory: root,
    packageManager: 'pnpm',
  });
});

test('findPackageManager ignores a packageManager field naming an unknown tool', () => {
  write('repo/package.json', JSON.stringify({ packageManager: 'something@1.0.0' }));
  write('repo/yarn.lock');

  expect(findPackageManager({ configDirectory: root, root })).toEqual({
    directory: root,
    packageManager: 'yarn',
  });
});

test('findPackageManager ignores a lockfile above the checkout root and falls back to npm in the app', () => {
  write('pnpm-lock.yaml');
  write('package.json', JSON.stringify({ packageManager: 'yarn@4.1.0' }));
  const configDirectory = path.join(root, 'apps', 'main');
  fs.mkdirSync(configDirectory, { recursive: true });

  expect(findPackageManager({ configDirectory, root })).toEqual({
    directory: configDirectory,
    packageManager: 'npm',
  });
});
