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
import { compileDir } from '@lowdefy/compile';
import { createScope } from '@lowdefy/compile/runtime';

import evaluateStaticOperators from './evaluateStaticOperators.js';
import fetchModules from './fetchModules.js';
import {
  resolveLocalManifest,
  compileManifest,
  resolveFullManifest,
  validateRequiredVars,
} from './registerModules.js';
import { makeRefTracker, makeScopeFileAccess, runtimePath } from './compileScopeTools.js';
import collectExceptions from '../utils/collectExceptions.js';
import makeId from '../utils/makeId.js';
import resolveModuleDependencies from './resolveModuleDependencies.js';

// Phase-1 zones: only the modules registration zone resolves; entry vars and
// connections stay raw — they may contain cross-module refs that need the
// registry (phase 2.5 factories) — and everything else is phase-2 content.
function entryPreserveZones(wp) {
  if (/^modules\.\d+\.(vars|connections)(\..*)?$/.test(wp)) return true;
  if (wp === 'modules' || wp.startsWith('modules.')) return false;
  return true;
}

function entryFactoryKey(wp) {
  const match = wp.match(/^modules\.(\d+)\.(vars|connections)$/);
  return match ? `${match[2]}:${match[1]}` : null;
}

// Phase 1: lowdefy.yaml's modules zone resolves through its compiled factory;
// the preserved vars/connections zones double as factories for phase 2.5
// (cross-module refs in entry vars resolve against the registry).
async function parseLowdefyYaml({ context }) {
  const configDir = context.directories.config;
  let entry = 'lowdefy.yaml';
  if (
    !fs.existsSync(path.join(configDir, 'lowdefy.yaml')) &&
    fs.existsSync(path.join(configDir, 'lowdefy.yml'))
  ) {
    entry = 'lowdefy.yml';
  }

  // Root refDef: counter id, path-less refMap entry, stashed for phase-2.5
  // parenting.
  const rootId = makeId.next();
  context.refMap[rootId] = { parent: null, lineNumber: undefined };
  const refDef = { id: rootId, parent: null, lineNumber: undefined, path: entry, vars: {} };
  context.lowdefyYamlRefDef = refDef;

  fs.mkdirSync(context.directories.build, { recursive: true });
  const outDir = fs.realpathSync(
    fs.mkdtempSync(path.join(context.directories.build, '.compile-defs-'))
  );
  const result = await compileDir({
    configDir,
    outDir,
    entry,
    mode: 'markers',
    runtimePath,
    refResolver: context.refResolver ?? null,
    entryPreserveZones,
    entryCollectFactoryExports: entryFactoryKey,
  });
  const mod = await import(result.entryUrl);

  function makeAppLevelScope() {
    return createScope({
      vars: {},
      importer: result.importer,
      importSource: result.importSource,
      file: entry,
      refChain: [entry],
      onError: (error) => {
        collectExceptions(context, error);
      },
      env: process.env,
      refId: rootId,
      walkPath: '',
      refTracker: makeRefTracker(context),
      getModuleEntry: (id) => context.modules?.[id],
      ...makeScopeFileAccess(context),
    });
  }
  context.lowdefyEntryFactories = mod.factories ?? {};
  context.makeAppLevelScope = makeAppLevelScope;

  let config = await mod.default(makeAppLevelScope());
  config = evaluateStaticOperators({ context, input: config, refDef });
  return config ?? {};
}

async function resolveEntryConfig({ entry, index, context }) {
  const moduleEntry = context.modules[entry.id];
  const refDef = context.lowdefyYamlRefDef;

  // Phase-2.5 factories from the compiled lowdefy.yaml — registry-aware
  // (cross-module refs in entry vars resolve against registered modules).
  const varsFactory = context.lowdefyEntryFactories[`vars:${index}`];
  let resolvedVars = varsFactory
    ? await varsFactory(context.makeAppLevelScope())
    : moduleEntry.consumerVars;
  resolvedVars = evaluateStaticOperators({ context, input: resolvedVars, refDef });
  moduleEntry.consumerVars = resolvedVars ?? {};

  const connectionsFactory = context.lowdefyEntryFactories[`connections:${index}`];
  let resolvedConnections = connectionsFactory
    ? await connectionsFactory(context.makeAppLevelScope())
    : moduleEntry.connections;
  resolvedConnections = evaluateStaticOperators({
    context,
    input: resolvedConnections,
    refDef,
  });
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
  for (const [index, entry] of moduleEntries.entries()) {
    await resolveEntryConfig({ entry, index, context });
  }

  // Step 3: Full resolve — cross-module refs, preserved content. Compiled
  // manifests compile (and register their factory exports) before any
  // content factory runs, so cross-module consumption is order-independent.
  for (const entryId of Object.keys(context.modules)) {
    await compileManifest({ entryId, context });
  }
  for (const entryId of Object.keys(context.modules)) {
    await resolveFullManifest({ entryId, context });
  }
}

export default buildModuleDefs;
