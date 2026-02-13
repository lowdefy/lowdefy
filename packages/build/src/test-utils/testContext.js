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

import createCounter from '../utils/createCounter.js';

function testContext({ writeBuildArtifact, configDirectory, readConfigFile, logger = {} } = {}) {
  const defaultLogger = {
    info: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
    succeed: () => {},
  };

  const context = {
    stage: 'test',
    directories: {
      config: configDirectory || '',
    },
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
    writeBuildArtifact: writeBuildArtifact || (() => {}),
    readConfigFile: readConfigFile || (() => {}),
    refMap: {},
    keyMap: {},
    jsMap: {},
    connectionIds: new Set(),
  };

  const mergedLogger = {
    ...defaultLogger,
    ...logger,
  };

  // Wrap logger.warn to handle config warning params (like createContext does)
  const originalWarn = mergedLogger.warn;
  context.logger = {
    ...mergedLogger,
    warn: (warningOrParams) => {
      // Plain string or object without message - pass through
      if (typeof warningOrParams === 'string' || !warningOrParams.message) {
        originalWarn(warningOrParams);
        return;
      }
      // Params object with message - handle prodError
      if (warningOrParams.prodError && context.stage === 'prod') {
        throw new Error(warningOrParams.message);
      }
      originalWarn(warningOrParams.message);
    },
  };

  // handleWarning works like the logger.warn wrapper above
  context.handleWarning = (params) => {
    if (params.prodError && context.stage === 'prod') {
      throw new Error(params.message);
    }
    originalWarn(params.message);
  };

  // handleError delegates to logger.error
  context.handleError = mergedLogger.error;

  return context;
}

export default testContext;
