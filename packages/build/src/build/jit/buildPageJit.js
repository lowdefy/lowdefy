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
import { serializer, type } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import operators from '@lowdefy/operators-js/operators/build';

import addKeys from '../addKeys.js';
import buildPage from '../buildPages/buildPage.js';
import validateCallApiRefs from '../buildPages/validateCallApiRefs.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createContext from '../../createContext.js';
import evaluateStaticOperators from '../buildRefs/evaluateStaticOperators.js';
import getRefContent from '../buildRefs/getRefContent.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import makeRefDefinition from '../buildRefs/makeRefDefinition.js';
import { resolve, WalkContext, cloneForResolve, tagRefDeep } from '../buildRefs/walker.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';
import writeMaps from '../writeMaps.js';
import detectMissingIcons from './detectMissingIcons.js';
import detectMissingPluginPackages from './detectMissingPluginPackages.js';
import updateIconImportsJit from './updateIconImportsJit.js';
import updateServerPackageJsonJit from './updateServerPackageJsonJit.js';
import validatePageTypes from './validatePageTypes.js';
import writePageJit from './writePageJit.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

async function updateDynamicIcons({ page, context }) {
  if (!context.iconImports) return;
  const missingIcons = detectMissingIcons({ page, iconImports: context.iconImports });
  if (missingIcons.length > 0) {
    await updateIconImportsJit({
      newIcons: missingIcons,
      iconImports: context.iconImports,
      context,
    });
  }
}

