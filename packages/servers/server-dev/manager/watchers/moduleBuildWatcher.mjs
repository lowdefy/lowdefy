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
import setupWatcher from '../utils/setupWatcher.mjs';

function moduleBuildWatcher(context) {
  // Collect local module directories from the build context
  const buildContext = context.buildContext;
  if (!buildContext || !buildContext.modules) {
    return Promise.resolve();
  }

  const localModuleRoots = [];
  for (const moduleEntry of Object.values(buildContext.modules)) {
    if (moduleEntry.isLocal) {
      localModuleRoots.push(moduleEntry.moduleRoot);
    }
  }

  if (localModuleRoots.length === 0) {
    return Promise.resolve();
  }

  const callback = async (filePaths) => {
    const changedFiles = filePaths.flat();

    // If module.yaml itself changed, do a full shallow rebuild (module exports may have changed)
    const moduleYamlChanged = changedFiles.some(
      (filePath) => path.basename(filePath) === 'module.yaml'
    );

    try {
      if (moduleYamlChanged) {
        context.logger.info('module.yaml changed, running full shallow rebuild.');
        await context.lowdefyBuild();
      } else {
        // Module page content changed — invalidate all pages so JIT rebuilds them
        const invalidatePath = path.join(context.directories.build, 'invalidatePages');
        fs.writeFileSync(invalidatePath, String(Date.now()));
        context.logger.info('Module files changed, invalidated all pages.');
      }
    } catch (error) {
      context.logger.error(error);
    } finally {
      await context.reloadClients();
    }
  };

  return setupWatcher({
    callback,
    context,
    ignorePaths: ['**/node_modules/**'],
    watchPaths: localModuleRoots,
  });
}

export default moduleBuildWatcher;
