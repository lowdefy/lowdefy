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
import findBuildFilesOutsideWatch from '../utils/findBuildFilesOutsideWatch.mjs';
import getLowdefyVersion from '../utils/getLowdefyVersion.mjs';
import loadSkeletonSourceFiles from '../utils/loadSkeletonSourceFiles.mjs';
import setupWatcher from '../utils/setupWatcher.mjs';
import updatePageTailwindCss from '../utils/updatePageTailwindCss.mjs';

function findLocalModuleRoots(context) {
  return Object.values(context.buildContext.modules ?? {})
    .filter((moduleEntry) => moduleEntry.isLocal)
    .map((moduleEntry) => moduleEntry.moduleRoot);
}

// Watches the config directory, the --watch directories and local module
// roots, and every other file the build reads (found in the build's refMap).
// A change to a file that shapes the skeleton (lowdefy.yaml, a
// module.lowdefy.yaml, or a file in skeletonSourceFiles.json) rebuilds the
// config, as does any change after a failed config build; any other change
// invalidates the JIT-built pages.
async function lowdefyBuildWatcher(context) {
  const configDirectory = context.directories.config;
  const fixRelativePathConfigDir = (item) =>
    path.isAbsolute(item) ? item : path.resolve(configDirectory, item);

  const callback = async (filePaths) => {
    const changedFiles = filePaths.flat();
    // Skeleton source files hold app refs relative to the config directory
    // and module refs as absolute paths, so each change is checked both ways.
    const relativeChangedFiles = changedFiles.map((filePath) =>
      path.relative(configDirectory, filePath)
    );

    const lowdefyYamlModified = relativeChangedFiles.some(
      (filePath) => filePath === 'lowdefy.yaml' || filePath === 'lowdefy.yml'
    );
    if (lowdefyYamlModified) {
      const lowdefyVersion = await getLowdefyVersion(context);
      if (lowdefyVersion !== context.version && lowdefyVersion !== 'local') {
        context.shutdownServer();
        context.logger.warn('Lowdefy version changed. You should restart your development server.');
        process.exit();
      }
    }

    try {
      const skeletonSourceFiles = loadSkeletonSourceFiles(context.directories.build);
      const moduleYamlModified = changedFiles.some(
        (filePath) => path.basename(filePath) === 'module.lowdefy.yaml'
      );
      const skeletonFileModified = changedFiles.some(
        (filePath, index) =>
          skeletonSourceFiles.has(filePath) || skeletonSourceFiles.has(relativeChangedFiles[index])
      );

      // skeletonSourceFiles.json comes from the last build that succeeded, so it
      // cannot list a file only the failed build read, such as a new endpoint
      // file whose error is being fixed. While the last build failed, any
      // change rebuilds the config.
      if (
        context.lastBuildFailed ||
        lowdefyYamlModified ||
        moduleYamlModified ||
        skeletonFileModified
      ) {
        await context.lowdefyBuild();
      } else {
        const invalidatePath = path.join(context.directories.build, 'invalidatePages');
        fs.writeFileSync(invalidatePath, String(Date.now()));
        await updatePageTailwindCss({ changedFiles: relativeChangedFiles, context });
        context.logger.info('Page files changed, invalidated all pages.');
      }
    } catch (error) {
      context.logger.error(error);
    } finally {
      await context.reloadClients();
    }
  };

  const watchRoots = [
    configDirectory,
    ...context.options.watch.map(fixRelativePathConfigDir),
    ...findLocalModuleRoots(context),
  ];
  const configWatcher = await setupWatcher({
    callback,
    context,
    onBusy: context.onConfigWatcherBusy,
    ignorePaths: [
      '**/node_modules/**',
      ...context.options.watchIgnore.map(fixRelativePathConfigDir),
    ],
    watchPaths: watchRoots,
  });

  // The config build and every JIT page build rewrite refMap.json, so the
  // files they read outside the watched directories are added as they appear.
  const watchBuildFilesOutsideWatch = () => {
    configWatcher.add(
      findBuildFilesOutsideWatch({
        buildDirectory: context.directories.build,
        configDirectory,
        watchRoots,
      })
    );
  };
  watchBuildFilesOutsideWatch();
  const refMapWatcher = await setupWatcher({
    callback: watchBuildFilesOutsideWatch,
    context,
    watchDotfiles: true,
    watchPaths: [path.join(context.directories.build, 'refMap.json')],
  });

  return {
    close: () => Promise.all([configWatcher.close(), refMapWatcher.close()]),
  };
}

export default lowdefyBuildWatcher;
