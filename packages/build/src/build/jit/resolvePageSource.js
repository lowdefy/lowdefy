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
import { ConfigError } from '@lowdefy/errors';

import operators from '@lowdefy/operators-js/operators/build';

import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import precomputeRuntimeOperators from '../buildRefs/precomputeRuntimeOperators.js';
import getRefContent from '../buildRefs/getRefContent.js';
import makeRefDefinition from '../buildRefs/makeRefDefinition.js';
import rebaseModuleRefPaths from '../buildRefs/rebaseModuleRefPaths.js';
import runTransformer from '../buildRefs/runTransformer.js';
import { resolve, WalkContext } from '../buildRefs/walker.js';
import cloneWithMarkers from '../buildRefs/cloneWithMarkers.js';
import isPageContentPath from './isPageContentPath.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

// Resolves one page's config from its source file, as the full build's ref
// walk would: vars, refs, transformer and static operators, with a module
// page's id scoped to its entry.
// With skipContent, the page's content keys are dropped unwalked, as the
// skeleton build drops them, so the files they ref are not read and the other
// keys (id, path, auth) resolve as they do for routes.json.
async function resolvePageSource({ pageId, pageEntry, buildContext, skipContent = false }) {
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
      lowdefyApp: buildContext.appMeta,
      dynamicIdentifiers,
      shouldStop: null,
    });
    resolvedVars = await resolve(cloneWithMarkers(unresolvedVars), varCtx);
  }

  let refDef;
  if (pageEntry.resolverOriginal) {
    const resolverDefinition = resolvedVars
      ? { ...pageEntry.resolverOriginal, vars: resolvedVars }
      : pageEntry.resolverOriginal;
    refDef = makeRefDefinition(resolverDefinition, null, buildContext.refMap);
    buildContext.refMap[refDef.id].path = null;
  } else {
    const refDefinition = { path: pageEntry.refPath };
    if (resolvedVars) {
      refDefinition.vars = resolvedVars;
    }
    if (pageEntry.transformer) {
      refDefinition.transformer = pageEntry.transformer;
    }
    refDef = makeRefDefinition(refDefinition, null, buildContext.refMap);
    buildContext.refMap[refDef.id].path = refDef.path;
  }

  // Module path resolution: resolve relative path/resolver/transformer from the
  // module root. The full build does this in walker.js step 4 when an _ref node
  // is encountered, but the JIT path builds the page refDef directly from
  // resolverOriginal (the un-rebased authored _ref) and calls getRefContent
  // without going through the walker — so a module resolver like
  // "resolvers/makeActionPages.js" would otherwise resolve against the app
  // config dir instead of the module root. (File-based module pages are
  // unaffected: their paths are stored already-rebased in refMap.)
  if (moduleEntry?.moduleRoot) {
    rebaseModuleRefPaths({ refDef, moduleRoot: moduleEntry.moduleRoot });
    if (type.isString(refDef.path)) {
      buildContext.refMap[refDef.id].path = refDef.path;
    }
  }

  const pageContent = await getRefContent({
    context: buildContext,
    refDef,
    referencedFrom: null,
  });
  let shouldStop = null;
  if (skipContent) {
    // Walker paths here start at the page file; the skeleton's start at the
    // pages array in lowdefy.yaml.
    shouldStop = (jsonPath) => isPageContentPath(`pages.${jsonPath}`);
  }
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
    lowdefyApp: buildContext.appMeta,
    dynamicIdentifiers,
    shouldStop,
  });
  let processed = await resolve(pageContent, pageCtx);
  // The walker runs a ref's transformer after walking its content; the page's
  // own ref is not walked here, so its transformer runs here.
  processed = await runTransformer({
    context: buildContext,
    input: processed,
    refDef,
    referencedFrom: null,
  });
  processed = precomputeRuntimeOperators({
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

  return { page: processed, refDef };
}

export default resolvePageSource;
