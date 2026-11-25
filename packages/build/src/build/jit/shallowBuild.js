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

import { randomBytes } from 'crypto';
import { ldfTime, ldfTimeSync } from '../../utils/ldfProf.js';

import { serializer } from '@lowdefy/helpers';
import { BuildError } from '@lowdefy/errors';

import createContext from '../../createContext.js';
import createInternalBuildError from '../../utils/createInternalBuildError.js';
import logCollectedErrors from '../../utils/logCollectedErrors.js';
import makeId from '../../utils/makeId.js';
import tryBuildStep from '../../utils/tryBuildStep.js';

import addDefaultPages from '../addDefaultPages/addDefaultPages.js';
import addKeys from '../addKeys.js';
import buildApp from '../buildApp.js';
import buildAppEvents from '../buildAppEvents.js';
import buildAppMeta from '../buildAppMeta.js';
import buildAuth from '../buildAuth/buildAuth.js';
import buildConnections from '../buildConnections.js';
import buildDynamicPolicies from '../buildDynamicPolicies.js';
import buildAgents from '../buildAgents.js';
import buildApi from '../buildApi/buildApi.js';
import validateApiHtmlLinks from '../buildApi/validateApiHtmlLinks.js';
import buildLogger from '../buildLogger.js';
import buildImports from '../buildImports/buildImports.js';
import buildIconContext from '../icons/buildIconContext.js';
import buildMcp from '../buildMcp.js';
import buildMenu from '../buildMenu.js';
import buildMobile from '../buildMobile/buildMobile.js';
import buildMobileAppEvents from '../buildMobile/buildMobileAppEvents.js';
import buildMobileAppJs from '../buildMobile/buildMobileAppJs.js';
import buildMobileClassMap from '../buildMobile/buildMobileClassMap.js';
import buildMobilePageIcons from '../buildMobile/buildMobilePageIcons.js';
import buildMobileTheme from '../buildMobile/buildMobileTheme.js';
import validateMobileMenuIcons from '../buildMobile/validateMobileMenuIcons.js';
import buildModuleDefs from '../buildModuleDefs.js';
import { resolveModuleManifests } from '../registerModules.js';
import buildModules from '../buildModules.js';
import buildNotifications from '../buildNotifications.js';
import buildRefs from '../buildRefs/buildRefs.js';
import buildRoutes from '../buildRoutes/buildRoutes.js';
import validateAuthPagePaths from '../buildRoutes/validateAuthPagePaths.js';
import precomputeRuntimeOperators from '../buildRefs/precomputeRuntimeOperators.js';
import resolveAuthConfigProjection from '../buildAuth/resolveAuthConfigProjection.js';
import { serializeRegistry } from '../buildRefs/deferredRegistry.js';
import buildTypes from '../buildTypes.js';
import clearRuleTargetNodes from '../pluginChecks/clearRuleTargetNodes.js';
import runPluginChecks from '../runPluginChecks.js';
import buildSecurity from '../buildSecurity/buildSecurity.js';
import buildWebsockets from '../buildWebsockets.js';
import validateCallAgentSteps from '../validateCallAgentSteps.js';
import validateMcpResponseOperator from '../validateMcpResponseOperator.js';
import validateMcpViews from '../validateMcpViews.js';
import validateRenderNotificationSteps from '../validateRenderNotificationSteps.js';
import cleanBuildDirectory from '../cleanBuildDirectory.js';
import copyAgentFileSystems from '../copyAgentFileSystems.js';
import copyPublicFolder from '../copyPublicFolder.js';
import testSchema from '../testSchema.js';
import validateConfig from '../validateConfig.js';
import writeApp from '../writeApp.js';
import writeAppEvents from '../writeAppEvents.js';
import writeAppMeta from '../writeAppMeta.js';
import writeAuth from '../writeAuth.js';
import writeConfig from '../writeConfig.js';
import writeSecurity from '../writeSecurity.js';
import writeConnections from '../writeConnections.js';
import writeDynamicPolicies from '../writeDynamicPolicies.js';
import writeTenantTargets from '../writeTenantTargets.js';
import writeAgents from '../writeAgents.js';
import writeApi from '../writeApi.js';
import writeMcp from '../writeMcp.js';
import writeNotifications from '../writeNotifications.js';
import writeGlobal from '../writeGlobal.js';
import writeJs from '../buildJs/writeJs.js';
import writeWebsockets from '../writeWebsockets.js';
import writeLogger from '../writeLogger.js';
import codegenI18nLocales from '../codegenI18nLocales.js';
import writeI18n from '../writeI18n.js';
import writeTheme from '../writeTheme.js';
import writeMaps from '../writeMaps.js';
import updateServerPackageJson from '../full/updateServerPackageJson.js';
import writeMenus from '../writeMenus.js';
import writeMobile from '../writeMobile.js';
import writeRoutes from '../writeRoutes.js';
import writeTypes from '../full/writeTypes.js';
import writePageRegistry from './writePageRegistry.js';
import writePluginChecksPending from '../writePluginChecksPending.js';
import writePluginImports from '../writePluginImports/writePluginImports.js';

