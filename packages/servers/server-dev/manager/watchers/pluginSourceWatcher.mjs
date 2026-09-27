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
import listServerSidePackages from './listServerSidePackages.mjs';
import readPluginDefinitions from '../utils/readPluginDefinitions.mjs';
import selectLocalPluginPackages from './selectLocalPluginPackages.mjs';
import setupWatcher from '../utils/setupWatcher.mjs';

function isInside({ filePath, dir }) {
  const relative = path.relative(dir, filePath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

// A local plugin's code can change while the dev server runs, and nothing
// else watches it when it lives outside the config directory. The config
// build reads each plugin's type list, so any change rebuilds - which also
// clears a build a broken plugin failed. The server process caches the
// modules of server-side types (requests, connections, operators, ...), so a
// change to a plugin that has them also restarts the server; client code
// is Vite's to hot-replace. The package is watched whole: a plugin may be
// imported from its sources or from a build output its own watcher writes.
async function pluginSourceWatcher(context) {
  const plugins = await readPluginDefinitions({ directories: context.directories });
  const packages = selectLocalPluginPackages({
    directories: context.directories,
    packageNames: plugins.map((plugin) => plugin.name),
  });
  if (packages.length === 0) {
    return undefined;
  }

  const callback = async (filePaths) => {
    const changedFiles = filePaths.flat();
    const customTypesMap = JSON.parse(
      fs.readFileSync(path.join(context.directories.build, 'customTypesMap.json'), 'utf8')
    );
    const serverSide = listServerSidePackages({ customTypesMap });
    const restart = packages.some(
      ({ package: packageName, dir }) =>
        serverSide.has(packageName) && changedFiles.some((filePath) => isInside({ filePath, dir }))
    );
    context.logger.info({ spin: 'start' }, 'Local plugin source changed, rebuilding.');
    try {
      await context.lowdefyBuild();
    } finally {
      await context.syncServer({ restart });
      await context.reloadClients();
    }
  };

  return setupWatcher({
    callback,
    context,
    onBusy: context.buildActivity.setBusy,
    ignorePaths: ['**/node_modules/**'],
    watchPaths: packages.map(({ dir }) => dir),
  });
}

export default pluginSourceWatcher;
