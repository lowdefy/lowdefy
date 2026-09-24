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

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function findWorkspaceRoot(startDir) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

// pnpm no longer reads the "pnpm" field in package.json, and pnpm 11 fails installs
// with ERR_PNPM_IGNORED_BUILDS unless dependency build scripts are allowed in
// pnpm-workspace.yaml. The key differs by version:
// - packages is required by pnpm 9 and 10.0.
// - onlyBuiltDependencies is read by early pnpm 10 versions.
// - allowBuilds is read by pnpm >=10.29 and pnpm 11.
function allowDependencyBuild({ cwd, appPath, dependency }) {
  const appDir = path.join(cwd, appPath);
  const workspaceRoot = findWorkspaceRoot(appDir);
  const targetDir = workspaceRoot ?? appDir;
  const workspacePath = path.join(targetDir, 'pnpm-workspace.yaml');

  const config = workspaceRoot
    ? yaml.load(fs.readFileSync(workspacePath, 'utf8')) ?? {}
    : { packages: ['.'] };

  const onlyBuiltDependencies = config.onlyBuiltDependencies ?? [];
  const allowBuilds = config.allowBuilds ?? {};
  if (onlyBuiltDependencies.includes(dependency) && allowBuilds[dependency] === true) {
    return;
  }

  if (!onlyBuiltDependencies.includes(dependency)) {
    config.onlyBuiltDependencies = [...onlyBuiltDependencies, dependency];
  }
  config.allowBuilds = { ...allowBuilds, [dependency]: true };

  fs.writeFileSync(workspacePath, yaml.dump(config));
  const label = workspaceRoot
    ? 'workspace root pnpm-workspace.yaml'
    : `${appPath}/pnpm-workspace.yaml`;
  console.log(`  ✓ Allowed ${dependency} build scripts in ${label}`);
}

export default allowDependencyBuild;
