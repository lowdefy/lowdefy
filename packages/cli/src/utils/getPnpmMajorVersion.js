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

import { execSync } from 'child_process';
import semver from 'semver';
import { type } from '@lowdefy/helpers';

// The major version of the pnpm that installs the server: the pinned pnpm in
// the parent's packageManager, which pnpm and corepack switch to, or else the
// pnpm the CLI runs.
function getPnpmMajorVersion({ directory, packageManager, pnpmCmd }) {
  if (type.isString(packageManager) && packageManager.startsWith('pnpm@')) {
    const pinned = semver.coerce(packageManager.slice('pnpm@'.length));
    if (pinned !== null) {
      return semver.major(pinned);
    }
  }
  const version = execSync(`${pnpmCmd} --version`, { cwd: directory, encoding: 'utf8' });
  return semver.major(semver.coerce(version));
}

export default getPnpmMajorVersion;
