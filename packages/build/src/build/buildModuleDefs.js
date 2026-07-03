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

import { resolve, WalkContext } from './buildRefs/walker.js';
import { assertNoPlaceholderLeaks } from './buildRefs/deferredRegistry.js';
import getRefContent from './buildRefs/getRefContent.js';
import makeRefDefinition from './buildRefs/makeRefDefinition.js';
import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import validateOperatorsDynamic from './validateOperatorsDynamic.js';
import fetchModules from './fetchModules.js';
import {
  resolveLocalManifest,
  recordifyExportables,
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

function makeAppLevelCtx({ context, deferModuleRefs = false, entryId, entrySection }) {
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
    entryId,
    entrySection,
  });
}

// Stage 1 — prepare: resolve entry vars/connections in the enclosing (app)
// scope; cross-module refs become entryRef records with the prepared refDef as
// body (their dynamic parts already resolved), leaving placeholders in the
// blobs. Order-free: nothing is consumed here.
async function prepareEntryConfig({ moduleEntry, context }) {
  const varsResult = await resolve(
    moduleEntry.consumerVars,
    makeAppLevelCtx({
      context,
      deferModuleRefs: true,
      entryId: moduleEntry.id,
      entrySection: 'consumerVars',
    })
  );
  moduleEntry.consumerVars = varsResult ?? {};

  const connectionsResult = await resolve(
    moduleEntry.connections,
    makeAppLevelCtx({
      context,
      deferModuleRefs: true,
      entryId: moduleEntry.id,
      entrySection: 'connections',
    })
  );
  moduleEntry.connections = connectionsResult ?? {};
}

// Final sweep: re-walk each entry's blobs with deferral off. Placeholders
// dispatch into resolveDeferred (value-granular demand, wait-graph cycle
// detection — order immaterial, memo skips already-demanded records), and the
// _module.connectionId object form (deferred during prepare) resolves against
// now-prepared targets. In-place walk mutation is the write-back, so resolved
// values land in consumerVars/connections with consumption provenance.
async function sweepEntryConfig({ moduleEntry, context }) {
  const varsResult = await resolve(moduleEntry.consumerVars, makeAppLevelCtx({ context }));
  moduleEntry.consumerVars = varsResult ?? {};

  const connectionsResult = await resolve(moduleEntry.connections, makeAppLevelCtx({ context }));
  moduleEntry.connections = connectionsResult ?? {};

  validateRequiredVars(
    moduleEntry.varDefs,
    moduleEntry.consumerVars,
    moduleEntry.id,
    moduleEntry.source
  );
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

  // Step 2.5a — prepare all entries. No cross-entry work; order-free.
  for (const entry of moduleEntries) {
    await prepareEntryConfig({ moduleEntry: context.modules[entry.id], context });
  }
  // Phase C.5 — record-ify exportables (components, menu links) for every
  // entry BEFORE anything can consume them: record creation must precede all
  // consumption, or cross-entry refs would race manifest resolve order.
  for (const entry of moduleEntries) {
    await recordifyExportables({ entryId: entry.id, context });
  }
  // Step 2.5b — final sweep. Per-record demand through the wait-graph makes
  // the order immaterial; required-var validation runs per entry after its
  // blobs are concrete.
  for (const entry of moduleEntries) {
    await sweepEntryConfig({ moduleEntry: context.modules[entry.id], context });
  }

  // Step 3: Full resolve — cross-module refs, preserved content
  for (const entryId of Object.keys(context.modules)) {
    await resolveFullManifest({ entryId, context });
  }

  // Post-sweep invariant: no deferred placeholder survives outside the
  // per-consumer slots (manifest component/menu bodies, varDefs defaults).
  assertNoPlaceholderLeaks(context);
}

export default buildModuleDefs;