import addInstalledTypes from './addInstalledTypes.js';
import buildJsShallow from './buildJsShallow.js';
import buildMobilePageIndexShallow from './buildMobilePageIndexShallow.js';
import buildShallowPages from './buildShallowPages.js';
import collectPageContent from '../collectPageContent.js';
import collectSkeletonSourceFiles from './collectSkeletonSourceFiles.js';
import releaseMergedModuleEntities from './releaseMergedModuleEntities.js';
import writeSourcelessPages from './writeSourcelessPages.js';

async function shallowBuild(options) {
  return ldfTime('shallow:TOTAL', () => shallowBuildInner(options));
}

async function shallowBuildInner(options) {
  makeId.reset({ prefix: `${randomBytes(2).toString('hex')}_` });

  let context;
  try {
    context = createContext(options);

    // Phase 0: Resolve root app metadata before any operator evaluation.
    await ldfTime('shallow:buildAppMeta', () => buildAppMeta({ context }));
    // Surface bad root metadata before module operators evaluate against it.
    logCollectedErrors(context);

    // Phase 1: Build module definitions
    await ldfTime('shallow:buildModuleDefs', () => buildModuleDefs({ context }));

    // Scoped pre-pass: resolve the auth: subtree and compute the
    // _build.authConfig projection so the operator can resolve during buildRefs
    // and the dev server's JIT page walks (matches the full build in index.js).
    await ldfTime('shallow:resolveAuthConfigProjection', () =>
      resolveAuthConfigProjection({ context })
    );

    // Step 3 (moved out of buildModuleDefs): full-resolve module manifests now
    // that the projection exists (matches the full build in index.js).
    await ldfTime('shallow:resolveModuleManifests', () => resolveModuleManifests({ context }));

    let components;
    try {
      // Phase 2: Ref resolution (with shallow options)
      components = await ldfTime('shallow:buildRefs', () =>
        buildRefs({
          context,
          shallowOptions: true,
        })
      );
    } catch (err) {
      // Root lowdefy.yaml failure still throws from buildRefs — collect it
      if (!err.isLowdefyError) {
        throw err;
      }
      context.errors.push(err);
    }

    // Stop early if buildRefs collected errors (e.g., YAML parse errors).
    // Failed _ref resolutions leave null entries in arrays — logging now
    // surfaces the real error before downstream code crashes on nulls.
    logCollectedErrors(context);

    // Phase 3: Process modules — scopes IDs, merges into components
    ldfTimeSync('shallow:buildModules', () => buildModules({ components, context }));
    // Collect skeleton source files while ~r markers still exist on objects.
    const skeletonSourceFiles = ldfTimeSync('shallow:collectSkeletonSourceFiles', () =>
      collectSkeletonSourceFiles({ components, context })
    );
    // After collectSkeletonSourceFiles, the last reader of a manifest's pages.
    ldfTimeSync('shallow:releaseMergedModuleEntities', () =>
      releaseMergedModuleEntities({ context })
    );

    // Phase 3.5: Constant-fold static runtime operators, mirroring the full
    // build (index.js). Without this, content preserved at skeleton — inline
    // pages, slot content, module components consumed into them — reaches
    // testSchema (spurious warnings) and the served dev artifacts (broken
    // block ids: the client never operator-evaluates id positions) with raw
    // runtime operators. Ref-backed page content is already stripped here and
    // folds per page in buildPageJit.
    components = ldfTimeSync('shallow:precomputeRuntimeOperators', () =>
      precomputeRuntimeOperators({
        context,
        input: components,
        refDef: context.rootRefDef,
      })
    );

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
    // validateConfig resolves the current environment, which buildLogger reads for Sentry.
    tryBuildStep(validateConfig, 'validateConfig', { components, context });
    tryBuildStep(buildLogger, 'buildLogger', { components, context });
    tryBuildStep(addDefaultPages, 'addDefaultPages', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });
    // Mobile pages join components.pages here, as in the full build, so routes,
    // auth and the page registry cover them.
    tryBuildStep(buildMobile, 'buildMobile', { components, context });
    tryBuildStep(buildRoutes, 'buildRoutes', { components, context });
    tryBuildStep(buildAuth, 'buildAuth', { components, context });
    tryBuildStep(validateAuthPagePaths, 'validateAuthPagePaths', { components, context });
    tryBuildStep(buildConnections, 'buildConnections', { components, context });
    tryBuildStep(buildDynamicPolicies, 'buildDynamicPolicies', { components, context });
    tryBuildStep(buildApi, 'buildApi', { components, context });
    tryBuildStep(buildAgents, 'buildAgents', { components, context });
    tryBuildStep(buildMcp, 'buildMcp', { components, context });
    tryBuildStep(buildWebsockets, 'buildWebsockets', { components, context });
    // After buildWebsockets: the policy allows the page's websocket when the app has websockets.
    tryBuildStep(buildSecurity, 'buildSecurity', { components, context });
    tryBuildStep(buildNotifications, 'buildNotifications', { components, context });
    // Cross-config validations — need buildApi (stepIds) and the buildAgents/
    // buildNotifications id sets. Match the full build (index.js).
    tryBuildStep(validateCallAgentSteps, 'validateCallAgentSteps', { components, context });
    tryBuildStep(validateRenderNotificationSteps, 'validateRenderNotificationSteps', {
      components,
      context,
    });

    // Icon sets load asynchronously; a bad theme.icons stops the build here.
    // buildShallowPages validates the icon names of sourceless pages, and
    // buildImports resolves every icon name, against context.icons.
    await ldfTime('shallow:buildIconContext', () => buildIconContext({ components, context }));
    logCollectedErrors(context);
    tryBuildStep(validateMobileMenuIcons, 'validateMobileMenuIcons', { components, context });

    const { pageRegistry, sourcelessPageArtifacts } = ldfTimeSync('shallow:buildShallowPages', () =>
      buildShallowPages({ components, context })
    );
    // Inline mobile pages carry their icons' data, as page builds' do.
    await buildMobilePageIcons({
      components: {
        global: components.global,
        pages: sourcelessPageArtifacts.map((artifact) => artifact.page),
      },
      context,
    });
    // After buildShallowPages: Link actions in app events are checked against the page ids.
    tryBuildStep(buildAppEvents, 'buildAppEvents', { components, context });
    tryBuildStep(buildMobileAppEvents, 'buildMobileAppEvents', { components, context });
    // The view checks of the full build. views.pages stays empty: pages with a
    // source file are built on request, and the dev server serves no views.
    tryBuildStep(validateMcpViews, 'validateMcpViews', { components, context });
    tryBuildStep(validateMcpResponseOperator, 'validateMcpResponseOperator', {
      components,
      context,
    });
    // App-level config and inline pages; page builds check their own pages.
    const { pending: pluginChecksPending } = await ldfTime('shallow:runPluginChecks', () =>
      runPluginChecks({
        components,
        context,
        allSlugPackages: true,
      })
    );
    ldfTimeSync('shallow:clearRuleTargetNodes', () => clearRuleTargetNodes({ context }));
    // Now, so a build that fails later leaves no stale list behind.
    await ldfTime('shallow:writePluginChecksPending', () =>
      writePluginChecksPending({ context, packages: pluginChecksPending })
    );
    tryBuildStep(validateApiHtmlLinks, 'validateApiHtmlLinks', { components, context });

    tryBuildStep(buildMobileAppJs, 'buildMobileAppJs', { components, context });
    tryBuildStep(buildJsShallow, 'buildJsShallow', { components, context });

    tryBuildStep(buildMenu, 'buildMenu', { components, context });
    tryBuildStep(buildMobilePageIndexShallow, 'buildMobilePageIndexShallow', {
      components,
      context,
    });
    tryBuildStep(buildTypes, 'buildTypes', { components, context });
    // writeMobile writes mobile/theme.json and mobile/classMap.json from these.
    // The class map covers the class candidates buildShallowPages collected
    // from sourceless pages.
    ldfTimeSync('shallow:buildMobileTheme', () => buildMobileTheme({ components, context }));
    // Async (Tailwind's compiler), so it runs outside tryBuildStep; config
    // faults are collected, not thrown.
    await ldfTime('shallow:buildMobileClassMap', () =>
      buildMobileClassMap({ components, context })
    );

    // Update server package.json before addInstalledTypes so that addInstalledTypes
    // sees the full set of dependencies on every run (not just after the first build).
    // This prevents plugin import files from differing between the initial and
    // subsequent builds, which would trigger unnecessary server restarts.
    await ldfTime('shallow:updateServerPackageJson', () =>
      updateServerPackageJson({ components, context })
    );

    tryBuildStep(addInstalledTypes, 'addInstalledTypes', { components, context });
    tryBuildStep(buildImports, 'buildImports', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });

    logCollectedErrors(context);

    // Write all build artifacts
    await ldfTime('shallow:cleanBuildDirectory', () => cleanBuildDirectory({ context }));
    // Again: cleanBuildDirectory removed it.
    await ldfTime('shallow:writePluginChecksPending', () =>
      writePluginChecksPending({ context, packages: pluginChecksPending })
    );
    await ldfTime('shallow:writeSourcelessPages', () =>
      writeSourcelessPages({ sourcelessPageArtifacts, context })
    );
    await ldfTime('shallow:writeApp', () => writeApp({ components, context }));
    await ldfTime('shallow:writeAppEvents', () => writeAppEvents({ components, context }));
    await ldfTime('shallow:writeAppMeta', () => writeAppMeta({ components, context }));
    await ldfTime('shallow:writeAuth', () => writeAuth({ components, context }));
    await ldfTime('shallow:writeConnections', () => writeConnections({ components, context }));
    await ldfTime('shallow:writeDynamicPolicies', () => writeDynamicPolicies({ context }));
    await ldfTime('shallow:writeApi', () => writeApi({ components, context }));
    await ldfTime('shallow:writeMcp', () => writeMcp({ components, context }));
    await ldfTime('shallow:writeAgents', () => writeAgents({ components, context }));
    await ldfTime('shallow:writeWebsockets', () => writeWebsockets({ components, context }));
    await ldfTime('shallow:writeNotifications', () => writeNotifications({ components, context }));
    await ldfTime('shallow:writeConfig', () => writeConfig({ components, context }));
    await ldfTime('shallow:writeSecurity', () => writeSecurity({ context }));
    await ldfTime('shallow:writeGlobal', () => writeGlobal({ components, context }));
    await ldfTime('shallow:writeTheme', () => writeTheme({ components, context }));
    await writeI18n({ components, context });
    await codegenI18nLocales({ components, context });
    await ldfTime('shallow:writeLogger', () => writeLogger({ components, context }));
    await ldfTime('shallow:writeMaps', () => writeMaps({ context }));
    await context.writeBuildArtifact(
      'connectionIds.json',
      JSON.stringify([...context.connectionIds].sort())
    );
    await ldfTime('shallow:writeTenantTargets', () => writeTenantTargets({ context }));
    await context.writeBuildArtifact(
      'websocketIds.json',
      JSON.stringify([...context.websocketIds].sort())
    );
    await context.writeBuildArtifact(
      'skeletonSourceFiles.json',
      JSON.stringify([...skeletonSourceFiles].sort())
    );
    await ldfTime('shallow:writeMenus', () => writeMenus({ components, context }));
    await ldfTime('shallow:writeRoutes', () => writeRoutes({ components, context }));
    await ldfTime('shallow:writeMobile', () => writeMobile({ components, context }));
    // The dev client bundle imports every installed type (addInstalledTypes),
    // so types.json here describes that full bundle — dynamic page content
    // resolution validates fragment types against it at page get.
    await ldfTime('shallow:writeTypes', () => writeTypes({ components, context }));
    // null: the dev client is not split per page, so dynamic content can never
    // reach outside a page's client types (see flagTypesOutsidePage).
    await context.writeBuildArtifact('pageTypeSets.json', 'null');
    await ldfTime('shallow:writeJs', () => writeJs({ context }));
    await context.writeBuildArtifact('jsMap.json', JSON.stringify(context.jsMap));
    await context.writeBuildArtifact(
      'idCounter.json',
      JSON.stringify({ prefix: makeId.prefix, counter: makeId.counter })
    );
    await context.writeBuildArtifact(
      'customTypesMap.json',
      JSON.stringify(options.customTypesMap ?? {})
    );
    // JIT page builds resolve mobile pages against the same shell plugin
    // types as this build.
    await context.writeBuildArtifact(
      'customTypesMapMobile.json',
      JSON.stringify(options.customTypesMapMobile ?? {})
    );
    // Which shells carry which shell plugins (validateMobileConfig), so a
    // dev page build refuses a plugin type some shell lacks, as this build does.
    await context.writeBuildArtifact(
      'mobileShells.json',
      JSON.stringify(context.mobileShells ?? [])
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
    // Also writes iconImports.json, the icon names snapshot JIT page builds
    // compare discovered icons against.
    await ldfTime('shallow:writePluginImports', () => writePluginImports({ components, context }));
    await ldfTime('shallow:writePageRegistry', () => writePageRegistry({ pageRegistry, context }));
    await ldfTime('shallow:copyPublicFolder', () => copyPublicFolder({ components, context }));
    await ldfTime('shallow:copyAgentFileSystems', () =>
      copyAgentFileSystems({ components, context })
    );

    return { components, pageRegistry, context };
  } catch (err) {
    if (err instanceof BuildError) {
      throw err;
    }
    throw createInternalBuildError({ error: err, context, logger: options.logger ?? console });
  }
}

export default shallowBuild;
