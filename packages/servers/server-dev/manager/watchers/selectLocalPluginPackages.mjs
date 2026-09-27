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

// The build imports plugins from the server directory; an app in a pnpm
// workspace also links them into its own node_modules. A published package
// lives inside node_modules and cannot change under a running dev server;
// only a linked local plugin resolves outside it.
function resolveLocalPluginDir({ directories, packageName }) {
  for (const base of [directories.server, directories.config]) {
    const linked = path.join(base, 'node_modules', packageName);
    if (fs.existsSync(linked)) {
      const realPath = fs.realpathSync(linked);
      return realPath.split(path.sep).includes('node_modules') ? null : realPath;
    }
  }
  return null;
}

// The plugins lowdefy.yaml lists that are local packages, whatever kinds of
// types they hold: a block-only plugin's type list is read by the config
// build too, so an edit to it - or a fix to one that broke the build - must
// rebuild.
function selectLocalPluginPackages({ directories, packageNames }) {
  return [...new Set(packageNames)]
    .map((packageName) => ({
      package: packageName,
      dir: resolveLocalPluginDir({ directories, packageName }),
    }))
    .filter(({ dir }) => dir !== null);
}

export default selectLocalPluginPackages;
