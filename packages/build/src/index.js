/* eslint-disable no-console */

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

import { BuildError, ConfigError, LowdefyInternalError } from '@lowdefy/errors';
import { moduleLockfileName, readModuleLockfile, writeModuleLockfile } from '@lowdefy/node-utils';

import check from './check.js';
import checkAgainst from './check/checkAgainst.js';
import collectAppIds from './check/collectAppIds.js';
import runChecks from './checks/index.js';
import createContext from './createContext.js';
import createPluginTypesMap from './utils/createPluginTypesMap.js';
import addFilePluginTypes from './build/filePlugins/addFilePluginTypes.js';
import copyFilePlugins from './build/filePlugins/copyFilePlugins.js';
import discoverFilePlugins from './build/filePlugins/discoverFilePlugins.js';
import loadFilePluginBlockSchemas from './build/filePlugins/loadFilePluginBlockSchemas.js';
import logCollectedErrors from './utils/logCollectedErrors.js';
import makeId from './utils/makeId.js';
import serializeBuildException from './utils/serializeBuildException.js';
import tryBuildStep from './utils/tryBuildStep.js';

import addDefaultPages from './build/addDefaultPages/addDefaultPages.js';
import addKeys from './build/addKeys.js';
import buildAgents from './build/buildAgents.js';
import buildApp from './build/buildApp.js';
import buildAppMeta from './build/buildAppMeta.js';
import buildAuth from './build/buildAuth/buildAuth.js';
import buildCollections from './build/buildCollections.js';
import buildComponents from './build/buildComponents.js';
import buildConnections from './build/buildConnections.js';
import buildApi from './build/buildApi/buildApi.js';
import buildMigrations from './build/buildMigrations/buildMigrations.js';
import buildImports from './build/buildImports/buildImports.js';
import buildJs from './build/full/buildJs.js';
import buildLogger from './build/buildLogger.js';
import buildMcp from './build/buildMcp.js';
import buildMenu from './build/buildMenu.js';
import buildModuleDefs from './build/buildModuleDefs.js';
import { resolveModuleManifests } from './build/registerModules.js';
import buildModules from './build/buildModules.js';
import buildNotifications from './build/buildNotifications.js';
import precomputeRuntimeOperators from './build/buildRefs/precomputeRuntimeOperators.js';
import buildPages from './build/full/buildPages.js';
import loadBlockSchemas from './build/loadBlockSchemas.js';
import buildRefs from './build/buildRefs/buildRefs.js';
import resolveAuthConfigProjection from './build/buildAuth/resolveAuthConfigProjection.js';
import buildWebsockets from './build/buildWebsockets.js';
import collectPageContent from './build/collectPageContent.js';
import buildTypes from './build/buildTypes.js';
import cleanBuildDirectory from './build/cleanBuildDirectory.js';
import copyAgentFileSystems from './build/copyAgentFileSystems.js';
import copyPublicFolder from './build/copyPublicFolder.js';
import testSchema from './build/testSchema.js';
import updateServerPackageJson from './build/full/updateServerPackageJson.js';
import validateCallAgentSteps from './build/validateCallAgentSteps.js';
import validateConfig from './build/validateConfig.js';
import validateDeprecatedStyles from './build/validateDeprecatedStyles.js';
import validateRenderNotificationSteps from './build/validateRenderNotificationSteps.js';
import writeAgents from './build/writeAgents.js';
import writeApp from './build/writeApp.js';
import writeAppMeta from './build/writeAppMeta.js';
import writeAuth from './build/writeAuth.js';
import writeConfig from './build/writeConfig.js';
import writeCollections from './build/writeCollections.js';
import writeComponentDefs from './build/writeComponentDefs.js';
import writeConnections from './build/writeConnections.js';
import writeApi from './build/writeApi.js';
import writeMigrations from './build/buildMigrations/writeMigrations.js';
import writeGlobal from './build/writeGlobal.js';
import writeJourneyCoverage from './build/writeJourneyCoverage.js';
import writeMcp from './build/writeMcp.js';
import writeWebsockets from './build/writeWebsockets.js';
import codegenI18nLocales from './build/codegenI18nLocales.js';
import writeI18n from './build/writeI18n.js';
import writeTheme from './build/writeTheme.js';
import copyJsModules from './build/buildJs/copyJsModules.js';
import writeJs from './build/buildJs/writeJs.js';
import writeLogger from './build/writeLogger.js';
import writeMaps from './build/writeMaps.js';
import writeMenus from './build/writeMenus.js';
import writeMonitors from './build/buildMonitors/writeMonitors.js';
import writeNotifications from './build/writeNotifications.js';
import writePages from './build/full/writePages.js';
import writePluginImports from './build/writePluginImports/writePluginImports.js';
import writeRequests from './build/full/writeRequests.js';
import writeTypes from './build/full/writeTypes.js';

