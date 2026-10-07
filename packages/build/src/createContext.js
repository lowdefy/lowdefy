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
import createHandleWarning from './utils/createHandleWarning.js';
import createImportAppCode from './utils/createImportAppCode.js';
import createReadConfigFile from './utils/readConfigFile.js';
import createTypeCounters from './utils/createTypeCounters.js';
import createWriteBuildArtifact from './utils/writeBuildArtifact.js';
import defaultMessagesMap from './defaultMessagesMap.js';
import defaultPackages from './defaultPackages.js';
import defaultTypesMap from './defaultTypesMap.js';

function createContext({
  customMessagesMap,
  customTypesMap,
  directories,
  logger,
  refResolver,
  stage = 'prod',
  validateOnly = false,
}) {
  const context = {
    defaultPackageNames: new Set(defaultPackages),
    agentIds: new Set(),
    connectionIds: new Set(),
    notificationIds: new Set(),
    websocketIds: new Set(),
    directories,
    // Null prototype: policy ids come from app config.
    dynamicPolicies: Object.create(null),
    errors: [],
    jsMap: {},
    warnings: [],
    importAppCode: createImportAppCode({ directories }),
    keyMap: {},
    logger,
    // Null prototype prevents pollution via attacker-controlled entry.id.
    modules: Object.create(null),
    readConfigFile: createReadConfigFile({ directories }),
    refMap: {},
    refResolver,
    unresolvedRefVars: {},
    unsetEnvReads: new Map(),
    seenSourceLines: new Set(),
    stage,
    validateOnly,
    pageTypeCounters: new Map(),
    typeCounters: createTypeCounters(),
    typesMap: mergeObjects([defaultTypesMap, customTypesMap]),
    messagesMap: mergeObjects([defaultMessagesMap, customMessagesMap]),
  };

  context.blockMetas = context.typesMap.blockMetas ?? {};

  // A check run must never touch the build directory. The no-op makes that
  // structural instead of relying on every validation step to stay write-free.
  if (validateOnly) {
    context.writeBuildArtifact = async () => {};
  } else {
    context.writeBuildArtifact = createWriteBuildArtifact({ directories });
  }

  context.handleError = createBuildHandleError({ context });
  context.handleWarning = createHandleWarning({ context });

  return context;
}

export default createContext;
