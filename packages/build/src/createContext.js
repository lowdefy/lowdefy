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
import createWriteBuildArtifact from './utils/writeBuildArtifact.js';
import addFilePluginTypes from './build/filePlugins/addFilePluginTypes.js';
import discoverFilePlugins from './build/filePlugins/discoverFilePlugins.js';
import withoutFilePluginTypes from './build/filePlugins/withoutFilePluginTypes.js';
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
  writeModuleLock,
}) {
  // Package plugins are declared and installed; file plugins are found by
  // walking the config directory, so the typesMap cannot be assembled until
  // that walk has run.
  const filePlugins = discoverFilePlugins({ configDirectory: directories?.config });
  const typesMap = mergeObjects([defaultTypesMap, withoutFilePluginTypes(customTypesMap)]);
  // A file plugin never overrides a package type. addFilePluginTypes returns
  // the collisions instead of throwing so buildTypes can report every one.
  const filePluginExceptions = [
    ...filePlugins.errors,
    ...addFilePluginTypes({ records: filePlugins.records, typesMap }),
  ];

  const context = {
    defaultPackageNames: new Set(defaultPackages),
    agentIds: new Set(),
    connectionIds: new Set(),
    notificationIds: new Set(),
    websocketIds: new Set(),
    directories,
    errors: [],
    jsBodies: [],
    pageTypes: {},
    jsMap: {},
    jsModules: { client: {}, server: {} },
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
    validateOnly,
    // Production builds never write into the config directory. "lowdefy modules
    // update" opts in so it can rewrite the entries it invalidated.
    writeModuleLock: writeModuleLock ?? stage !== 'prod',
    typeCounters: {
      actions: createCounter(),
      agents: createCounter(),
      auth: {
        adapters: createCounter(),
        providers: createCounter(),
        strategies: createCounter(),
      },
      blocks: createCounter(),
      connections: createCounter(),
      notifications: createCounter(),
      requests: createCounter(),
      steps: createCounter(),
      websockets: createCounter(),
      controls: createCounter(),
      operators: {
        client: createCounter('client'),
        server: createCounter('server'),
      },
    },
    filePlugins: filePlugins.records,
    filePluginExceptions,
    typesMap,
    messagesMap: mergeObjects([defaultMessagesMap, customMessagesMap]),
  };

  // A check run must never touch the build directory. The no-op makes that
  // structural instead of relying on every validation step to stay write-free.
  if (validateOnly) {
    context.writeBuildArtifact = async () => {};
  } else {
    context.writeBuildArtifact = createWriteBuildArtifact({ directories });
  }

  context.blockMetas = context.typesMap.blockMetas ?? {};

  // Registry of runtime component definitions, keyed by component type name.
  // Populated by buildComponents from the top-level components: list and
  // consumed by expandComponent during buildBlock.
  context.componentDefs = {};

  context.handleError = createBuildHandleError({ context });
  context.handleWarning = createHandleWarning({ context });

  return context;
}

export default createContext;
