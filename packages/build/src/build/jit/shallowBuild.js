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
import { LowdefyError } from '@lowdefy/errors';
import { ConfigError } from '@lowdefy/errors/build';

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
import buildRefs from '../buildRefs/buildRefs.js';
import buildTypes from '../buildTypes.js';
import cleanBuildDirectory from '../cleanBuildDirectory.js';
import copyPublicFolder from '../copyPublicFolder.js';
import createFileDependencyMap from './createFileDependencyMap.js';
import createPageRegistry from './createPageRegistry.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import testSchema from '../testSchema.js';
import validateConfig from '../validateConfig.js';
import writeApp from '../writeApp.js';
import writeAuth from '../writeAuth.js';
import writeConfig from '../writeConfig.js';
import writeConnections from '../writeConnections.js';
import writeApi from '../writeApi.js';
import writeGlobal from '../writeGlobal.js';
import writeJs from '../buildJs/writeJs.js';
import writeLogger from '../writeLogger.js';
import writeMaps from '../writeMaps.js';
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

const SHALLOW_STOP_PATHS = [
  'pages.*.blocks',
  'pages.*.areas',
  'pages.*.events',
  'pages.*.requests',
  'pages.*.layout',
];

async function shallowBuild(options) {
  makeId.reset();

  let context;
  try {
    context = createContext(options);

    let components;
    try {
      components = await buildRefs({
        context,
        shallowOptions: { stopAt: SHALLOW_STOP_PATHS },
      });
    } catch (err) {
      if (err instanceof ConfigError) {
        context.handleError(err);
        const error = new Error('Build failed with 1 error(s). See above for details.');
        error.isFormatted = true;
        error.hideStack = true;
        throw error;
      }
      throw err;
    }

    // addKeys + testSchema first for error location info
    tryBuildStep(addKeys, 'addKeys', { components, context });

    // Strip shallow markers from pages before schema validation.
    // Schema doesn't know about ~shallow placeholders — they'd fail as additional properties.
    // Save and restore so createPageRegistry can still capture raw content later.
    const savedPageContent = (components.pages ?? []).map((page) => {
      const saved = {};
      for (const key of ['blocks', 'areas', 'events', 'requests', 'layout']) {
        if (page[key] !== undefined) {
          saved[key] = page[key];
          delete page[key];
        }
      }
      return saved;
    });
    tryBuildStep(testSchema, 'testSchema', { components, context });
    (components.pages ?? []).forEach((page, i) => {
      Object.assign(page, savedPageContent[i]);
    });

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

    // Set pageId on pages for buildMenu (normally done by buildPage in buildPages)
    for (const page of components.pages ?? []) {
      if (page.id && !page.pageId) {
        page.pageId = page.id;
      }
    }

    // Extract page registry after buildAuth (sets page.auth) and pageId assignment,
    // but before build steps that modify page content for skeleton output.
    const pageRegistry = createPageRegistry({ components });

    tryBuildStep(buildMenu, 'buildMenu', { components, context });

    // Extract JS from non-page components only (pages JS built JIT)
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
      function addInstalledTypes(store, definitions) {
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

    // Build file dependency map for targeted invalidation
    const fileDependencyMap = createFileDependencyMap({ pageRegistry, refMap: context.refMap });

    // Ensure both client and server jsMap keys exist.
    // In shallow build, only server JS is extracted (api/connections).
    // Client JS is extracted per-page during JIT build.
    if (!context.jsMap.client) {
      context.jsMap.client = {};
    }
    if (!context.jsMap.server) {
      context.jsMap.server = {};
    }

    // Write skeleton artifacts (everything except pages and page requests)
    await cleanBuildDirectory({ context });
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
    await writePluginImports({ components, context });
    await writePageRegistry({ pageRegistry, context });
    await copyPublicFolder({ components, context });

    return { components, pageRegistry, fileDependencyMap, context };
  } catch (err) {
    if (err.isFormatted) {
      throw err;
    }
    const logger = context?.logger ?? options.logger ?? console;
    const lowdefyErr = new LowdefyError(err.message, { cause: err });
    lowdefyErr.stack = err.stack;
    logger.error(lowdefyErr);
    const error = new Error('Build failed due to internal error. See above for details.');
    error.isFormatted = true;
    error.hideStack = true;
    throw error;
  }
}

export default shallowBuild;
