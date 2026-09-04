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

import { serializer } from '@lowdefy/helpers';
import { BuildError, LowdefyInternalError } from '@lowdefy/errors';

import createContext from '../../createContext.js';
import logCollectedErrors from '../../utils/logCollectedErrors.js';
import makeId from '../../utils/makeId.js';
import tryBuildStep from '../../utils/tryBuildStep.js';
import runChecks from '../../checks/index.js';

import addDefaultPages from '../addDefaultPages/addDefaultPages.js';
import addKeys from '../addKeys.js';
import buildApp from '../buildApp.js';
import buildAppMeta from '../buildAppMeta.js';
import buildAuth from '../buildAuth/buildAuth.js';
import buildCollections from '../buildCollections.js';
import buildComponents from '../buildComponents.js';
import buildConnections from '../buildConnections.js';
import buildAgents from '../buildAgents.js';
import buildApi from '../buildApi/buildApi.js';
import buildMigrations from '../buildMigrations/buildMigrations.js';
import buildLogger from '../buildLogger.js';
import buildImports from '../buildImports/buildImports.js';
import loadBlockSchemas from '../loadBlockSchemas.js';
import buildMcp from '../buildMcp.js';
import buildMenu from '../buildMenu.js';
import buildModuleDefs from '../buildModuleDefs.js';
import { resolveModuleManifests } from '../registerModules.js';
import buildModules from '../buildModules.js';
import buildNotifications from '../buildNotifications.js';
import buildRefs from '../buildRefs/buildRefs.js';
import precomputeRuntimeOperators from '../buildRefs/precomputeRuntimeOperators.js';
import resolveAuthConfigProjection from '../buildAuth/resolveAuthConfigProjection.js';
import { serializeRegistry } from '../buildRefs/deferredRegistry.js';
import buildTypes from '../buildTypes.js';
import buildWebsockets from '../buildWebsockets.js';
import validateCallAgentSteps from '../validateCallAgentSteps.js';
import validateRenderNotificationSteps from '../validateRenderNotificationSteps.js';
import cleanBuildDirectory from '../cleanBuildDirectory.js';
import copyAgentFileSystems from '../copyAgentFileSystems.js';
import copyPublicFolder from '../copyPublicFolder.js';
import testSchema from '../testSchema.js';
import validateConfig from '../validateConfig.js';
import writeApp from '../writeApp.js';
import writeAppMeta from '../writeAppMeta.js';
import writeAuth from '../writeAuth.js';
import writeConfig from '../writeConfig.js';
import writeCollections from '../writeCollections.js';
import writeComponentDefs from '../writeComponentDefs.js';
import writeConnections from '../writeConnections.js';
import writeAgents from '../writeAgents.js';
import writeApi from '../writeApi.js';
import writeMigrations from '../buildMigrations/writeMigrations.js';
import writeMcp from '../writeMcp.js';
import writeNotifications from '../writeNotifications.js';
import writeGlobal from '../writeGlobal.js';
import addFilePluginInstalledTypes from '../filePlugins/addFilePluginInstalledTypes.js';
import copyFilePlugins from '../filePlugins/copyFilePlugins.js';
import loadFilePluginBlockSchemas from '../filePlugins/loadFilePluginBlockSchemas.js';
import copyJsModules from '../buildJs/copyJsModules.js';
import writeJs from '../buildJs/writeJs.js';
import writeWebsockets from '../writeWebsockets.js';
import writeLogger from '../writeLogger.js';
import codegenI18nLocales from '../codegenI18nLocales.js';
import writeI18n from '../writeI18n.js';
import writeTheme from '../writeTheme.js';
import writeMaps from '../writeMaps.js';
import updateServerPackageJson from '../full/updateServerPackageJson.js';
import writeMenus from '../writeMenus.js';
import writeTypes from '../full/writeTypes.js';
import writePageRegistry from './writePageRegistry.js';
import writePluginImports from '../writePluginImports/writePluginImports.js';

import addInstalledTypes from './addInstalledTypes.js';
import buildJsShallow from './buildJsShallow.js';
import buildShallowPages from './buildShallowPages.js';
import collectPageContent from '../collectPageContent.js';
import collectSkeletonSourceFiles from './collectSkeletonSourceFiles.js';
import writeSourcelessPages from './writeSourcelessPages.js';

