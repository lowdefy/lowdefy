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
import { createRequire } from 'node:module';
import path from 'node:path';

function findPackageDirectory({ file, packageName }) {
  let directory = path.dirname(file);
  while (directory !== path.dirname(directory)) {
    const packageJsonPath = path.join(directory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name === packageName) {
        return { directory, version: packageJson.version };
      }
    }
    directory = path.dirname(directory);
  }
  return null;
}

function resolveFrom({ base, specifier }) {
  try {
    return createRequire(base).resolve(specifier);
  } catch {
    return null;
  }
}

// Where `${packageName}/connections` resolves, without loading it: the build
// package first, then the server directory, the order importPluginModule
// imports in. Returns { directory, version, cacheable }, or null when it does
// not resolve here (the worker then decides). A package outside every
// node_modules folder is a local or linked plugin whose code can change under
// the same version, so it is never cached.
function resolveConnectionPackage({ context, packageName }) {
  const specifier = `${packageName}/connections`;
  const serverDirectory = context.directories?.server;
  const file =
    resolveFrom({ base: import.meta.url, specifier }) ??
    (serverDirectory
      ? resolveFrom({ base: path.join(serverDirectory, 'package.json'), specifier })
      : null);
  if (file === null) {
    return null;
  }
  const found = findPackageDirectory({ file, packageName });
  if (found === null) {
    return null;
  }
  return {
    ...found,
    cacheable: found.directory.split(path.sep).includes('node_modules'),
  };
}

export default resolveConnectionPackage;
