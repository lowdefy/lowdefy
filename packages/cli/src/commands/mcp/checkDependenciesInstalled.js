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
import findPackageManager from '../hub/findPackageManager.js';

function listsLowdefy({ directory }) {
  const packageJsonPath = path.join(directory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return Boolean(packageJson.dependencies?.lowdefy ?? packageJson.devDependencies?.lowdefy);
}

// Any package.json from the app up to its checkout root: a monorepo often
// declares lowdefy once, at the workspace root.
function declaresLowdefy({ configDirectory, root }) {
  for (let directory = configDirectory; ; directory = path.dirname(directory)) {
    if (listsLowdefy({ directory })) {
      return true;
    }
    if (directory === root || directory === path.dirname(directory)) {
      return false;
    }
  }
}

// A fresh git worktree has no node_modules. Its dev script would fail with
// "lowdefy: command not found" in a log the agent has to go and read; say what
// to run instead. Only an app whose checkout lists lowdefy in a package.json
// is checked - one whose dev script brings its own lowdefy (npx, a global
// install) is left to run. Runs in the shim, not the hub, so it follows the
// session's own lowdefy version rather than whichever started the hub.
function checkDependenciesInstalled({ configDirectory, root }) {
  if (!declaresLowdefy({ configDirectory, root })) {
    return;
  }
  if (findInstalledCli({ configDirectory, root }) !== null) {
    return;
  }
  const { directory, packageManager } = findPackageManager({ configDirectory, root });
  // Yarn Plug'n'Play installs without node_modules.
  if (fs.existsSync(path.join(directory, '.pnp.cjs'))) {
    return;
  }
  throw new Error(
    `The dependencies of ${configDirectory} are not installed: a package.json in its checkout lists lowdefy, but no node_modules in ${root} has it. Run \`${packageManager} install\` in ${directory}, then start the dev server again.`
  );
}

export default checkDependenciesInstalled;
