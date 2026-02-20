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

import { type } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import addKeys from '../addKeys.js';
import buildPage from '../buildPages/buildPage.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createContext from '../../createContext.js';
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
  const buildContext = context ?? createContext({
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

  try {
    // Resolve the page file from scratch — same as a normal full build of the page file.
    // The refId traces back to the refMap entry with the page's source file path.
    const storedRef = buildContext.refMap[pageEntry.refId];
    if (!storedRef?.path) {
      throw new ConfigError(
        `Page "${pageId}" has no source file reference. Cannot resolve page content.`
      );
    }
    const refDef = makeRefDefinition(storedRef.path, null, buildContext.refMap);
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
    if (buildContext.errors.length > 0) {
      const error = new ConfigError(
        `Page "${pageId}" build failed with ${buildContext.errors.length} error(s).`
      );
      error.buildErrors = buildContext.errors;
      throw error;
    }

    // Write page artifacts
    await writePageJit({ page: finalPage, context: buildContext });

    return finalPage;
  } catch (err) {
    // Attach any collected errors to the thrown error
    if (buildContext.errors.length > 0 && !err.buildErrors) {
      err.buildErrors = [err, ...buildContext.errors];
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
