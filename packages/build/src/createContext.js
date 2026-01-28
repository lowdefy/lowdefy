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
import { ConfigError, ConfigWarning } from '@lowdefy/errors/build';

import collectExceptions from './utils/collectExceptions.js';
import createCounter from './utils/createCounter.js';
import createReadConfigFile from './utils/readConfigFile.js';
import createWriteBuildArtifact from './utils/writeBuildArtifact.js';
import defaultTypesMap from './defaultTypesMap.js';

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
        client: createCounter('client'),
        server: createCounter('server'),
      },
    },
    typesMap: mergeObjects([defaultTypesMap, customTypesMap]),
    writeBuildArtifact: createWriteBuildArtifact({ directories }),
  };

  // Store context reference on logger so wrapper can access current context on rebuild
  // This allows the wrapper to use fresh seenSourceLines and context each build
  logger._lowdefyContext = context;

  // Wrap logger.warn to handle ConfigWarning or params with deduplication
  // Only wrap once - check for marker to prevent double-wrapping on rebuild
  if (!logger.warn._lowdefyWrapped) {
    const originalWarn = logger.warn.bind(logger);
    const wrappedWarn = (warningOrParams) => {
      // Get current context (updated each build)
      const ctx = logger._lowdefyContext;
      const seen = ctx?.seenSourceLines;

      // Plain pino call
      if (typeof warningOrParams === 'string' || !warningOrParams.message) {
        originalWarn(warningOrParams);
        return;
      }

      // Already a ConfigWarning instance
      if (warningOrParams instanceof ConfigWarning) {
        if (warningOrParams.suppressed) return;
        const dedupKey = warningOrParams.source ?? warningOrParams.message;
        if (seen?.has(dedupKey)) return;
        seen?.add(dedupKey);
        originalWarn({ source: warningOrParams.source }, warningOrParams.message);
        return;
      }

      // Params object - create ConfigWarning with location resolution
      try {
        const warning = new ConfigWarning({ ...warningOrParams, context: ctx });
        if (warning.suppressed) return;
        const dedupKey = warning.source ?? warning.message;
        if (seen?.has(dedupKey)) return;
        seen?.add(dedupKey);
        originalWarn({ source: warning.source }, warning.message);
      } catch (err) {
        if (err instanceof ConfigError) {
          collectExceptions(ctx, err);
        } else {
          throw err;
        }
      }
    };
    wrappedWarn._lowdefyWrapped = true;
    logger.warn = wrappedWarn;
  }
  context.logger = logger;

  return context;
}

export default createContext;
