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

import operators from '@lowdefy/operators-js/operators/build';

import { resolve, WalkContext, cloneForResolve } from './buildRefs/walker.js';
import getRefContent from './buildRefs/getRefContent.js';
import makeRefDefinition from './buildRefs/makeRefDefinition.js';
import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import validateOperatorsDynamic from './validateOperatorsDynamic.js';
import fetchModules from './fetchModules.js';
import {
  resolveLocalManifest,
  resolveFullManifest,
  validateRequiredVars,
} from './registerModules.js';
import resolveModuleDependencies from './resolveModuleDependencies.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

async function parseLowdefyYaml({ context }) {
  const refDef = makeRefDefinition('lowdefy.yaml', null, context.refMap);
  // Stash for Phase 2.5 — consumer vars come from lowdefy.yaml, so refs
  // within them must be parented to lowdefy.yaml's refDef.
  context.lowdefyYamlRefDef = refDef;

  const content = await getRefContent({
    context,
    refDef,
    referencedFrom: null,
  });

  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: {},
    path: '',
    currentFile: refDef.path,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    lowdefyApp: context.appMeta,
    dynamicIdentifiers,
    shouldStop: (path) => {
      // Defer entry vars and connections: they may contain cross-module
      // refs that require modules to be registered first.
      if (/^modules\.\d+\.vars$/.test(path)) return 'preserve';
      if (/^modules\.\d+\.connections$/.test(path)) return 'preserve';
      if (path.startsWith('modules')) return false;
      return 'preserve';
    },
  });

  const config = await resolve(content, ctx);
  return config ?? {};
}

function makeAppLevelCtx({ context, deferModuleRefs = false, entryResolveChain }) {
  const lowdefyYamlRefDef = context.lowdefyYamlRefDef;
  return new WalkContext({
    buildContext: context,
    refId: lowdefyYamlRefDef.id,
    sourceRefId: null,
    vars: {},
    path: '',
    currentFile: lowdefyYamlRefDef.path,
    refChain: new Set(lowdefyYamlRefDef.path ? [lowdefyYamlRefDef.path] : []),
    operators,
    env: process.env,
    lowdefyApp: context.appMeta,
    dynamicIdentifiers,
    deferModuleRefs,
    ...(entryResolveChain !== undefined ? { entryResolveChain } : {}),
  });
}

async function prepareEntryConfig({ moduleEntry, context }) {
  if (moduleEntry.entryConfigState !== 'registered') return;

  const varsResult = await resolve(
    moduleEntry.consumerVars,
    makeAppLevelCtx({ context, deferModuleRefs: true })
  );
  moduleEntry.consumerVars = varsResult ?? {};

  const connectionsResult = await resolve(
    moduleEntry.connections,
    makeAppLevelCtx({ context, deferModuleRefs: true })
  );
  moduleEntry.connections = connectionsResult ?? {};

  moduleEntry.entryConfigState = 'structural';
}

async function finalizeEntryConfig({ moduleEntry, context, callerChain }) {
  moduleEntry.entryConfigState = 'resolving';

  const entryResolveChain = new Set([...(callerChain ?? []), moduleEntry.id]);

  const resolvedVars = await resolve(
    cloneForResolve(moduleEntry.consumerVars),
    makeAppLevelCtx({ context, deferModuleRefs: false, entryResolveChain })
  );
  const resolvedConnections = await resolve(
    cloneForResolve(moduleEntry.connections),
    makeAppLevelCtx({ context, deferModuleRefs: false, entryResolveChain })
  );

  validateRequiredVars(moduleEntry.varDefs, resolvedVars, moduleEntry.id, moduleEntry.source);

  moduleEntry.consumerVars = resolvedVars ?? {};
  moduleEntry.connections = resolvedConnections ?? {};

  moduleEntry.entryConfigState = 'resolved';
}

function ensureEntryConfigResolved(moduleEntry, context, callerChain) {
  if (moduleEntry.entryConfigState === 'resolved') return Promise.resolve();
  if (moduleEntry.finalizePromise) return moduleEntry.finalizePromise;
  // Assign the promise SYNCHRONOUSLY so concurrent sibling demands coalesce onto
  // one finalize. Sweep 2.5a guarantees every entry is already 'structural' here,
  // so prepare is a no-op and never introduces an await before the assignment.
  moduleEntry.finalizePromise = (async () => {
    if (moduleEntry.entryConfigState === 'registered') {
      await prepareEntryConfig({ moduleEntry, context });
    }
    await finalizeEntryConfig({ moduleEntry, context, callerChain });
  })();
  return moduleEntry.finalizePromise;
}

async function buildModuleDefs({ context }) {
  const lowdefyConfig = await parseLowdefyYaml({ context });
  context.plugins = lowdefyConfig.plugins ?? [];
  const moduleEntries = lowdefyConfig.modules ?? [];

  if (moduleEntries.length === 0) {
    return;
  }

  const resolvedPaths = await fetchModules({ moduleEntries, context });

  // Step 1: Local resolve — concrete arrays, preserved content, exports/deps extracted
  for (const entry of moduleEntries) {
    await resolveLocalManifest({
      entry,
      resolvedPaths: resolvedPaths[entry.id],
      context,
    });
  }

  // Step 2: Auto-wire and validate dependency wiring
  resolveModuleDependencies({ context });

  context.ensureEntryConfigResolved = (moduleEntry, callerChain) =>
    ensureEntryConfigResolved(moduleEntry, context, callerChain);

  // Step 2.5a — prepare all entries. No cross-entry work; order-free.
  for (const entry of moduleEntries) {
    await prepareEntryConfig({ moduleEntry: context.modules[entry.id], context });
  }
  // Step 2.5b — finalize all entries. Demand-driven ordering via ensure;
  // entries finalized transitively are skipped by the memo.
  for (const entry of moduleEntries) {
    await context.ensureEntryConfigResolved(context.modules[entry.id]);
  }

  // Step 3: Full resolve — cross-module refs, preserved content
  for (const entryId of Object.keys(context.modules)) {
    await resolveFullManifest({ entryId, context });
  }
}

export default buildModuleDefs;
