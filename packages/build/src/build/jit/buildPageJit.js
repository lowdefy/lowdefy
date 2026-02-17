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

import { serializer, type } from '@lowdefy/helpers';
import { ConfigError, LowdefyError } from '@lowdefy/errors';

import addKeys from '../addKeys.js';
import buildPage from '../buildPages/buildPage.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import createRefReviver from '../buildRefs/createRefReviver.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import preserveMetaProperties from '../../utils/preserveMetaProperties.js';
import createContext from '../../createContext.js';
import evaluateBuildOperators from '../buildRefs/evaluateBuildOperators.js';
import evaluateStaticOperators from '../buildRefs/evaluateStaticOperators.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import makeRefDefinition from '../buildRefs/makeRefDefinition.js';
import recursiveBuild from '../buildRefs/recursiveBuild.js';
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
    // Reconstruct raw page with shallow markers
    const rawPage = {
      id: pageEntry.pageId,
      auth: pageEntry.auth,
      type: pageEntry.type,
      ...pageEntry.rawContent,
    };

    // Resolve all ~shallow markers in the page content
    const resolvedPage = await resolveShallowRefs(rawPage, buildContext);

    // Run build operators on the resolved page content
    const dummyRefDef = { id: 'jit-page', path: `jit:${pageId}` };
    let processed = await evaluateBuildOperators({
      context: buildContext,
      input: resolvedPage,
      refDef: dummyRefDef,
    });
    processed = evaluateStaticOperators({
      context: buildContext,
      input: processed,
      refDef: dummyRefDef,
    });

    // Add keys to the resolved page
    addKeys({ components: processed, context: buildContext });

    // Initialize linkActionRefs for buildPage (normally done by buildPages)
    if (!buildContext.linkActionRefs) {
      buildContext.linkActionRefs = [];
    }

    // Build the page (validation, block processing)
    const checkDuplicatePageId = createCheckDuplicateId({
      message: 'Duplicate pageId "{{ id }}".',
      context: buildContext,
    });
    buildPage({ page: processed, index: 0, context: buildContext, checkDuplicatePageId });

    // Validate that all page-level types (blocks, actions, operators) exist
    validatePageTypes({ context: buildContext });

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
      const error = new ConfigError({
        message: `Page "${pageId}" build failed with ${buildContext.errors.length} error(s).`,
      });
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
    if (err instanceof ConfigError) {
      throw err;
    }
    const lowdefyErr = new LowdefyError(err.message, { cause: err });
    lowdefyErr.stack = err.stack;
    lowdefyErr.buildErrors = err.buildErrors;
    throw lowdefyErr;
  }
}

async function resolveShallowRefs(obj, context) {
  if (type.isArray(obj)) {
    const results = [];
    for (const item of obj) {
      results.push(await resolveShallowRefs(item, context));
    }
    return results;
  }

  if (!type.isObject(obj)) {
    return obj;
  }

  // This is a shallow marker - resolve the ref
  if (obj['~shallow'] === true && obj._ref !== undefined) {
    const refDef = makeRefDefinition(obj._ref, null, context.refMap);
    const resolved = await recursiveBuild({
      context,
      refDef,
      count: 0,
    });
    // Set ~r on all objects so addKeys can trace them to the correct source file.
    // In a normal build, the parent's reviver sets ~r on child ref content.
    // Here there is no parent, so we set it explicitly.
    const reviver = createRefReviver(refDef.id);
    return serializer.copy(resolved, { reviver });
  }

  // Recurse into object properties
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = await resolveShallowRefs(obj[key], context);
  }
  // Preserve non-enumerable properties
  preserveMetaProperties(result, obj);
  return result;
}

export default buildPageJit;
