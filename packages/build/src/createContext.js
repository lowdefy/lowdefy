/* eslint-disable no-console */

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

import { mergeObjects } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/node-utils';

import createCounter from './utils/createCounter.js';
import createReadConfigFile from './utils/readConfigFile.js';
import createWriteBuildArtifact from './utils/writeBuildArtifact.js';
import defaultTypesMap from './defaultTypesMap.js';

/**
 * Extracts source:line from a formatted message for deduplication.
 * Format: "source:line\n[Config Warning/Error] message"
 * Returns the first line (source:line) as the dedup key.
 */
function getSourceLine(formatted) {
  const newlineIndex = formatted.indexOf('\n');
  return newlineIndex > 0 ? formatted.slice(0, newlineIndex) : formatted;
}

function createContext({ customTypesMap, directories, logger, refResolver, stage = 'prod' }) {
  // Track seen source:line for deduplication (same file:line = same warning, even if different pages)
  const seenSourceLines = new Set();

  // Create context object first (needed for logger methods)
  const context = {
    connectionIds: new Set(),
    directories,
    errors: [],
    jsMap: {},
    keyMap: {},
    logger: null, // Set below
    readConfigFile: createReadConfigFile({ directories }),
    refMap: {},
    refResolver,
    seenSourceLines, // For deduplication by source:line
    stage,
    typeCounters: {
      actions: createCounter(),
      auth: {
        adapters: createCounter(),
        callbacks: createCounter(),
        events: createCounter(),
        providers: createCounter(),
      },
      blocks: createCounter(),
      connections: createCounter(),
      requests: createCounter(),
      controls: createCounter(),
      operators: {
        client: createCounter(),
        server: createCounter(),
      },
    },
    typesMap: mergeObjects([defaultTypesMap, customTypesMap]),
    writeBuildArtifact: createWriteBuildArtifact({ directories }),
  };

  // Add config-aware methods to logger (don't spread - pino uses Symbol-keyed internals)
  logger.configWarning = ({ message, configKey, operatorLocation, prodError, checkSlug }) => {
    try {
      // ConfigWarning.format throws ConfigError in prod mode when prodError is true
      const formatted = ConfigWarning.format({
        message,
        configKey,
        operatorLocation,
        context,
        prodError,
        checkSlug,
      });
      if (formatted) {
        // Deduplicate by source:line only (same file:line = same warning)
        const sourceLine = getSourceLine(formatted);
        if (seenSourceLines.has(sourceLine)) {
          return;
        }
        seenSourceLines.add(sourceLine);
        logger.warn(formatted);
      }
    } catch (err) {
      // ConfigError thrown in prod mode - collect instead of throwing
      // This allows validation to continue and report all errors
      if (err instanceof ConfigError) {
        // Skip suppressed errors (empty message means ~ignoreBuildCheck: true)
        const sourceLine = getSourceLine(err.message);
        if (!err.suppressed && !seenSourceLines.has(sourceLine)) {
          seenSourceLines.add(sourceLine);
          context.errors.push(err.message);
        }
      } else {
        throw err;
      }
    }
  };
  logger.configError = ({ message, configKey, operatorLocation, checkSlug }) => {
    const formatted = ConfigError.format({
      message,
      configKey,
      operatorLocation,
      context,
      checkSlug,
    });
    if (formatted) {
      // Deduplicate by source:line only (same file:line = same warning)
      const sourceLine = getSourceLine(formatted);
      if (seenSourceLines.has(sourceLine)) {
        return;
      }
      seenSourceLines.add(sourceLine);
      logger.error(formatted);
    }
  };
  context.logger = logger;

  return context;
}

export default createContext;
