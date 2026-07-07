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
import createTypeCounters from '../utils/createTypeCounters.js';

function testContext({
  writeBuildArtifact,
  configDirectory,
  readConfigFile,
  logger = {},
  typesMapMobile,
} = {}) {
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
      server: '',
    },
    typeCounters: createTypeCounters(),
    writeBuildArtifact: writeBuildArtifact || (() => {}),
    readConfigFile: readConfigFile || (() => {}),
    refMap: {},
    keyMap: {},
    jsMap: {},
    agentIds: new Set(),
    connectionIds: new Set(),
    websocketIds: new Set(),
  };

  // Mobile counters share server-side counters with the main set (see createContext).
  context.typeCountersMobile = {
    ...context.typeCounters,
    actions: createCounter(),
    blocks: createCounter(),
    operators: {
      client: createCounter(),
      server: context.typeCounters.operators.server,
    },
  };
  context.typesMapMobile = typesMapMobile ?? {
    actions: {},
    blocks: {},
    icons: {},
    blockMetas: {},
    operators: { client: {}, server: {} },
  };
  context.blockMetasMobile = context.typesMapMobile.blockMetas ?? {};

  context.logger = {
    ...defaultLogger,
    ...logger,
  };

  // handleWarning works like a simplified version of the production handleWarning
  context.handleWarning = (warning) => {
    if (warning.prodError && context.stage === 'prod') {
      throw new Error(warning.message);
    }
    context.logger.warn(warning.message);
  };

  // handleError delegates to logger.error
  context.handleError = context.logger.error;

  // No-op stub for demand-driven module entry resolution used by resolveModuleConnectionId.
  // In tests, module entries are already in their final state so no resolution is needed.
  context.ensureEntryConfigResolved = () => Promise.resolve();

  return context;
}

export default testContext;
