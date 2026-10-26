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

import path from 'path';
import createPluginSourceIgnore from './createPluginSourceIgnore.mjs';
import listServerPluginFiles from './listServerPluginFiles.mjs';
import { clearPluginTypeCache } from '../utils/pluginTypeCache.mjs';
import readPluginDefinitions from '../utils/readPluginDefinitions.mjs';
import selectLocalPluginPackages from './selectLocalPluginPackages.mjs';
import setupWatcher from '../utils/setupWatcher.mjs';

function isInside({ filePath, dir }) {
  const relative = path.relative(dir, filePath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

// The server process caches the modules of server-side types (requests,
// connections, operators, ...), so a change to one of the files it imports
// restarts it. Any other file of the package - a block, an action, a client
// operator - is Vite's to hot-replace, and a restart would only drop the page
// loads and tool calls in flight for the length of a child start. The import
// graph is walked after the build, which rewrites the server's plugin import
// files when a type is added or removed. The graph alone decides, so a
// server file in a plugin that only holds steps, or a helper a connection
// imports from another local plugin, restarts too. A package.json can change
// what the server's imports resolve to, so it restarts for a package the
// server imports from.
function isServerCodeChange({ changedFiles, context, packages }) {
  const { files, unsureDirs } = listServerPluginFiles({
    directories: context.directories,
    packages,
  });
  const serverDirs = packages
    .map(({ dir }) => dir)
    .filter(
      (dir) => unsureDirs.has(dir) || [...files].some((filePath) => isInside({ filePath, dir }))
    );
  return changedFiles.some((filePath) => {
    if (files.has(filePath)) {
      return true;
    }
    const dir = serverDirs.find((serverDir) => isInside({ filePath, dir: serverDir }));
    if (dir === undefined) {
      return false;
    }
    return unsureDirs.has(dir) || path.basename(filePath) === 'package.json';
  });
}

// A local plugin's code can change while the dev server runs, and nothing
// else watches it when it lives outside the config directory. The config
// build reads each plugin's type list, and block source for the page CSS, so
// any change rebuilds - which also clears a build a broken plugin failed.
// Only a change to code the server imports restarts it (see
// isServerCodeChange). Only code files anywhere in the package are
// watched: a plugin may be imported from its sources or from a build output
// its own watcher writes, but non-code files (public/, YAML, Markdown) are
// never plugin code, and a package that is also the config directory writes
// some of them on every build (see createPluginSourceIgnore).
async function pluginSourceWatcher(context) {
  const { plugins } = await readPluginDefinitions({ directories: context.directories });
  const packages = selectLocalPluginPackages({
    directories: context.directories,
    packageNames: plugins.map((plugin) => plugin.name),
  });
  if (packages.length === 0) {
    return undefined;
  }

  const callback = async (filePaths) => {
    const changedFiles = filePaths.flat();
    context.logger.info({ spin: 'start' }, 'Local plugin source changed, rebuilding.');
    // The plugin type cache can not see every file a plugin's types import.
    clearPluginTypeCache();
    try {
      await context.lowdefyBuild();
    } finally {
      await context.syncServer({
        restart: isServerCodeChange({ changedFiles, context, packages }),
      });
      await context.reloadClients();
    }
  };

  return setupWatcher({
    callback,
    context,
    onBusy: context.buildActivity.setBusy,
    ignorePaths: [createPluginSourceIgnore({ directories: context.directories })],
    watchPaths: packages.map(({ dir }) => dir),
  });
}

export default pluginSourceWatcher;
