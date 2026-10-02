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
import { type } from '@lowdefy/helpers';
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
// roots, and every other file the build reads (found in the build's ref maps).
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
      // A lowdefy.yaml that cannot be read, such as one with a YAML syntax
      // error, has no version to compare. The config build still runs, so the
      // build status reports the error instead of the last build's result.
      const lowdefyVersion = await getLowdefyVersion(context).catch(() => null);
      if (
        !type.isNone(lowdefyVersion) &&
        lowdefyVersion !== context.version &&
        lowdefyVersion !== 'local'
      ) {
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
        // In this batch, so a build-status wait also waits for the restart
        // the build needs (a new connection type, a new plugin package).
        await context.syncServer();
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
    onBusy: context.buildActivity.setBusy,
    ignorePaths: [
      '**/node_modules/**',
      ...context.options.watchIgnore.map(fixRelativePathConfigDir),
    ],
    watchPaths: watchRoots,
  });

  // The config build writes refMap.json and each JIT page build writes a new
  // file to jitMaps/, so the files they read outside the watched directories
  // are added as they appear. Only the changed maps files are read.
  const buildDirectory = context.directories.build;
  const jitMapsDirectory = path.join(buildDirectory, 'jitMaps');
  const watchBuildFilesOutsideWatch = (mapsFiles) => {
    configWatcher.add(findBuildFilesOutsideWatch({ mapsFiles, configDirectory, watchRoots }));
  };
  watchBuildFilesOutsideWatch([path.join(buildDirectory, 'refMap.json')]);
  const isMapsFile = (filePath) =>
    filePath === buildDirectory ||
    filePath === path.join(buildDirectory, 'refMap.json') ||
    filePath === jitMapsDirectory ||
    (path.dirname(filePath) === jitMapsDirectory && filePath.endsWith('.json'));
  const mapsWatcher = await setupWatcher({
    callback: (filePaths) => watchBuildFilesOutsideWatch([...new Set(filePaths.flat())]),
    context,
    // The build directory is watched rather than jitMaps/ itself, which does
    // not exist until the first page build; everything else in it is ignored.
    ignorePaths: [(filePath) => !isMapsFile(filePath)],
    watchDotfiles: true,
    watchPaths: [buildDirectory],
  });

  return {
    close: () => Promise.all([configWatcher.close(), mapsWatcher.close()]),
  };
}

export default lowdefyBuildWatcher;
