import fs from 'node:fs';
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

import { BuildError, ConfigError } from '@lowdefy/errors';

import createContext from './createContext.js';
import createInternalBuildError from './utils/createInternalBuildError.js';
import createPluginTypesMap from './utils/createPluginTypesMap.js';
import createPluginTypesMapMobile from './utils/createPluginTypesMapMobile.js';
import logCollectedErrors from './utils/logCollectedErrors.js';
import makeId from './utils/makeId.js';
import serializeBuildException from './utils/serializeBuildException.js';
import tryBuildStep from './utils/tryBuildStep.js';

import addDefaultPages from './build/addDefaultPages/addDefaultPages.js';
import addKeys from './build/addKeys.js';
import buildAgents from './build/buildAgents.js';
import buildApp from './build/buildApp.js';
import buildAppEvents from './build/buildAppEvents.js';
import buildAppMeta from './build/buildAppMeta.js';
import buildAuth from './build/buildAuth/buildAuth.js';
import buildConnections from './build/buildConnections.js';
import buildDynamicPolicies from './build/buildDynamicPolicies.js';
import buildApi from './build/buildApi/buildApi.js';
import validateApiHtmlLinks from './build/buildApi/validateApiHtmlLinks.js';
import buildImports from './build/buildImports/buildImports.js';
import buildIconContext from './build/icons/buildIconContext.js';
import buildJs from './build/full/buildJs.js';
import buildLogger from './build/buildLogger.js';
import buildMcp from './build/buildMcp.js';
import buildMcpViews from './build/buildMcpViews.js';
import buildMenu from './build/buildMenu.js';
import buildMobile from './build/buildMobile/buildMobile.js';
import buildMobileAppEvents from './build/buildMobile/buildMobileAppEvents.js';
import buildMobileAppJs from './build/buildMobile/buildMobileAppJs.js';
import buildMobileClassMap from './build/buildMobile/buildMobileClassMap.js';
import buildMobilePageIcons from './build/buildMobile/buildMobilePageIcons.js';
import buildMobileTheme from './build/buildMobile/buildMobileTheme.js';
import collectMobileClassCandidates from './build/buildMobile/collectMobileClassCandidates.js';
import buildMobilePageIndex from './build/buildMobile/buildMobilePageIndex.js';
import validateMobileEndpointRefs from './build/buildMobile/validateMobileEndpointRefs.js';
import validateMobileMenuIcons from './build/buildMobile/validateMobileMenuIcons.js';
import validateMobileStyles from './build/buildMobile/validateMobileStyles.js';
import validateNativeIgnoredProperties from './build/buildMobile/validateNativeIgnoredProperties.js';
import buildModuleDefs from './build/buildModuleDefs.js';
import { resolveModuleManifests } from './build/registerModules.js';
import buildModules from './build/buildModules.js';
import buildNotifications from './build/buildNotifications.js';
import precomputeRuntimeOperators from './build/buildRefs/precomputeRuntimeOperators.js';
import buildPageTypes from './build/full/buildPageTypes.js';
import buildPages from './build/full/buildPages.js';
import buildRoutes from './build/buildRoutes/buildRoutes.js';
import clearRuleTargetNodes from './build/pluginChecks/clearRuleTargetNodes.js';
import runPluginChecks from './build/runPluginChecks.js';
import validateAuthPagePaths from './build/buildRoutes/validateAuthPagePaths.js';
import buildRefs from './build/buildRefs/buildRefs.js';
import resolveAuthConfigProjection from './build/buildAuth/resolveAuthConfigProjection.js';
import buildSecurity from './build/buildSecurity/buildSecurity.js';
import buildWebsockets from './build/buildWebsockets.js';
import collectPageContent from './build/collectPageContent.js';
import buildTypes from './build/buildTypes.js';
import buildTypesMobile from './build/buildTypesMobile.js';
import cleanBuildDirectory from './build/cleanBuildDirectory.js';
import copyAgentFileSystems from './build/copyAgentFileSystems.js';
import copyPublicFolder from './build/copyPublicFolder.js';
import testSchema from './build/testSchema.js';
import updateServerPackageJson from './build/full/updateServerPackageJson.js';
import validateAgentTimeout from './build/validateAgentTimeout.js';
import validateCallAgentSteps from './build/validateCallAgentSteps.js';
import validateConfig from './build/validateConfig.js';
import validateDeprecatedStyles from './build/validateDeprecatedStyles.js';
import validateMcpResponseOperator from './build/validateMcpResponseOperator.js';
import validateMcpViews from './build/validateMcpViews.js';
import validateRenderNotificationSteps from './build/validateRenderNotificationSteps.js';
import validateRequestTimeout from './build/validateRequestTimeout.js';
import writeAgents from './build/writeAgents.js';
import writeApp from './build/writeApp.js';
import writeAppEvents from './build/writeAppEvents.js';
import writeAppMeta from './build/writeAppMeta.js';
import writeAuth from './build/writeAuth.js';
import writeConfig from './build/writeConfig.js';
import writeSecurity from './build/writeSecurity.js';
import writeConnections from './build/writeConnections.js';
import writeDynamicPolicies from './build/writeDynamicPolicies.js';
import writeApi from './build/writeApi.js';
import writeGlobal from './build/writeGlobal.js';
import writeMcp from './build/writeMcp.js';
import writeWebsockets from './build/writeWebsockets.js';
import codegenI18nLocales from './build/codegenI18nLocales.js';
import writeI18n from './build/writeI18n.js';
import writeTheme from './build/writeTheme.js';
import writeJs from './build/buildJs/writeJs.js';
import writeLogger from './build/writeLogger.js';
import writeMaps from './build/writeMaps.js';
import writeMenus from './build/writeMenus.js';
import writeMobile from './build/writeMobile.js';
import writeRoutes from './build/writeRoutes.js';
import writeNotifications from './build/writeNotifications.js';
import writePages from './build/full/writePages.js';
import writePageTypes from './build/full/writePageTypes.js';
import writePluginChecksPending from './build/writePluginChecksPending.js';
import writePluginImports from './build/writePluginImports/writePluginImports.js';
import writeRequests from './build/full/writeRequests.js';
import writeTypes from './build/full/writeTypes.js';

