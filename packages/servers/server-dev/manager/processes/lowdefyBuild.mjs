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

import { serializeBuildException, shallowBuild } from '@lowdefy/build/dev';
import createCustomPluginMessagesMap from '../utils/createCustomPluginMessagesMap.mjs';
import createCustomPluginTypesMap from '../utils/createCustomPluginTypesMap.mjs';
import writeBuildStatus from '../utils/writeBuildStatus.mjs';

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function lowdefyBuild({ directories, logger, options }) {
  return async () => {
    logger.info({ spin: 'start' }, 'Building config...');
    const startTime = Date.now();
    const customTypesMap = await createCustomPluginTypesMap({ directories, logger });
    const customMessagesMap = await createCustomPluginMessagesMap({ directories, logger });

    let result;
    try {
      result = await shallowBuild({
        customMessagesMap,
        customTypesMap,
        directories,
        logger,
        refResolver: options.refResolver,
        stage: 'dev',
      });
    } catch (error) {
      // Write the artifact after the attempt fails - the build may have
      // cleaned the build directory before failing, so this must not run
      // before the attempt completes.
      await writeBuildStatus({
        directories,
        status: 'error',
        errors: error.errors ?? [{ message: error.message }],
        warnings: error.warnings ?? [],
      });
      throw error;
    }

    await writeBuildStatus({
      directories,
      status: 'ok',
      errors: [],
      warnings: (result.context.warnings ?? []).map(serializeBuildException),
    });

    // Return result so getContext can store registries
    const duration = Date.now() - startTime;
    logger.info({ spin: 'succeed' }, `Built config in ${formatDuration(duration)}.`);
    return result;
  };
}

export default lowdefyBuild;
