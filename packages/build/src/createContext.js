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

import { mergeObjects } from '@lowdefy/helpers';

import createBuildHandleError from './utils/createBuildHandleError.js';
import createCounter from './utils/createCounter.js';
import createHandleWarning from './utils/createHandleWarning.js';
import createReadConfigFile from './utils/readConfigFile.js';
import createTypeCounters from './utils/createTypeCounters.js';
import createWriteBuildArtifact from './utils/writeBuildArtifact.js';
import defaultMessagesMap from './defaultMessagesMap.js';
import defaultPackages from './defaultPackages.js';
import defaultTypesMap from './defaultTypesMap.js';
import defaultTypesMapMobile from './defaultTypesMapMobile.js';

function createContext({
  customMessagesMap,
  customTypesMap,
  customTypesMapMobile,
  directories,
  logger,
  refResolver,
  stage = 'prod',
}) {
  const context = {
    defaultPackageNames: new Set(defaultPackages),
    agentIds: new Set(),
    connectionIds: new Set(),
    notificationIds: new Set(),
    websocketIds: new Set(),
    directories,
    errors: [],
    jsMap: {},
    warnings: [],
    keyMap: {},
    logger,
    // Null prototype prevents pollution via attacker-controlled entry.id.
    modules: Object.create(null),
    readConfigFile: createReadConfigFile({ directories }),
    refMap: {},
    refResolver,
    unresolvedRefVars: {},
    seenSourceLines: new Set(),
    stage,
    typeCounters: createTypeCounters(),
    typesMap: mergeObjects([defaultTypesMap, customTypesMap]),
    // Custom plugins register into both maps — usage is counted per target.
    typesMapMobile: mergeObjects([defaultTypesMapMobile, customTypesMapMobile ?? customTypesMap]),
    messagesMap: mergeObjects([defaultMessagesMap, customMessagesMap]),
    writeBuildArtifact: createWriteBuildArtifact({ directories }),
  };

  // Mobile pages count client-side types (blocks, actions, client operators)
  // into their own counters; server-side classes (requests, connections,
  // server operators, ...) share the main counters — the server executes
  // mobile page requests, so their types must reach the server imports.
  context.typeCountersMobile = {
    ...context.typeCounters,
    actions: createCounter(),
    blocks: createCounter(),
    operators: {
      client: createCounter(),
      server: context.typeCounters.operators.server,
    },
  };

  context.blockMetas = context.typesMap.blockMetas ?? {};
  context.blockMetasMobile = context.typesMapMobile.blockMetas ?? {};

  context.handleError = createBuildHandleError({ context });
  context.handleWarning = createHandleWarning({ context });

  return context;
}

export default createContext;
