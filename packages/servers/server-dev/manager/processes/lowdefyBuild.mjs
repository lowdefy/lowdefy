/*
  Copyright 2020-2024 Lowdefy, Inc

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
import build from '@lowdefy/build';
import createCustomPluginTypesMap from '../utils/createCustomPluginTypesMap.mjs';

function lowdefyBuild({ directories, logger, options }) {
  // Persistent state for incremental builds
  const buildState = {
    dependencyGraph: new Map(),
    parsedContentCache: new Map(),
  };

  return async ({ changedFiles = [] } = {}) => {
    const isIncremental = changedFiles.length > 0 && buildState.dependencyGraph.size > 0;
    if (isIncremental) {
      logger.info(
        { print: 'spin' },
        `Rebuilding config (${changedFiles.length} file(s) changed)...`
      );
    } else {
      logger.info({ print: 'spin' }, 'Building config...');
      // Clear caches for full rebuild
      buildState.dependencyGraph.clear();
      buildState.parsedContentCache.clear();
    }

    // Convert absolute paths to relative paths (relative to config directory)
    const relativeChangedFiles = changedFiles.map((filePath) =>
      path.relative(directories.config, filePath)
    );

    const customTypesMap = await createCustomPluginTypesMap({ directories, logger });
    await build({
      customTypesMap,
      directories,
      logger,
      refResolver: options.refResolver,
      stage: 'dev',
      changedFiles: isIncremental ? relativeChangedFiles : [],
      // Pass persistent state for incremental builds
      buildState,
    });
    logger.info({ print: 'log' }, 'Built config.');
  };
}

export default lowdefyBuild;
