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
import path from 'path';
import { type } from '@lowdefy/helpers';

const PACKAGE_MANAGERS = new Set(['bun', 'npm', 'pnpm', 'yarn']);

const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
];

// The directories from the app up to its checkout root, never above it: a
// lockfile or package.json above the repository belongs to something else.
function directoriesUpToRoot({ configDirectory, root }) {
  const directories = [];
  for (let directory = configDirectory; ; directory = path.dirname(directory)) {
    directories.push(directory);
    if (directory === root || directory === path.dirname(directory)) {
      return directories;
    }
  }
}

function readPackageManagerField({ directory }) {
  const packageJsonPath = path.join(directory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch {
    return null;
  }
  if (!type.isString(packageJson.packageManager)) {
    return null;
  }
  // corepack form: "pnpm@9.1.0" or "pnpm@9.1.0+sha512...".
  const name = packageJson.packageManager.split('@')[0];
  return PACKAGE_MANAGERS.has(name) ? name : null;
}

// The package manager and the directory it installs in. An agent runs the
// install command this names, so a wrong answer writes a foreign lockfile into
// the repository: the corepack packageManager field wins, then the nearest
// lockfile (in a monorepo it sits at the workspace root, above the app), then
// npm in the app directory.
function findPackageManager({ configDirectory, root }) {
  const directories = directoriesUpToRoot({ configDirectory, root });
  for (const directory of directories) {
    const packageManager = readPackageManagerField({ directory });
    if (packageManager !== null) {
      return { directory, packageManager };
    }
  }
  for (const directory of directories) {
    const found = LOCKFILES.find(([lockfile]) => fs.existsSync(path.join(directory, lockfile)));
    if (found) {
      return { directory, packageManager: found[1] };
    }
  }
  return { directory: configDirectory, packageManager: 'npm' };
}

export default findPackageManager;
