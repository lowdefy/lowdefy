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

async function resolveEntryConfig({ entry, context }) {
  const moduleEntry = context.modules[entry.id];
  const lowdefyYamlRefDef = context.lowdefyYamlRefDef;

  function makeAppLevelCtx() {
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
    });
  }

  const resolvedVars = await resolve(moduleEntry.consumerVars, makeAppLevelCtx());
  moduleEntry.consumerVars = resolvedVars ?? {};

  const resolvedConnections = await resolve(moduleEntry.connections, makeAppLevelCtx());
  moduleEntry.connections = resolvedConnections ?? {};

  validateRequiredVars(moduleEntry.varDefs, moduleEntry.consumerVars, entry.id, entry.source);
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

  // Step 2.5: Resolve deferred entry vars and connections at app level,
  // then validate required vars against the resolved values.
  for (const entry of moduleEntries) {
    await resolveEntryConfig({ entry, context });
  }

  // Step 3: Full resolve — cross-module refs, preserved content
  for (const entryId of Object.keys(context.modules)) {
    await resolveFullManifest({ entryId, context });
  }
}

export default buildModuleDefs;
