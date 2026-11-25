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
import { buildEndpointsJit, findEndpointsReadingFiles } from '@lowdefy/build/dev';
import { writeFileAtomic } from '@lowdefy/node-utils';

import writeBuildStatus from '../utils/writeBuildStatus.mjs';

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatEndpoints(endpointIds) {
  if (endpointIds.length === 1) return `endpoint "${endpointIds[0]}"`;
  return `${endpointIds.length} endpoints`;
}

// Rebuilds the endpoints edited skeleton source files feed, without a config
// build, when only endpoints read those files (buildEndpointsJit). Resolves
// true once the endpoints and the build status are written, and false when the
// config must be built instead: the last config build failed, a file is read
// by more than endpoints, or the edit could reach past the endpoints'
// artifacts. A false build writes nothing.
function lowdefyEndpointBuild(context) {
  const { directories, logger } = context;
  async function build({ files }) {
    if (context.lastBuildFailed || !context.endpointRegistry) {
      return false;
    }
    const endpointIds = findEndpointsReadingFiles({
      endpointRegistry: context.endpointRegistry,
      files,
    });
    if (endpointIds === null) {
      return false;
    }
    const startTime = Date.now();
    const result = await buildEndpointsJit({
      endpointIds,
      endpointRegistry: context.endpointRegistry,
      context: context.buildContext,
      directories: { build: directories.build },
    });
    if (result.fallback) {
      logger.info(`Building config: ${result.fallback}.`);
      return false;
    }
    // The watcher reads it after every batch to tell skeleton edits from page edits.
    await writeFileAtomic(
      path.join(directories.build, 'skeletonSourceFiles.json'),
      JSON.stringify(result.skeletonSourceFiles)
    );
    await writeBuildStatus({ directories, status: 'ok', errors: [], warnings: result.warnings });
    logger.info(
      `Built ${formatEndpoints(result.endpointIds)} in ${formatDuration(Date.now() - startTime)}.`
    );
    return true;
  }
  return (options) => context.buildQueue(() => build(options));
}

export default lowdefyEndpointBuild;
