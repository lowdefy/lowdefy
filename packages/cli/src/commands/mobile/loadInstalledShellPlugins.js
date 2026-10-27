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

import checkShellPluginSupport from './checkShellPluginSupport.js';

function readInstalledVersion({ name, projectDirectory }) {
  const packageJsonPath = path.join(projectDirectory, 'node_modules', name, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
}

// The "./shell" entries of the plugins a shell lists, from the project
// lowdefy mobile config installed. Fails, saying to run config first, when a
// plugin is not installed there at its listed version.
function loadInstalledShellPlugins({ environment, projectDirectory, shell, shellPackage }) {
  const plugins = shell.plugins ?? [];
  if (plugins.length === 0) {
    return [];
  }
  checkShellPluginSupport({ shell, shellPackage });
  plugins.forEach(({ name, version }) => {
    if (readInstalledVersion({ name, projectDirectory }) !== version) {
      throw new Error(
        `Shell "${shell.id}" plugin "${name}@${version}" is not installed in ${projectDirectory}. Run lowdefy mobile config --shell ${shell.id} --env ${environment} first.`
      );
    }
  });
  return shellPackage.resolveShellPlugins({ shell, require: shellPackage.require });
}

export default loadInstalledShellPlugins;
