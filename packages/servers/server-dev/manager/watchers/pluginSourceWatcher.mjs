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
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// serverArtifactWatcher restarts when the registered type list changes. A local
// plugin whose implementation changes without changing that list touches no
// tracked artifact, so the server keeps serving the stale module from its ESM
// cache. Watch the linked plugin's sources directly.
function pluginSourceWatcher(context) {
  const watched = selectWatchedPluginPackages({
    configDirectory: context.directories.config,
    customTypesMap: readCustomTypesMap(context.directories.build),
  });

  if (watched.length === 0) {
    return Promise.resolve();
  }

  const callback = async () => {
    context.logger.info({ spin: 'start' }, 'Local plugin source changed, restarting server.');
    context.restartServer();
  };

  return setupWatcher({
    callback,
    context,
    ignorePaths: ['**/node_modules/**', '**/dist/**'],
    watchPaths: watched.map(({ dir }) => path.join(dir, 'src')),
  });
}

export default pluginSourceWatcher;
