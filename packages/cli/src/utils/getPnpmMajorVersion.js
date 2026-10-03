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

// The pnpm entry of devEngines.packageManager, which names one package
// manager or lists several.
function getDevEnginesPnpm({ packageJson }) {
  const packageManagers = [packageJson.devEngines?.packageManager ?? []].flat();
  return packageManagers.find((packageManager) => packageManager?.name === 'pnpm');
}

// devEngines.packageManager takes a version range; pnpm switches to the
// newest version in it, so the major is only known when the range keeps to
// one.
function getRangeMajor({ range }) {
  if (!type.isString(range) || semver.validRange(range) === null) {
    return null;
  }
  const major = semver.major(semver.minVersion(range));
  const majorRange = `>=${major}.0.0-0 <${major + 1}.0.0-0`;
  if (!semver.subset(range, majorRange, { includePrerelease: true })) {
    return null;
  }
  return major;
}

function getPinnedMajor({ packageJson }) {
  // pnpm reads devEngines.packageManager over packageManager when both are set.
  const devEnginesPnpm = getDevEnginesPnpm({ packageJson });
  if (!type.isNone(devEnginesPnpm)) {
    return getRangeMajor({ range: devEnginesPnpm.version });
  }
  const { packageManager } = packageJson;
  if (type.isString(packageManager) && packageManager.startsWith('pnpm@')) {
    const pinned = semver.coerce(packageManager.slice('pnpm@'.length));
    if (pinned !== null) {
      return semver.major(pinned);
    }
  }
  return null;
}

// The major version of the pnpm that installs the server: the pnpm the
// parent's package.json pins, which pnpm and corepack switch to, or else the
// pnpm the CLI runs.
function getPnpmMajorVersion({ directory, packageJson, pnpmCmd }) {
  const pinnedMajor = getPinnedMajor({ packageJson });
  if (pinnedMajor !== null) {
    return pinnedMajor;
  }
  const version = execSync(`${pnpmCmd} --version`, { cwd: directory, encoding: 'utf8' });
  return semver.major(semver.coerce(version));
}

export default getPnpmMajorVersion;