async function buildPageJit({ pageId, pageRegistry, context, directories, logger }) {
  // Use provided context or create a minimal one for JIT builds
  const buildContext =
    context ??
    createContext({
      directories,
      logger: logger ?? console,
      stage: 'dev',
    });

  const pageEntry = type.isFunction(pageRegistry.get)
    ? pageRegistry.get(pageId)
    : pageRegistry[pageId];

  if (!pageEntry) {
    return null;
  }

  // Reset errors and warnings for this build. Keep local references so that
  // concurrent JIT builds (different pages sharing buildContext) cannot corrupt
  // our lists by reassigning during an await.
  const buildErrors = [];
  const buildWarnings = [];
  buildContext.errors = buildErrors;
  buildContext.warnings = buildWarnings;

  try {
    // Pages without a source file (e.g., default 404) can only be served from
    // their pre-built artifact — they have no YAML to re-resolve from.
    // All user pages (with refId) always JIT-resolve from source YAML so that
    // page-only edits are picked up without a skeleton rebuild.
    if (!pageEntry.refId) {
      const pagePath = path.join(buildContext.directories.build, 'pages', `${pageId}.json`);
      try {
        const content = await fs.promises.readFile(pagePath, 'utf8');
        const page = serializer.deserialize(JSON.parse(content));

        await updateDynamicIcons({ page, context: buildContext });
        return page;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }

    // If this is a module page, set up module context
    let moduleDependencies = null;
    let moduleEntry = null;
    if (pageEntry.moduleEntryId) {
      moduleEntry = buildContext.modules[pageEntry.moduleEntryId];
      moduleDependencies = moduleEntry?.moduleDependencies ?? null;
    }

    // Resolve the page file from scratch using the source file path determined
    // by createPageRegistry's parent chain walk.
    if (!pageEntry.refPath && !pageEntry.resolverOriginal) {
      throw new ConfigError(
        `Page "${pageId}" has no source file reference. Cannot resolve page content.`
      );
    }

    // Resolve unresolved vars (which may contain inner _ref objects) fresh from disk.
    // For resolver pages, unresolved vars live in resolverOriginal.vars (single source).
    // For file-backed pages, they're stored separately in unresolvedVars.
    const unresolvedVars = pageEntry.unresolvedVars ?? pageEntry.resolverOriginal?.vars;
    let resolvedVars = null;
    if (unresolvedVars) {
      const varRefDef = makeRefDefinition({}, null, buildContext.refMap);
      const varCtx = new WalkContext({
        buildContext,
        refId: varRefDef.id,
        sourceRefId: null,
        vars: {},
        moduleDependencies,
        moduleEntry: moduleEntry ?? null,
        moduleRoot: moduleEntry?.moduleRoot ?? null,
        packageRoot: moduleEntry?.packageRoot ?? null,
        path: '',
        currentFile: pageEntry.refPath ?? pageEntry.resolverOriginal?.resolver ?? '',
        refChain: new Set(),
        operators,
        env: process.env,
        dynamicIdentifiers,
        shouldStop: null,
      });
      resolvedVars = await resolve(cloneForResolve(unresolvedVars), varCtx);
    }

    let refDef;
    if (pageEntry.resolverOriginal) {
      const resolverDefinition = resolvedVars
        ? { ...pageEntry.resolverOriginal, vars: resolvedVars }
        : pageEntry.resolverOriginal;
      refDef = makeRefDefinition(resolverDefinition, null, buildContext.refMap);
      buildContext.refMap[refDef.id].path = null;
    } else {
      const refDefinition = resolvedVars
        ? { path: pageEntry.refPath, vars: resolvedVars }
        : pageEntry.refPath;
      refDef = makeRefDefinition(refDefinition, null, buildContext.refMap);
      buildContext.refMap[refDef.id].path = refDef.path;
    }

    const pageContent = await getRefContent({
      context: buildContext,
      refDef,
      referencedFrom: null,
    });
    const pageCtx = new WalkContext({
      buildContext,
      refId: refDef.id,
      sourceRefId: null,
      vars: refDef.vars ?? {},
      moduleDependencies,
      moduleEntry: moduleEntry ?? null,
      moduleRoot: moduleEntry?.moduleRoot ?? null,
      packageRoot: moduleEntry?.packageRoot ?? null,
      path: '',
      currentFile: refDef.path ?? '',
      refChain: new Set(),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });
    let processed = await resolve(pageContent, pageCtx);
    processed = evaluateStaticOperators({
      context: buildContext,
      input: processed,
      refDef,
    });

    // When resolving from a collection file (with vars), the result is an array of pages.
    // Find the specific page by ID. For module pages, source IDs are unscoped.
    if (type.isArray(processed)) {
      const unscopedId = moduleEntry ? pageId.slice(`${moduleEntry.id}/`.length) : pageId;
      processed = processed.find((p) => type.isObject(p) && p.id === unscopedId);
      if (!processed) {
        throw new ConfigError(`Page "${pageId}" not found in resolved page source file.`);
      }
    }

    // JIT builds resolve from source YAML — the page ID is unscoped for module pages
    if (moduleEntry && type.isObject(processed) && processed.id) {
      processed.id = `${moduleEntry.id}/${processed.id}`;
    }

    // Tag all objects with ~r for ref provenance (normally done inside _ref
    // resolution by the walker; JIT resolves the page file directly).
    tagRefDeep(processed, refDef.id);

    // Apply skeleton-computed auth (buildAuth ran during skeleton build)
    processed.auth = pageEntry.auth;

    // Add keys to the resolved page
    addKeys({ components: processed, context: buildContext });

    // Write keyMap/refMap so the error handler reads JIT entries from disk.
    // JIT addKeys assigns fresh ~k values that aren't in the skeleton keyMap.
    await writeMaps({ context: buildContext });

    // Initialize action ref collections for buildPage (normally done by buildPages)
    if (!buildContext.linkActionRefs) {
      buildContext.linkActionRefs = [];
    }
    if (!buildContext.callApiActionRefs) {
      buildContext.callApiActionRefs = [];
    }

    // Build the page (validation, block processing)
    const checkDuplicatePageId = createCheckDuplicateId({
      message: 'Duplicate pageId "{{ id }}".',
    });
    buildPage({ page: processed, index: 0, context: buildContext, checkDuplicatePageId });

    // Validate that all page-level types (blocks, actions, operators) exist
    validatePageTypes({ context: buildContext });

    // Detect plugin packages that are in typesMap but not installed in server
    const missingPackages = detectMissingPluginPackages({
      context: buildContext,
      installedPluginPackages: buildContext.installedPluginPackages,
    });
    if (missingPackages.size > 0) {
      if (buildContext.directories.server) {
        await updateServerPackageJsonJit({
          directories: buildContext.directories,
          missingPackages,
        });
      }
      return { installing: true, packages: [...missingPackages.keys()] };
    }

    // Detect icons in the JIT-resolved page that weren't discovered during skeleton build.
    // Placed after detectMissingPluginPackages so we skip this when packages are being
    // installed (the server restarts and icons will be discovered on the next build).
    await updateDynamicIcons({ page: processed, context: buildContext });

    // Validate link, state, payload, and server-state references
    const pageIds = Object.keys(pageRegistry);
    validateLinkReferences({
      linkActionRefs: buildContext.linkActionRefs,
      pageIds,
      context: buildContext,
    });
    const endpointConfigs = type.isArray(buildContext.components?.api)
      ? buildContext.components.api
      : [];
    validateCallApiRefs({
      callApiActionRefs: buildContext.callApiActionRefs,
      endpointConfigs,
      context: buildContext,
    });
    validateStateReferences({ page: processed, context: buildContext });
    validatePayloadReferences({ page: processed, context: buildContext });
    validateServerStateReferences({ page: processed, context: buildContext });

    // Extract JS functions from the page
    const pageRequests = [...(processed.requests ?? [])];
    delete processed.requests;
    const cleanPage = jsMapParser({ input: processed, jsMap: buildContext.jsMap, env: 'client' });
    const cleanRequests = jsMapParser({
      input: pageRequests,
      jsMap: buildContext.jsMap,
      env: 'server',
    });
    const finalPage = { ...cleanPage, requests: cleanRequests };

    // Check for collected errors from validation steps
    if (buildErrors.length > 0) {
      const error = new ConfigError(
        `Page "${pageId}" build failed with ${buildErrors.length} error(s).`
      );
      error.buildErrors = buildErrors;
      throw error;
    }

    // Write page artifacts
    await writePageJit({ page: finalPage, context: buildContext });

    // Attach warnings after disk write so they don't persist in artifacts
    if (buildWarnings.length > 0) {
      finalPage._warnings = buildWarnings.map((w) => ({
        type: w.name ?? 'ConfigWarning',
        message: w.message,
        source: w.source ?? null,
        stack: w.stack ?? null,
      }));
    }

    return finalPage;
  } catch (err) {
    // Attach any collected errors to the thrown error
    if (buildErrors.length > 0 && !err.buildErrors) {
      err.buildErrors = [err, ...buildErrors];
    }
    if (err.isLowdefyError) {
      throw err;
    }
    const lowdefyErr = new LowdefyInternalError(err.message, { cause: err });
    lowdefyErr.buildErrors = err.buildErrors;
    throw lowdefyErr;
  }
}

export default buildPageJit;
