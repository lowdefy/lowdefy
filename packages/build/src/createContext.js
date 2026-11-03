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
import createMobileTypeCounters from './utils/createMobileTypeCounters.js';
import createReadConfigFile from './utils/readConfigFile.js';
import createTypeCounters from './utils/createTypeCounters.js';
import createWriteBuildArtifact from './utils/writeBuildArtifact.js';
import mergeTypesMaps from './utils/mergeTypesMaps.js';
import defaultMessagesMap from './defaultMessagesMap.js';
import defaultPackages from './defaultPackages.js';
import defaultTypesMap from './defaultTypesMap.js';
import defaultTypesMapMobile from './defaultTypesMapMobile.js';

function createContext({
  customMessagesMap,
  customTypesMap,
  customTypesMapMobile = {},
  directories,
  logger,
  pluginInstallFollows = false,
  refResolver,
  skipPluginChecks = false,
  stage = 'prod',
  validateOnly = false,
  writeCompressedMaps = false,
}) {
  const context = {
    defaultPackageNames: new Set(defaultPackages),
    agentIds: new Set(),
    connectionIds: new Set(),
    // Set by buildConnections, or restored onto a dev page build
    // (restoreTenantTargets). Empty until then, so a page built without the
    // connections (buildTestPage) gets no tenant checks rather than a crash.
    tenantConnectionIds: new Set(),
    walledTargets: new Map(),
    sharedTargets: new Map(),
    notificationIds: new Set(),
    // config.experimental opt-ins, set by buildExperimental (validateConfig), or restored onto a
    // dev page build. Empty until then: no experimental feature is on.
    experimental: {},
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
    // Set on the build that a plugin install follows (lowdefy build, and the
    // dev server's initial build): the build after the install reports the
    // plugin checks that did not run.
    pluginInstallFollows,
    // Null prototype prevents pollution via attacker-controlled entry.id.
    modules: Object.create(null),
    // Each YAML and JSON config file's parsed tree, by path, with the content it
    // was parsed from (getParsedConfigFile). Dev page builds share it.
    parsedConfigCache: new Map(),
    readConfigFile: createReadConfigFile({ directories }),
    refMap: {},
    refResolver,
    skipPluginChecks,
    unresolvedRefVars: {},
    unsetEnvReads: new Map(),
    seenSourceLines: new Set(),
    stage,
    validateOnly,
    // Set by the production server build scripts: writeMaps also writes
    // keyMap.json.gz and refMap.json.gz, which deploy output ships.
    writeCompressedMaps,
    pageTypeCounters: new Map(),
    // ~ignoreBuildChecks slugs that are not built-in, mapped to the ~k of each
    // node listing them. The plugin rules runner checks them once rules load.
    pluginCheckSlugRefs: new Map(),
    // Each plugin's loaded ./checks, by package. Dev page builds share it.
    pluginChecksCache: new Map(),
    // Each plugin module imported for its schemas, by specifier. Dev page builds share it.
    pluginModuleCache: new Map(),
    typeCounters: createTypeCounters(),
    typesMap: mergeTypesMaps({ defaultTypesMap, customTypesMap }),
    // The client types a native shell carries (defaultPackagesMobile), plus
    // the native types of the shell plugins mobile.shells[].plugins lists
    // (createPluginTypesMapMobile). Mobile pages resolve blocks, actions and
    // client operators against it. Other app plugins do not register into it,
    // since a shell carries no app code. Its plugins key names the shell
    // plugins the server read, which validateShellPluginsListed checks.
    typesMapMobile: mergeObjects([defaultTypesMapMobile, customTypesMapMobile]),
    messagesMap: mergeObjects([defaultMessagesMap, customMessagesMap]),
  };

  context.typeCountersMobile = createMobileTypeCounters({ typeCounters: context.typeCounters });
  context.blockMetas = context.typesMap.blockMetas ?? {};
  context.blockMetasMobile = context.typesMapMobile.blockMetas ?? {};

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
