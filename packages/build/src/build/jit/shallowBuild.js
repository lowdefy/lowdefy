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

import fs from 'fs';
import path from 'path';
import { BuildError, ConfigError, LowdefyInternalError, shouldSuppressBuildCheck } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createContext from '../../createContext.js';
import logCollectedErrors from '../../utils/logCollectedErrors.js';
import makeId from '../../utils/makeId.js';
import tryBuildStep from '../../utils/tryBuildStep.js';

import addDefaultPages from '../addDefaultPages/addDefaultPages.js';
import addKeys from '../addKeys.js';
import buildApp from '../buildApp.js';
import buildAuth from '../buildAuth/buildAuth.js';
import buildConnections from '../buildConnections.js';
import buildApi from '../buildApi/buildApi.js';
import buildLogger from '../buildLogger.js';
import buildImports from '../buildImports/buildImports.js';
import buildMenu from '../buildMenu.js';
import buildPage from '../buildPages/buildPage.js';
import buildRefs from '../buildRefs/buildRefs.js';
import buildTypes from '../buildTypes.js';
import cleanBuildDirectory from '../cleanBuildDirectory.js';
import copyPublicFolder from '../copyPublicFolder.js';
import createPageRegistry from './createPageRegistry.js';
import PAGE_CONTENT_KEYS from './pageContentKeys.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import testSchema from '../testSchema.js';
import validateConfig from '../validateConfig.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import writeApp from '../writeApp.js';
import writeAuth from '../writeAuth.js';
import writeConfig from '../writeConfig.js';
import writeConnections from '../writeConnections.js';
import writeApi from '../writeApi.js';
import writeGlobal from '../writeGlobal.js';
import writeJs from '../buildJs/writeJs.js';
import writeLogger from '../writeLogger.js';
import writeMaps from '../writeMaps.js';
import updateServerPackageJson from '../full/updateServerPackageJson.js';
import writeMenus from '../writeMenus.js';
import writePageRegistry from './writePageRegistry.js';
import writePluginImports from '../writePluginImports/writePluginImports.js';

