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

const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

// The nearest lockfile names the package manager and where it installs; in a
// monorepo it sits at the workspace root, above the app.
function findPackageManager({ configDirectory }) {
  for (
    let directory = configDirectory;
    directory !== path.dirname(directory);
    directory = path.dirname(directory)
  ) {
    const found = LOCKFILES.find(([lockfile]) => fs.existsSync(path.join(directory, lockfile)));
    if (found) {
      return { directory, packageManager: found[1] };
    }
  }
  return { directory: configDirectory, packageManager: 'npm' };
}

export default findPackageManager;
