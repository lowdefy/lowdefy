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
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

// Resolves the file a page or endpoint is built from, as the full build's ref
// walk would: vars, refs, transformer and static operators. The entry is the
// one createPageRegistry or createEndpointRegistry recorded: the file's path,
// its unresolved vars, its transformer, or the resolver that makes it, and the
// module entry it belongs to. A file can hold several items, so the result is
// the file's whole content; the caller picks its item.
async function resolveSourceFile({ entry, buildContext, label, shouldStop = null }) {
  // If this is a module item, set up module context
  let moduleDependencies = null;
  let moduleEntry = null;
  if (entry.moduleEntryId) {
    moduleEntry = buildContext.modules[entry.moduleEntryId];
    moduleDependencies = moduleEntry?.moduleDependencies ?? null;
  }

  if (!entry.refPath && !entry.resolverOriginal) {
    throw new ConfigError(`${label} has no source file reference. Cannot resolve its content.`);
  }

  // Resolve unresolved vars (which may contain inner _ref objects) fresh from disk.
  // For resolver items, unresolved vars live in resolverOriginal.vars (single source).
  // For file-backed items, they're stored separately in unresolvedVars.
  const unresolvedVars = entry.unresolvedVars ?? entry.resolverOriginal?.vars;
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
      currentFile: entry.refPath ?? entry.resolverOriginal?.resolver ?? '',
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
  if (entry.resolverOriginal) {
    const resolverDefinition = resolvedVars
      ? { ...entry.resolverOriginal, vars: resolvedVars }
      : entry.resolverOriginal;
    refDef = makeRefDefinition(resolverDefinition, null, buildContext.refMap);
    buildContext.refMap[refDef.id].path = null;
  } else {
    const refDefinition = { path: entry.refPath };
    if (resolvedVars) {
      refDefinition.vars = resolvedVars;
    }
    if (entry.transformer) {
      refDefinition.transformer = entry.transformer;
    }
    refDef = makeRefDefinition(refDefinition, null, buildContext.refMap);
    buildContext.refMap[refDef.id].path = refDef.path;
  }

  // Module path resolution: resolve relative path/resolver/transformer from the
  // module root. The full build does this in walker.js step 4 when an _ref node
  // is encountered, but the JIT path builds the refDef directly from
  // resolverOriginal (the un-rebased authored _ref) and calls getRefContent
  // without going through the walker — so a module resolver like
  // "resolvers/makeActionPages.js" would otherwise resolve against the app
  // config dir instead of the module root. (File-based module items are
  // unaffected: their paths are stored already-rebased in refMap.)
  if (moduleEntry?.moduleRoot) {
    rebaseModuleRefPaths({ refDef, moduleRoot: moduleEntry.moduleRoot });
    if (type.isString(refDef.path)) {
      buildContext.refMap[refDef.id].path = refDef.path;
    }
  }

  const content = await getRefContent({
    context: buildContext,
    refDef,
    referencedFrom: null,
  });
  const ctx = new WalkContext({
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
  let processed = await resolve(content, ctx);
  // The walker runs a ref's transformer after walking its content; the
  // file's own ref is not walked here, so its transformer runs here.
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

  return { content: processed, moduleEntry, refDef };
}

export default resolveSourceFile;
