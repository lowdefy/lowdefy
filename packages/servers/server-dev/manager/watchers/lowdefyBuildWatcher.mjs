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
import getLowdefyVersion from '../utils/getLowdefyVersion.mjs';
import setupWatcher from '../utils/setupWatcher.mjs';

function lowdefyBuildWatcher(context) {
  const fixRelativePathConfigDir = (item) =>
    path.isAbsolute(item) ? item : path.resolve(context.directories.config, item);

  const callback = async (filePaths) => {
    const changedFiles = filePaths
      .flat()
      .map((filePath) => path.relative(context.directories.config, filePath));

    const lowdefyYamlModified = changedFiles.some(
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
      // Check if only page-level files changed (targeted invalidation)
      const isSkeletonChange =
        lowdefyYamlModified ||
        changedFiles.some(
          (f) =>
            !context.fileDependencyMap?.has(f) && !f.startsWith('pages/') && !f.startsWith('./')
        );

      if (isSkeletonChange || !context.pageCache) {
        // Full skeleton rebuild
        await context.lowdefyBuild();
      } else {
        // Targeted invalidation: only clear affected pages
        const affectedPages = context.pageCache.invalidateByFiles(
          changedFiles,
          context.fileDependencyMap
        );
        if (affectedPages.size > 0) {
          // Write invalidated page IDs to a file so the Next.js server process
          // (which has its own PageCache) knows which pages to rebuild.
          const invalidationPath = path.join(context.directories.build, 'invalidatePages.json');
          fs.writeFileSync(invalidationPath, JSON.stringify([...affectedPages]));
          context.logger.ui.log(
            `Invalidated ${affectedPages.size} page(s): ${[...affectedPages].join(', ')}`
          );
        } else {
          // Unknown file changed - do full rebuild to be safe
          await context.lowdefyBuild();
        }
      }
      context.reloadClients();
    } catch (error) {
      context.logger.error(error);
    }
  };
  return setupWatcher({
    callback,
    context,
    ignorePaths: [
      '**/node_modules/**',
      ...context.options.watchIgnore.map(fixRelativePathConfigDir),
    ],
    watchPaths: [
      context.directories.config,
      ...context.options.watch.map(fixRelativePathConfigDir),
    ],
  });
}

export default lowdefyBuildWatcher;
