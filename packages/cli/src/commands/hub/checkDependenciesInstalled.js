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

import findInstalledCli from '../../utils/findInstalledCli.js';
import findPackageManager from './findPackageManager.js';

function declaresLowdefy({ configDirectory }) {
  const packageJsonPath = path.join(configDirectory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return Boolean(packageJson.dependencies?.lowdefy ?? packageJson.devDependencies?.lowdefy);
}

// A fresh git worktree has no node_modules. Its dev script would fail with
// "lowdefy: command not found" in a log the agent has to go and read; say what
// to run instead. Only an app that lists lowdefy in its package.json is
// checked - one whose dev script brings its own lowdefy (npx, a global
// install) is left to run.
function checkDependenciesInstalled({ configDirectory }) {
  if (!declaresLowdefy({ configDirectory }) || findInstalledCli({ configDirectory }) !== null) {
    return;
  }
  const { directory, packageManager } = findPackageManager({ configDirectory });
  throw new Error(
    `The dependencies of ${configDirectory} are not installed: its package.json lists lowdefy, but no node_modules has it. Run \`${packageManager} install\` in ${directory}, then start the dev server again.`
  );
}

export default checkDependenciesInstalled;
