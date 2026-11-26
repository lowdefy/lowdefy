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
import path from 'node:path';

function readPackageName(directory) {
  const packageJsonPath = path.join(directory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).name ?? null;
}

// Returns packageOf(filePath): the package a file belongs to, as { name, root },
// from the nearest package.json above it that has a name (a package's
// dist/esm/package.json often holds only "type"), or null outside any package.
// Linked @lowdefy/* packages resolve to the checkout's packages/ folders, which
// node_modules paths alone would not name. Folders are read once.
function createPackageResolver() {
  const byDirectory = new Map();
  function resolveDirectory(directory) {
    if (byDirectory.has(directory)) {
      return byDirectory.get(directory);
    }
    const name = readPackageName(directory);
    const parent = path.dirname(directory);
    let found = null;
    if (name !== null) {
      found = { name, root: directory };
    } else if (parent !== directory) {
      found = resolveDirectory(parent);
    }
    byDirectory.set(directory, found);
    return found;
  }
  return function packageOf(filePath) {
    return resolveDirectory(path.dirname(filePath));
  };
}

export default createPackageResolver;
