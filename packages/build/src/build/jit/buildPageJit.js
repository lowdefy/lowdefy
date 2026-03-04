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

import addKeys from '../addKeys.js';
import buildPage from '../buildPages/buildPage.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createContext from '../../createContext.js';
import createRefReviver from '../buildRefs/createRefReviver.js';
import evaluateBuildOperators from '../buildRefs/evaluateBuildOperators.js';
import evaluateStaticOperators from '../buildRefs/evaluateStaticOperators.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import makeRefDefinition from '../buildRefs/makeRefDefinition.js';
import recursiveBuild from '../buildRefs/recursiveBuild.js';
import detectMissingPluginPackages from './detectMissingPluginPackages.js';
import updateServerPackageJsonJit from './updateServerPackageJsonJit.js';
import validatePageTypes from './validatePageTypes.js';
import writePageJit from './writePageJit.js';

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

  // Reset errors for this build. Keep a local reference so that concurrent
  // JIT builds (different pages sharing buildContext) cannot corrupt our
  // error list by reassigning buildContext.errors during an await.
  const buildErrors = [];
  buildContext.errors = buildErrors;

  try {

    // Pages without a source file (e.g., default 404) can only be served from
    // their pre-built artifact — they have no YAML to re-resolve from.
    // All user pages (with refId) always JIT-resolve from source YAML so that
    // page-only edits are picked up without a skeleton rebuild.
    if (!pageEntry.refId) {
      const pagePath = path.join(buildContext.directories.build, 'pages', pageId, `${pageId}.json`);
      try {
        const content = await fs.promises.readFile(pagePath, 'utf8');
        return serializer.deserialize(JSON.parse(content));
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
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
      resolvedVars = await recursiveBuild({
        context: buildContext,
        refDef: varRefDef,
        count: 0,
        content: unresolvedVars,
        referencedFrom: pageEntry.refPath ?? pageEntry.resolverOriginal?.resolver,
      });
      resolvedVars = await evaluateBuildOperators({
        context: buildContext,
        input: resolvedVars,
        refDef: varRefDef,
      });
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

    let processed = await recursiveBuild({
      context: buildContext,
      refDef,
      count: 0,
    });

    // Top-level operator evaluation (same as buildRefs does after recursiveBuild)
    processed = await evaluateBuildOperators({
      context: buildContext,
      input: processed,
      refDef,
    });
    processed = evaluateStaticOperators({
      context: buildContext,
      input: processed,
      refDef,
    });

    // When resolving from a collection file (with vars), the result is an array of pages.
    // Find the specific page by ID.
    if (type.isArray(processed)) {
      processed = processed.find((p) => type.isObject(p) && p.id === pageId);
      if (!processed) {
        throw new ConfigError(`Page "${pageId}" not found in resolved page source file.`);
      }
    }

    // Stamp root-level content with ~r for correct error file tracing.
    // recursiveBuild stamps child _ref content via createRefReviver, but the
    // root file's own objects have no parent to do this. Without ~r, addKeys
    // can't link objects to their source file and errors fall back to lowdefy.yaml.
    const reviver = createRefReviver(refDef.id);
    processed = serializer.copy(processed, { reviver });

    // Apply skeleton-computed auth (buildAuth ran during skeleton build)
    processed.auth = pageEntry.auth;

    // Add keys to the resolved page
    addKeys({ components: processed, context: buildContext });

    // Initialize linkActionRefs for buildPage (normally done by buildPages)
    if (!buildContext.linkActionRefs) {
      buildContext.linkActionRefs = [];
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

    // Validate link, state, payload, and server-state references
    const pageIds = Object.keys(pageRegistry);
    validateLinkReferences({
      linkActionRefs: buildContext.linkActionRefs,
      pageIds,
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