async function build(options) {
  // Reset makeId counter for each build (dev server may run multiple builds)
  makeId.reset();
  if (process.env.LDF_BUILD_PROF) {
    let last = performance.now();
    const t0 = last;
    const marks = [];
    globalThis.__ldfMark = (name) => {
      const now = performance.now();
      marks.push([name, Math.round(now - last)]);
      last = now;
    };
    globalThis.__ldfMarksFlush = () => {
      fs.appendFileSync(
        process.env.LDF_BUILD_PROF,
        JSON.stringify({ total: Math.round(performance.now() - t0), marks }) + '\n'
      );
    };
  }

  let context;
  try {
    context = createContext(options);
    globalThis.__ldfMark?.('context');

    // Phase 0: Resolve root app metadata into context.appMeta before any
    // operator evaluation. _app / _build.app read this, and buildModuleDefs
    // (next) evaluates operators on root config, consumer vars, and connections.
    await buildAppMeta({ context });
    globalThis.__ldfMark?.('buildAppMeta');
    // Surface bad root metadata (unsupported operators, failed _build.*) now,
    // before module operators evaluate against it — avoids cascade errors.
    logCollectedErrors(context);
    globalThis.__ldfMark?.('logCollectedErrors');

    // Phase 1: Build module definitions
    // Parses lowdefy.yaml, resolves module refs, populates context.modules
    await buildModuleDefs({ context });
    globalThis.__ldfMark?.('buildModuleDefs');

    // Scoped pre-pass: resolve the auth: subtree and compute the
    // _build.authConfig projection so the operator can resolve during buildRefs.
    await resolveAuthConfigProjection({ context });
    globalThis.__ldfMark?.('resolveAuthConfigProjection');

    // Step 3 (moved out of buildModuleDefs): full-resolve module manifests now
    // that the projection exists, so module page/api/connection operators like
    // _build.authConfig resolve against it.
    await resolveModuleManifests({ context });
    globalThis.__ldfMark?.('resolveModuleManifests');

    let components;
    globalThis.__ldfMark?.('let');
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
    globalThis.__ldfMark?.('try');
    // Stop if buildRefs collected any errors (YAML parse, missing files, etc.)
    logCollectedErrors(context);
    globalThis.__ldfMark?.('logCollectedErrors');

    // Phase 3: Process modules — scopes IDs, merges into components
    buildModules({ components, context });
    globalThis.__ldfMark?.('buildModules');

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
    globalThis.__ldfMark?.('precomputeRuntimeOperators');

    // Build steps - collect all errors before stopping
    // addKeys runs first so testSchema has ~k markers for error location info
    tryBuildStep(addKeys, 'addKeys', { components, context });
    globalThis.__ldfMark?.('addKeys');
    // testSchema emits warnings (not errors) — focused validations in each
    // build step provide better error messages with full context
    tryBuildStep(testSchema, 'testSchema', { components, context });
    globalThis.__ldfMark?.('testSchema');

    // Stop if addKeys collected any errors (e.g. invalid ~ignoreBuildChecks)
    logCollectedErrors(context);
    globalThis.__ldfMark?.('logCollectedErrors');

    tryBuildStep(buildApp, 'buildApp', { components, context });
    globalThis.__ldfMark?.('buildApp');
    // appMeta is computed in Phase 0; attach it here (where buildApp used to
    // create it) so the following addKeys pass keys it identically.
    components.appMeta = context.appMeta;
    globalThis.__ldfMark?.('components.appMeta');
    // validateConfig resolves the current environment, which buildLogger reads for Sentry.
    tryBuildStep(validateConfig, 'validateConfig', { components, context });
    globalThis.__ldfMark?.('validateConfig');
    tryBuildStep(buildLogger, 'buildLogger', { components, context });
    globalThis.__ldfMark?.('buildLogger');
    tryBuildStep(validateRequestTimeout, 'validateRequestTimeout', { components, context });
    globalThis.__ldfMark?.('validateRequestTimeout');
    tryBuildStep(validateDeprecatedStyles, 'validateDeprecatedStyles', { components, context });
    globalThis.__ldfMark?.('validateDeprecatedStyles');
    tryBuildStep(addDefaultPages, 'addDefaultPages', { components, context });
    globalThis.__ldfMark?.('addDefaultPages');
    // addKeys runs again to add keys to any new objects created by earlier build steps
    tryBuildStep(addKeys, 'addKeys', { components, context });
    globalThis.__ldfMark?.('addKeys');
    // Mobile pages join components.pages here, so routes, auth and requests cover them.
    tryBuildStep(buildMobile, 'buildMobile', { components, context });
    globalThis.__ldfMark?.('buildMobile');
    tryBuildStep(buildRoutes, 'buildRoutes', { components, context });
    globalThis.__ldfMark?.('buildRoutes');
    tryBuildStep(buildAuth, 'buildAuth', { components, context });
    globalThis.__ldfMark?.('buildAuth');
    tryBuildStep(validateAuthPagePaths, 'validateAuthPagePaths', { components, context });
    globalThis.__ldfMark?.('validateAuthPagePaths');
    tryBuildStep(buildConnections, 'buildConnections', { components, context });
    globalThis.__ldfMark?.('buildConnections');
    tryBuildStep(buildDynamicPolicies, 'buildDynamicPolicies', { components, context });
    globalThis.__ldfMark?.('buildDynamicPolicies');
    tryBuildStep(buildApi, 'buildApi', { components, context });
    globalThis.__ldfMark?.('buildApi');
    tryBuildStep(validateMobileEndpointRefs, 'validateMobileEndpointRefs', {
      components,
      context,
    });
    globalThis.__ldfMark?.('validateMobileEndpointRefs');
    tryBuildStep(buildAgents, 'buildAgents', { components, context });
    globalThis.__ldfMark?.('buildAgents');
    tryBuildStep(validateAgentTimeout, 'validateAgentTimeout', { components, context });
    globalThis.__ldfMark?.('validateAgentTimeout');
    tryBuildStep(buildMcp, 'buildMcp', { components, context });
    globalThis.__ldfMark?.('buildMcp');
    tryBuildStep(buildWebsockets, 'buildWebsockets', { components, context });
    globalThis.__ldfMark?.('buildWebsockets');
    // After buildWebsockets: the policy allows the page's websocket when the app has websockets.
    tryBuildStep(buildSecurity, 'buildSecurity', { components, context });
    globalThis.__ldfMark?.('buildSecurity');
    tryBuildStep(buildNotifications, 'buildNotifications', { components, context });
    globalThis.__ldfMark?.('buildNotifications');
    // Cross-config step validations — need buildApi (stepIds) and the
    // buildAgents/buildNotifications id sets
    tryBuildStep(validateCallAgentSteps, 'validateCallAgentSteps', { components, context });
    globalThis.__ldfMark?.('validateCallAgentSteps');
    tryBuildStep(validateRenderNotificationSteps, 'validateRenderNotificationSteps', {
      components,
      context,
    });
    globalThis.__ldfMark?.('validateRenderNotificationSteps');
    tryBuildStep(buildPages, 'buildPages', { components, context });
    globalThis.__ldfMark?.('buildPages');
    // After buildPages: styles are keyed by slot (normalizeClassAndStyles).
    tryBuildStep(validateMobileStyles, 'validateMobileStyles', { components, context });
    globalThis.__ldfMark?.('validateMobileStyles');
    tryBuildStep(validateNativeIgnoredProperties, 'validateNativeIgnoredProperties', {
      components,
      context,
    });
    globalThis.__ldfMark?.('validateNativeIgnoredProperties');
    // After buildPages: Link actions in app events are checked against the page ids.
    tryBuildStep(buildAppEvents, 'buildAppEvents', { components, context });
    globalThis.__ldfMark?.('buildAppEvents');
    tryBuildStep(buildMobileAppEvents, 'buildMobileAppEvents', { components, context });
    globalThis.__ldfMark?.('buildMobileAppEvents');
    // After the pages: a view names a page, and _response is refused outside a view.
    tryBuildStep(validateMcpViews, 'validateMcpViews', { components, context });
    globalThis.__ldfMark?.('validateMcpViews');
    tryBuildStep(validateMcpResponseOperator, 'validateMcpResponseOperator', {
      components,
      context,
    });
    globalThis.__ldfMark?.('validateMcpResponseOperator');
    tryBuildStep(buildMcpViews, 'buildMcpViews', { components, context });
    globalThis.__ldfMark?.('buildMcpViews');
    // Every type is counted by now, and buildJs has not yet replaced the
    // counted objects with copies.
    const { pending: pluginChecksPending } = await runPluginChecks({ components, context });
    globalThis.__ldfMark?.('runPluginChecks');
    clearRuleTargetNodes({ context });
    globalThis.__ldfMark?.('clearRuleTargetNodes');
    // Now, so a build that fails later leaves no stale list behind.
    await writePluginChecksPending({ context, packages: pluginChecksPending });
    globalThis.__ldfMark?.('writePluginChecksPending');
    tryBuildStep(validateApiHtmlLinks, 'validateApiHtmlLinks', { components, context });
    globalThis.__ldfMark?.('validateApiHtmlLinks');
    tryBuildStep(buildMenu, 'buildMenu', { components, context });
    globalThis.__ldfMark?.('buildMenu');
    // Collect page content strings for Tailwind to scan. Must run before
    // buildJs — jsMapParser replaces _js source with hashes, and class
    // candidates used only inside _js source would otherwise never be scanned.
    context.tailwindContentMap = new Map();
    globalThis.__ldfMark?.('context.tailwindContentMap');
    // A mobile page never renders in the web client, so its classes are not scanned.
    for (const page of (components.pages ?? []).filter((item) => item.target !== 'mobile')) {
      const content = collectPageContent([page]);
      if (content) {
        context.tailwindContentMap.set(page.pageId, content);
      }
    }
    globalThis.__ldfMark?.('for');
    // Mobile class candidates are collected here for the same reason.
    tryBuildStep(collectMobileClassCandidates, 'collectMobileClassCandidates', {
      components,
      context,
    });
    globalThis.__ldfMark?.('collectMobileClassCandidates');
    tryBuildStep(buildMobileAppJs, 'buildMobileAppJs', { components, context });
    globalThis.__ldfMark?.('buildMobileAppJs');
    tryBuildStep(buildJs, 'buildJs', { components, context });
    globalThis.__ldfMark?.('buildJs');
    tryBuildStep(buildTypes, 'buildTypes', { components, context });
    globalThis.__ldfMark?.('buildTypes');
    tryBuildStep(buildTypesMobile, 'buildTypesMobile', { components, context });
    globalThis.__ldfMark?.('buildTypesMobile');
    // Icon sets load asynchronously; a bad theme.icons stops the build here,
    // since buildImports resolves every icon name against context.icons.
    await buildIconContext({ components, context });
    globalThis.__ldfMark?.('buildIconContext');
    buildMobileTheme({ components, context });
    globalThis.__ldfMark?.('buildMobileTheme');
    // Async (Tailwind's compiler), so it runs outside tryBuildStep; config
    // faults are collected, not thrown.
    await buildMobileClassMap({ components, context });
    globalThis.__ldfMark?.('buildMobileClassMap');
    logCollectedErrors(context);
    globalThis.__ldfMark?.('logCollectedErrors');
    tryBuildStep(validateMobileMenuIcons, 'validateMobileMenuIcons', { components, context });
    globalThis.__ldfMark?.('validateMobileMenuIcons');
    tryBuildStep(buildImports, 'buildImports', { components, context });
    globalThis.__ldfMark?.('buildImports');
    // Final addKeys pass to ensure all objects (including those created by build steps) have ~k
    tryBuildStep(addKeys, 'addKeys', { components, context });
    globalThis.__ldfMark?.('addKeys');

    // Check if there are any collected errors before writing
    logCollectedErrors(context);
    globalThis.__ldfMark?.('logCollectedErrors');

    // A check (validateOnly) stops here: every validation has run and nothing is written.
    if (context.validateOnly) {
      globalThis.__ldfMarksFlush?.();
      return { errors: [], warnings: (context.warnings ?? []).map(serializeBuildException) };
    }
    globalThis.__ldfMark?.('if');

    // Per-page type sets are build output, not config: computed once every page
    // built cleanly, after the final addKeys pass.
    buildPageTypes({ components, context });
    globalThis.__ldfMark?.('buildPageTypes');
    // Before the page index: a mobile page's hash covers its _icons.
    await buildMobilePageIcons({ components, context });
    globalThis.__ldfMark?.('buildMobilePageIcons');
    buildMobilePageIndex({ components, context });
    globalThis.__ldfMark?.('buildMobilePageIndex');

    // Write steps - only if no errors
    await cleanBuildDirectory({ context });
    globalThis.__ldfMark?.('cleanBuildDirectory');
    // Again: cleanBuildDirectory removed it.
    await writePluginChecksPending({ context, packages: pluginChecksPending });
    globalThis.__ldfMark?.('writePluginChecksPending');
    await writeApp({ components, context });
    globalThis.__ldfMark?.('writeApp');
    await writeAppEvents({ components, context });
    globalThis.__ldfMark?.('writeAppEvents');
    await writeAppMeta({ components, context });
    globalThis.__ldfMark?.('writeAppMeta');
    await writeAuth({ components, context });
    globalThis.__ldfMark?.('writeAuth');
    await writeConnections({ components, context });
    globalThis.__ldfMark?.('writeConnections');
    await writeDynamicPolicies({ context });
    globalThis.__ldfMark?.('writeDynamicPolicies');
    await writeAgents({ components, context });
    globalThis.__ldfMark?.('writeAgents');
    await writeApi({ components, context });
    globalThis.__ldfMark?.('writeApi');
    await writeMcp({ components, context });
    globalThis.__ldfMark?.('writeMcp');
    await writeWebsockets({ components, context });
    globalThis.__ldfMark?.('writeWebsockets');
    await writeNotifications({ components, context });
    globalThis.__ldfMark?.('writeNotifications');
    await writeRequests({ components, context });
    globalThis.__ldfMark?.('writeRequests');
    await writePages({ components, context });
    globalThis.__ldfMark?.('writePages');
    await writeConfig({ components, context });
    globalThis.__ldfMark?.('writeConfig');
    await writeSecurity({ context });
    globalThis.__ldfMark?.('writeSecurity');
    await writeGlobal({ components, context });
    globalThis.__ldfMark?.('writeGlobal');
    await writeTheme({ components, context });
    globalThis.__ldfMark?.('writeTheme');
    await writeI18n({ components, context });
    globalThis.__ldfMark?.('writeI18n');
    await codegenI18nLocales({ components, context });
    globalThis.__ldfMark?.('codegenI18nLocales');
    await writeLogger({ components, context });
    globalThis.__ldfMark?.('writeLogger');
    await writeMaps({ components, context });
    globalThis.__ldfMark?.('writeMaps');
    await writeMenus({ components, context });
    globalThis.__ldfMark?.('writeMenus');
    await writeRoutes({ components, context });
    globalThis.__ldfMark?.('writeRoutes');
    await writeTypes({ components, context });
    globalThis.__ldfMark?.('writeTypes');
    await writePluginImports({ components, context });
    globalThis.__ldfMark?.('writePluginImports');
    await writePageTypes({ components, context });
    globalThis.__ldfMark?.('writePageTypes');
    await writeMobile({ components, context });
    globalThis.__ldfMark?.('writeMobile');
    await writeJs({ components, context });
    globalThis.__ldfMark?.('writeJs');
    await updateServerPackageJson({ components, context });
    globalThis.__ldfMark?.('updateServerPackageJson');
    await copyPublicFolder({ components, context });
    globalThis.__ldfMark?.('copyPublicFolder');
    await copyAgentFileSystems({ components, context });
    globalThis.__ldfMark?.('copyAgentFileSystems');
    globalThis.__ldfMarksFlush?.();
  } catch (err) {
    if (err instanceof BuildError) {
      throw err;
    }
    throw createInternalBuildError({ error: err, context, logger: options.logger ?? console });
  }
}

export { createPluginTypesMap, createPluginTypesMapMobile };

export default build;