function getInstalledPackages(directories) {
  if (!directories.server) return null;
  try {
    const pkgPath = path.join(directories.server, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return new Set(Object.keys(pkg.dependencies ?? {}));
  } catch {
    return null;
  }
}

const SHALLOW_STOP_PATHS = PAGE_CONTENT_KEYS.map((key) => `pages.*.${key}`);

async function shallowBuild(options) {
  makeId.reset();

  let context;
  try {
    context = createContext(options);

    const shallowPageIndices = new Set();
    let components;
    try {
      components = await buildRefs({
        context,
        shallowOptions: { stopAt: SHALLOW_STOP_PATHS, shallowPageIndices },
      });
    } catch (err) {
      if (err.isLowdefyError) {
        context.handleError(err);
        throw new BuildError('Build failed with 1 error(s). See above for details.');
      }
      throw err;
    }

    // addKeys + testSchema first for error location info
    tryBuildStep(addKeys, 'addKeys', { components, context });

    // Strip shallow pages to stubs before schema validation.
    // Stubs keep id + type (required by block schema) and ~shallow marker.
    // Non-shallow pages (no skipped refs) keep their full content.
    (components.pages ?? []).forEach((page, i) => {
      if (!shallowPageIndices.has(i)) return;
      for (const key of PAGE_CONTENT_KEYS) {
        delete page[key];
      }
      page['~shallow'] = true;
    });
    tryBuildStep(testSchema, 'testSchema', { components, context });

    logCollectedErrors(context);

    // Build skeleton steps (everything except page content)
    tryBuildStep(buildApp, 'buildApp', { components, context });
    tryBuildStep(buildLogger, 'buildLogger', { components, context });
    tryBuildStep(validateConfig, 'validateConfig', { components, context });
    tryBuildStep(addDefaultPages, 'addDefaultPages', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });
    tryBuildStep(buildAuth, 'buildAuth', { components, context });
    tryBuildStep(buildConnections, 'buildConnections', { components, context });
    tryBuildStep(buildApi, 'buildApi', { components, context });

    // Set pageId on all pages (normally done by buildPage in buildPages).
    // Must run before createPageRegistry which uses page.id as map key.
    for (const page of components.pages ?? []) {
      if (page.id && !page.pageId) {
        page.pageId = page.id;
      }
    }

    // Extract page registry BEFORE buildPage (which transforms page.id to `page:${pageId}`).
    // Registry uses original page.id as the map key.
    const pageRegistry = createPageRegistry({ components, shallowPageIndices, context });

    // Build non-shallow pages (fully resolved, including injected defaults like 404).
    // Shallow pages are deferred to JIT resolution.
    const checkDuplicatePageId = createCheckDuplicateId({
      message: 'Duplicate pageId "{{ id }}".',
    });
    context.linkActionRefs = [];

    (components.pages ?? []).forEach((page, index) => {
      checkDuplicatePageId({ id: page.id, configKey: page['~k'] });
      if (page['~shallow']) return;
      try {
        // Pass no-op for checkDuplicatePageId since we already checked above
        buildPage({ page, index, context, checkDuplicatePageId: () => {} });
      } catch (error) {
        // Skip suppressed ConfigErrors (via ~ignoreBuildChecks)
        if (
          error instanceof ConfigError &&
          shouldSuppressBuildCheck(error, context.keyMap)
        ) {
          return;
        }
        context.errors.push(error);
      }
    });

    // Validate references for non-shallow pages
    validateLinkReferences({
      linkActionRefs: context.linkActionRefs,
      pageIds: (components.pages ?? []).map((p) => p.pageId),
      context,
    });
    for (const page of components.pages ?? []) {
      if (page['~shallow']) continue;
      validateStateReferences({ page, context });
      validatePayloadReferences({ page, context });
      validateServerStateReferences({ page, context });
    }

    // Extract JS from non-shallow pages (client + server)
    components.pages = (components.pages ?? []).map((page) => {
      if (page['~shallow']) return page;
      const pageRequests = [...(page.requests ?? [])];
      delete page.requests;
      const cleanPage = jsMapParser({ input: page, jsMap: context.jsMap, env: 'client' });
      const cleanRequests = jsMapParser({
        input: pageRequests,
        jsMap: context.jsMap,
        env: 'server',
      });
      return { ...cleanPage, requests: cleanRequests };
    });

    // Serialize non-shallow page data for writing after cleanBuildDirectory.
    // Must capture before stripping content keys below.
    const preBuiltPageArtifacts = [];
    for (const page of components.pages ?? []) {
      if (page['~shallow']) continue;
      preBuiltPageArtifacts.push({
        pageId: page.pageId,
        pageJson: serializer.serializeToString(page ?? {}),
        requests: (page.requests ?? []).map((request) => ({
          requestId: request.requestId,
          requestJson: serializer.serializeToString(request ?? {}),
        })),
      });
    }

    // Strip request metadata and content keys from non-shallow pages
    for (const page of components.pages ?? []) {
      if (page['~shallow']) continue;
      for (const request of page.requests ?? []) {
        delete request.properties;
        delete request.type;
        delete request.connectionId;
        delete request.auth;
      }
      for (const key of PAGE_CONTENT_KEYS) {
        delete page[key];
      }
    }

    tryBuildStep(buildMenu, 'buildMenu', { components, context });

    // Extract JS from api/connections (shallow page JS built JIT, non-shallow already extracted)
    if (components.api) {
      components.api = jsMapParser({
        input: components.api,
        jsMap: context.jsMap,
        env: 'server',
      });
    }
    if (components.connections) {
      components.connections = jsMapParser({
        input: components.connections,
        jsMap: context.jsMap,
        env: 'server',
      });
    }

    tryBuildStep(buildTypes, 'buildTypes', { components, context });

    // In dev mode, page content is built JIT so page-level types (actions, blocks,
    // operators) aren't counted during skeleton build. Include all types from
    // installed packages so they're available for client-side use. Dev server
    // pre-installs default packages so bundle size is not a concern — only
    // production builds tree-shake by counting exact type usage.
    const installedPackages = getInstalledPackages(context.directories);
    if (installedPackages) {
      const addInstalledTypes = (store, definitions) => {
        for (const [typeName, def] of Object.entries(definitions)) {
          if (!store[typeName] && installedPackages.has(def.package)) {
            store[typeName] = {
              originalTypeName: def.originalTypeName,
              package: def.package,
              version: def.version,
              count: 0,
            };
          }
        }
      }
      addInstalledTypes(components.types.actions, context.typesMap.actions);
      addInstalledTypes(components.types.blocks, context.typesMap.blocks);
      addInstalledTypes(components.types.operators.client, context.typesMap.operators.client);
      addInstalledTypes(components.types.operators.server, context.typesMap.operators.server);
    }

    tryBuildStep(buildImports, 'buildImports', { components, context });
    tryBuildStep(addKeys, 'addKeys', { components, context });

    logCollectedErrors(context);

    // Update server package.json with plugin packages discovered during skeleton build.
    // Connections, requests, and auth types are skeleton-level — they must be installed
    // before Next.js builds. Page-level types (blocks, actions, operators) are handled
    // by detectMissingPluginPackages during JIT page builds.
    await updateServerPackageJson({ components, context });

    // Ensure both client and server jsMap keys exist.
    // In shallow build, only server JS is extracted (api/connections).
    // Client JS is extracted per-page during JIT build.
    if (!context.jsMap.client) {
      context.jsMap.client = {};
    }
    if (!context.jsMap.server) {
      context.jsMap.server = {};
    }

    // Write all build artifacts
    await cleanBuildDirectory({ context });

    // Write pre-built page artifacts (non-shallow pages built during skeleton)
    for (const artifact of preBuiltPageArtifacts) {
      await context.writeBuildArtifact(
        `pages/${artifact.pageId}/${artifact.pageId}.json`,
        artifact.pageJson
      );
      for (const request of artifact.requests) {
        await context.writeBuildArtifact(
          `pages/${artifact.pageId}/requests/${request.requestId}.json`,
          request.requestJson
        );
      }
    }

    await writeApp({ components, context });
    await writeAuth({ components, context });
    await writeConnections({ components, context });
    await writeApi({ components, context });
    await writeConfig({ components, context });
    await writeGlobal({ components, context });
    await writeLogger({ components, context });
    await writeMaps({ context });
    await context.writeBuildArtifact(
      'connectionIds.json',
      JSON.stringify([...context.connectionIds])
    );
    await writeMenus({ components, context });
    await writeJs({ context });
    await context.writeBuildArtifact('jsMap.json', JSON.stringify(context.jsMap));
    await context.writeBuildArtifact(
      'customTypesMap.json',
      JSON.stringify(options.customTypesMap ?? {})
    );
    // Persist snapshot of installed packages for JIT missing-package detection.
    // Written as a build artifact so JIT builds compare against the skeleton
    // build state, not a potentially-updated package.json (race condition).
    await context.writeBuildArtifact(
      'installedPluginPackages.json',
      JSON.stringify([...(installedPackages ?? [])])
    );
    await writePluginImports({ components, context });
    await writePageRegistry({ pageRegistry, context });
    await copyPublicFolder({ components, context });

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