async function build(options) {
  // Reset makeId counter for each build (dev server may run multiple builds)
  makeId.reset();

  let context;
  try {
    context = createContext(options);

    // Phase 0: Resolve root app metadata into context.appMeta before any
    // operator evaluation. _app / _build.app read this, and buildModuleDefs
    // (next) evaluates operators on root config, consumer vars, and connections.
    await buildAppMeta({ context });
    // Surface bad root metadata (unsupported operators, failed _build.*) now,
    // before module operators evaluate against it — avoids cascade errors.
    logCollectedErrors(context);

    // Phase 1: Build module definitions
    // Parses lowdefy.yaml, resolves module refs, populates context.modules
    await buildModuleDefs({ context });

    // Scoped pre-pass: resolve the auth: subtree and compute the
    // _build.authConfig projection so the operator can resolve during buildRefs.
    await resolveAuthConfigProjection({ context });

    // Step 3 (moved out of buildModuleDefs): full-resolve module manifests now
    // that the projection exists, so module page/api/connection operators like
    // _build.authConfig resolve against it.
    await resolveModuleManifests({ context });

    let components;
    try {
      // Phase 2: Ref resolution (handles _ref: { module, component/menu })
      components = await buildRefs({ context });
    } catch (err) {
      // Root lowdefy.yaml failure still throws from buildRefs — collect it
      if (err instanceof ConfigError) {
        context.errors.push(err);
      } else {
        throw err;
      }
    }
    // Stop if buildRefs collected any errors (YAML parse, missing files, etc.)
    logCollectedErrors(context);

    // Phase 3: Process modules — scopes IDs, merges into components
    buildModules({ components, context });

    // Phase 3.5: Pre-compute static runtime operators (_sum, _if, _string, etc.)
    // whose arguments are fully static. This single fold covers components after
    // module manifests are merged (replacing the old per-region folds in buildRefs,
    // buildModuleDefs, and registerModules). Must run before addKeys so that ~k
    // markers are added to the already-folded tree.
    // context.rootRefDef is the lowdefy.yaml refDef stashed by buildRefs (Phase 2)
    // so we can resolve error source file paths without allocating a new makeId entry.
    components = precomputeRuntimeOperators({
      context,
      input: components,
      refDef: context.rootRefDef,
    });

    // Build steps - collect all errors before stopping
    // addKeys runs first so testSchema has ~k markers for error location info
    tryBuildStep(addKeys, 'addKeys', { components, context });
    // testSchema emits warnings (not errors) — focused validations in each
    // build step provide better error messages with full context
    tryBuildStep(testSchema, 'testSchema', { components, context });

    // Stop if addKeys collected any errors (e.g. invalid ~ignoreBuildChecks)
    logCollectedErrors(context);

    tryBuildStep(buildApp, 'buildApp', { components, context });
    // appMeta is computed in Phase 0; attach it here (where buildApp used to
    // create it) so the following addKeys pass keys it identically.
    components.appMeta = context.appMeta;
    tryBuildStep(buildLogger, 'buildLogger', { components, context });
    tryBuildStep(validateConfig, 'validateConfig', { components, context });
    tryBuildStep(validateDeprecatedStyles, 'validateDeprecatedStyles', { components, context });
    tryBuildStep(addDefaultPages, 'addDefaultPages', { components, context });
    // addKeys runs again to add keys to any new objects created by earlier build steps
    tryBuildStep(addKeys, 'addKeys', { components, context });
    tryBuildStep(buildAuth, 'buildAuth', { components, context });
    tryBuildStep(buildConnections, 'buildConnections', { components, context });
    tryBuildStep(buildCollections, 'buildCollections', { components, context });
    tryBuildStep(buildApi, 'buildApi', { components, context });
    // buildMigrations is async (it reads the migrations/ directory), so it is
    // awaited directly rather than through tryBuildStep; it collects its own
    // errors into context.errors like the wrapped steps do.
    await buildMigrations({ components, context });
    tryBuildStep(buildAgents, 'buildAgents', { components, context });
    tryBuildStep(buildMcp, 'buildMcp', { components, context });
    tryBuildStep(buildWebsockets, 'buildWebsockets', { components, context });
    tryBuildStep(buildNotifications, 'buildNotifications', { components, context });
    // Cross-config step validations — need buildApi (stepIds) and the
    // buildAgents/buildNotifications id sets
    tryBuildStep(validateCallAgentSteps, 'validateCallAgentSteps', { components, context });
    tryBuildStep(validateRenderNotificationSteps, 'validateRenderNotificationSteps', {
      components,
      context,
    });
    // Block schemas must be in context before any block is built (validateBlockProperties).
    await loadBlockSchemas({ components, context });
    tryBuildStep(loadFilePluginBlockSchemas, 'loadFilePluginBlockSchemas', {
      components,
      context,
    });
    // Extract runtime component definitions into context.componentDefs. The
    // definitions stay in the config tree until here so precompute folds build
    // operators in component bodies and testSchema validates the definitions
    // (_prop/_slot survive precompute as registered dynamic identifiers), and
    // so the block-type collision check reads a populated context.blockMetas.
    // Expansion re-inserts a body per use site in buildBlock.
    tryBuildStep(buildComponents, 'buildComponents', { components, context });
    tryBuildStep(buildPages, 'buildPages', { components, context });
    tryBuildStep(buildMenu, 'buildMenu', { components, context });
    // Collect page content strings for Tailwind to scan. Must run before
    // buildJs — jsMapParser replaces _js source with hashes, and class
    // candidates used only inside _js source would otherwise never be scanned.
    context.tailwindContentMap = new Map();
    for (const page of components.pages ?? []) {
      const content = collectPageContent([page]);
      if (content) {
        context.tailwindContentMap.set(page.pageId, content);
      }
    }
    tryBuildStep(buildJs, 'buildJs', { components, context });
    tryBuildStep(buildTypes, 'buildTypes', { components, context });
    tryBuildStep(buildImports, 'buildImports', { components, context });
    tryBuildStep(runChecks, 'checks', { components, context });
    // Final addKeys pass to ensure all objects (including those created by build steps) have ~k
    tryBuildStep(addKeys, 'addKeys', { components, context });

    // Check if there are any collected errors before writing
    logCollectedErrors(context);

    // `lowdefy check` stops here: every validation has run and nothing is written.
    if (context.validateOnly) {
      return { errors: [], warnings: (context.warnings ?? []).map(serializeBuildException) };
    }

    // Write steps - only if no errors
    await cleanBuildDirectory({ context });
    await writeApp({ components, context });
    await writeAppMeta({ components, context });
    await writeAuth({ components, context });
    await writeConnections({ components, context });
    await writeCollections({ components, context });
    await writeComponentDefs({ context });
    await writeAgents({ components, context });
    await writeApi({ components, context });
    await writeMigrations({ context });
    await writeMcp({ components, context });
    await writeWebsockets({ components, context });
    await writeNotifications({ components, context });
    await writeRequests({ components, context });
    await writePages({ components, context });
    await writeJourneyCoverage({ components, context });
    await writeConfig({ components, context });
    await writeGlobal({ components, context });
    await writeTheme({ components, context });
    await writeI18n({ components, context });
    await codegenI18nLocales({ components, context });
    await writeLogger({ components, context });
    await writeMonitors({ components, context });
    await writeMaps({ components, context });
    await writeMenus({ components, context });
    await writeTypes({ components, context });
    await writePluginImports({ components, context });
    await writeJs({ components, context });
    await updateServerPackageJson({ components, context });
    await copyPublicFolder({ components, context });
    await copyAgentFileSystems({ components, context });
    await copyJsModules({ context });
    await copyFilePlugins({ context });
  } catch (err) {
    if (err instanceof BuildError) {
      throw err;
    }
    // Unexpected internal error - preserve Lowdefy errors as-is, wrap plain errors
    const lowdefyErr = err.isLowdefyError
      ? err
      : new LowdefyInternalError(err.message, { cause: err });
    if (context) {
      context.handleError(lowdefyErr);
    } else {
      const logger = options.logger ?? console;
      logger.error(lowdefyErr);
    }
    throw new BuildError('Build failed due to internal error. See above for details.');
  }
}

// The CLI's "modules update" command reads and rewrites the same lockfile the
// build owns, and must do it by exactly the same rules.
export {
  addFilePluginTypes,
  check,
  checkAgainst,
  collectAppIds,
  createPluginTypesMap,
  discoverFilePlugins,
  moduleLockfileName,
  readModuleLockfile,
  writeModuleLockfile,
};

export default build;
