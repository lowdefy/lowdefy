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
import selectWatchedPluginPackages from './selectWatchedPluginPackages.mjs';
import setupWatcher from '../utils/setupWatcher.mjs';

function readCustomTypesMap(buildDirectory) {
  const filePath = path.join(buildDirectory, 'customTypesMap.json');
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    // The build rewrites the map on every run; a read mid-write is answered by
    // the completed write's own event.
    return {};
  }
}

function selectWatchDirs(context) {
  return selectWatchedPluginPackages({
    configDirectory: context.directories.config,
    customTypesMap: readCustomTypesMap(context.directories.build),
  }).map(({ watchDir }) => watchDir);
}

// serverArtifactWatcher restarts when the registered type list changes. A local
// plugin whose implementation changes without changing that list touches no
// tracked artifact, so the server keeps serving the stale module from its ESM
// cache. Watch what the server actually imports from the linked plugin - its
// entry point, which for a package with a build step is dist/, so the restart
// lands on the code that will be loaded rather than on a stale build.
//
// customTypesMap.json is watched too: a plugin package added mid-session is not
// in the map read at startup, and re-reading on the map's own change picks it
// up without restarting the manager.
function pluginSourceWatcher(context) {
  const mapPath = path.join(context.directories.build, 'customTypesMap.json');
  let watchDirs = selectWatchDirs(context);
  let watcher;

  const callback = async (changes) => {
    const changed = changes.flat();
    if (changed.length > 0 && changed.every((filePath) => filePath === mapPath)) {
      const next = selectWatchDirs(context);
      const added = next.filter((dir) => !watchDirs.includes(dir));
      watchDirs = next;
      if (added.length === 0) {
        // Every build rewrites the map; the same package list is not news.
        return;
      }
      watcher.add(added);
      context.logger.info(`Watching local plugin build output: ${added.join(', ')}.`);
      return;
    }
    context.logger.info({ spin: 'start' }, 'Local plugin source changed, restarting server.');
    await context.restartServer();
  };

  return setupWatcher({
    callback,
    context,
    ignorePaths: ['**/node_modules/**'],
    watchPaths: [mapPath, ...watchDirs],
  }).then((created) => {
    watcher = created;
    return created;
  });
}

export default pluginSourceWatcher;