async function shallowBuild(options) {
  makeId.reset();

  let context;
  try {
    context = createContext(options);

    // Phase 0: Resolve root app metadata before any operator evaluation.
    await buildAppMeta({ context });
    // Surface bad root metadata before module operators evaluate against it.
    logCollectedErrors(context);

    // Phase 1: Build module definitions
    await buildModuleDefs({ context });

    // Scoped pre-pass: resolve the auth: subtree and compute the
    // _build.authConfig projection so the operator can resolve during buildRefs
    // and the dev server's JIT page walks (matches the full build in index.js).
    await resolveAuthConfigProjection({ context });

    // Step 3 (moved out of buildModuleDefs): full-resolve module manifests now
    // that the projection exists (matches the full build in index.js).
    await resolveModuleManifests({ context });

    let components;
    try {
      // Phase 2: Ref resolution (with shallow options)
      components = await buildRefs({
        context,
        shallowOptions: true,
      });
    } catch (err) {
      if (err.isLowdefyError) {
        context.handleError(err);
        throw new BuildError('Build failed with 1 error(s). See above for details.');
      }
      throw err;
    }

    // Stop early if buildRefs collected errors (e.g., YAML parse errors).
    // Failed _ref resolutions leave null entries in arrays — logging now
    // surfaces the real error before downstream code crashes on nulls.
    logCollectedErrors(context);

    // Phase 3: Process modules — scopes IDs, merges into components
    buildModules({ components, context });
    // Collect skeleton source files while ~r markers still exist on objects.
    const skeletonSourceFiles = collectSkeletonSourceFiles({ components, context });

    // Phase 3.5: Constant-fold static runtime operators, mirroring the full
    // build (index.js). Without this, content preserved at skeleton — inline
    // pages, slot content, module components consumed into them — reaches
    // testSchema (spurious warnings) and the served dev artifacts (broken
    // block ids: the client never operator-evaluates id positions) with raw
    // runtime operators. Ref-backed page content is already stripped here and
    // folds per page in buildPageJit.
    components = precomputeRuntimeOperators({
      context,
      input: components,
      refDef: context.rootRefDef,
    });

    // addKeys + testSchema first for error location info
    tryBuildStep(addKeys, 'addKeys', { components, context });
    tryBuildStep(testSchema, 'testSchema', { components, context });

    logCollectedErrors(context);

    // Collect page content strings for Tailwind to scan.
    // Runs after testSchema so null block entries are caught before walking.
    context.tailwindContentMap = new Map();
    for (const page of components.pages ?? []) {
      const content = collectPageContent([page]);
      if (content) {
        context.tailwindContentMap.set(page.id, content);
      }
    }

    // Build skeleton steps (everything except page content)
    tryBuildStep(buildApp, 'buildApp', { components, context });
    // appMeta is computed in Phase 0; attach it here (where buildApp used to
    // create it) so the following addKeys pass keys it identically.
    components.appMeta = context.appMeta;
    tryBuildStep(buildLogger, 'buildLogger', { components, context });
    tryBuildStep(validateConfig, 'validateConfig', { components, context });
    tryBuildStep(addDefaultPages, 'addDefaultPages', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });
    tryBuildStep(buildAuth, 'buildAuth', { components, context });
    tryBuildStep(buildConnections, 'buildConnections', { components, context });
    tryBuildStep(buildCollections, 'buildCollections', { components, context });
    tryBuildStep(buildApi, 'buildApi', { components, context });
    // Async (reads migrations/ and the stage ledger); collects its own errors
    // into context.errors like the wrapped steps do. Match the full build.
    await buildMigrations({ components, context });
    tryBuildStep(buildAgents, 'buildAgents', { components, context });
    tryBuildStep(buildMcp, 'buildMcp', { components, context });
    tryBuildStep(buildWebsockets, 'buildWebsockets', { components, context });
    tryBuildStep(buildNotifications, 'buildNotifications', { components, context });
    // Cross-config validations — need buildApi (stepIds) and the buildAgents/
    // buildNotifications id sets. Match the full build (index.js).
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
    // Components are registered after the block schemas so the component-vs-block-type
    // collision check sees every installed block, and after precompute so build
    // operators inside component bodies fold, mirroring the full build. Component
    // files were already collected as skeleton sources above, so a component edit
    // still rebuilds the skeleton and refreshes componentDefs.json.
    tryBuildStep(buildComponents, 'buildComponents', { components, context });
    const { pageRegistry, sourcelessPageArtifacts } = buildShallowPages({ components, context });

    tryBuildStep(buildJsShallow, 'buildJsShallow', { components, context });

    tryBuildStep(buildMenu, 'buildMenu', { components, context });
    tryBuildStep(buildTypes, 'buildTypes', { components, context });

    // Update server package.json before addInstalledTypes so that addInstalledTypes
    // sees the full set of dependencies on every run (not just after the first build).
    // This prevents plugin import files from differing between the initial and
    // subsequent builds, which would trigger unnecessary server restarts.
    await updateServerPackageJson({ components, context });

    tryBuildStep(addInstalledTypes, 'addInstalledTypes', { components, context });
    // A file plugin has no package to be installed, so the JIT dev build counts
    // it here for the same reason addInstalledTypes counts package types.
    tryBuildStep(addFilePluginInstalledTypes, 'addFilePluginInstalledTypes', {
      components,
      context,
    });
    tryBuildStep(buildImports, 'buildImports', { components, context });
    tryBuildStep(runChecks, 'checks', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });

    logCollectedErrors(context);

    // Write all build artifacts
    await cleanBuildDirectory({ context });
    await writeSourcelessPages({ sourcelessPageArtifacts, context });
    await writeApp({ components, context });
    await writeAppMeta({ components, context });
    await writeAuth({ components, context });
    await writeConnections({ components, context });
    await writeCollections({ components, context });
    await writeComponentDefs({ context });
    await writeApi({ components, context });
    await writeMigrations({ context });
    await writeMcp({ components, context });
    await writeAgents({ components, context });
    await writeWebsockets({ components, context });
    await writeNotifications({ components, context });
    await writeConfig({ components, context });
    await writeGlobal({ components, context });
    await writeTheme({ components, context });
    await writeI18n({ components, context });
    await codegenI18nLocales({ components, context });
    await writeLogger({ components, context });
    await writeMaps({ context });
    await context.writeBuildArtifact(
      'connectionIds.json',
      JSON.stringify([...context.connectionIds].sort())
    );
    await context.writeBuildArtifact(
      'websocketIds.json',
      JSON.stringify([...context.websocketIds].sort())
    );
    await context.writeBuildArtifact(
      'skeletonSourceFiles.json',
      JSON.stringify([...skeletonSourceFiles].sort())
    );
    await writeMenus({ components, context });
    // The dev client bundle imports every installed type (addInstalledTypes),
    // so types.json here describes that full bundle — dynamic page content
    // resolution validates fragment types against it at page get.
    await writeTypes({ components, context });
    await writeJs({ context });
    await context.writeBuildArtifact('jsMap.json', JSON.stringify(context.jsMap));
    // JIT page builds (separate process) restore this so serverJsMap.js keeps
    // importing the modules the skeleton build discovered.
    await context.writeBuildArtifact('jsModules.json', JSON.stringify(context.jsModules));
    await context.writeBuildArtifact('idCounter.json', JSON.stringify(makeId.counter));
    await context.writeBuildArtifact(
      'customTypesMap.json',
      JSON.stringify(options.customTypesMap ?? {})
    );
    await context.writeBuildArtifact(
      'customMessagesMap.json',
      JSON.stringify(options.customMessagesMap ?? {})
    );
    // Persist snapshot of installed packages for JIT missing-package detection.
    // Written as a build artifact so JIT builds compare against the skeleton
    // build state, not a potentially-updated package.json (race condition).
    await context.writeBuildArtifact(
      'installedPluginPackages.json',
      JSON.stringify([...(context.installedPackages ?? [])])
    );
    await context.writeBuildArtifact(
      'modules.json',
      serializer.serializeToString(context.modules ?? {})
    );
    // Persist the auth config projection so JIT page builds (separate process)
    // resolve _build.authConfig identically to the skeleton build.
    await context.writeBuildArtifact(
      'authConfigProjection.json',
      JSON.stringify(context.authConfigProjection)
    );
    // Deferred-record bodies referenced by placeholders in modules.json.
    // JIT hydrates the registry from this artifact (hydrateDeferredRecords).
    await context.writeBuildArtifact('deferredRecords.json', serializeRegistry(context));
    await writePluginImports({ components, context });
    // Persist icon imports snapshot for JIT icon detection.
    // When buildPageJit resolves a page, it compares discovered icons against
    // this snapshot and regenerates plugins/icons.js if new icons are found.
    await context.writeBuildArtifact('iconImports.json', JSON.stringify(components.imports.icons));
    await writePageRegistry({ pageRegistry, context });
    await copyPublicFolder({ components, context });
    await copyAgentFileSystems({ components, context });
    await copyJsModules({ context });
    await copyFilePlugins({ context });

    return { components, pageRegistry, context };
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

export default shallowBuild;
