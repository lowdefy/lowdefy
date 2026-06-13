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
import { createRequire } from 'module';
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import { createScope, bindModuleEntry } from '@lowdefy/compile/runtime';

import collectExceptions from '../utils/collectExceptions.js';
import makeId from '../utils/makeId.js';

// Compiled modules live in a tmp directory with no node_modules — the
// runtime import is emitted as a relative path to the resolved package.
const require = createRequire(import.meta.url);
const runtimePath = fs.realpathSync(
  path.join(path.dirname(require.resolve('@lowdefy/compile')), 'runtime/index.js')
);

// Build-injected pieces shared by every compiled factory run (the app entry
// in compileRefs, manifest content factories in registration).

// Instance ref ids are global tree paths with a counter fallback on
// collision — the build owns the counter and the refMap.
function makeRefTracker(context) {
  return {
    alloc: (globalPath, refMapEntry) => {
      const id =
        globalPath != null && context.refMap[globalPath] === undefined ? globalPath : makeId.next();
      context.refMap[id] = refMapEntry;
      return id;
    },
    setPath: (id, refPath) => {
      context.refMap[id].path = refPath;
    },
    // Module refs have a null path — the walker stores the raw def.
    setOriginal: (id, original) => {
      context.refMap[id].original = original;
    },
  };
}

// Content/resolver scope file access (E1): the build's cached config reader,
// a config-root existence check, the config root for user-JS imports, and the
// build context handed to resolver functions — walker getConfigFile /
// runRefResolver parity.
function makeScopeFileAccess(context) {
  return {
    configDir: context.directories.config,
    readConfigFile: (refPath) => context.readConfigFile(refPath),
    fileExists: (refPath) => fs.existsSync(path.resolve(context.directories.config, refPath)),
    resolverContext: context,
  };
}

// A compiled-factory scope rooted at a module manifest: the registration
// binding and the shared refMap/id tracker.
function makeManifestScope(context, moduleEntry) {
  const moduleYamlPath = path.join(moduleEntry.moduleRoot, 'module.lowdefy.yaml');
  return createScope({
    vars: {},
    file: moduleYamlPath,
    refChain: [moduleYamlPath],
    onError: (error) => {
      collectExceptions(context, error);
    },
    env: process.env,
    refId: moduleEntry.refDef.id,
    walkPath: '',
    refTracker: makeRefTracker(context),
    getModuleEntry: (id) => context.modules?.[id],
    resolveModuleVarDefault: makeResolveModuleVarDefault(context),
    ...makeScopeFileAccess(context),
    importSource: moduleEntry.compiledManifestImportSource ?? null,
    module: bindModuleEntry({
      id: moduleEntry.id,
      consumerVars: moduleEntry.consumerVars ?? {},
      varDefs: moduleEntry.varDefs ?? {},
      connections: moduleEntry.connections ?? {},
      deps: moduleEntry.moduleDependencies ?? {},
      resolvedVarCache: moduleEntry.resolvedVarCache,
    }),
  });
}

// resolveVarDefault: structured module-var defaults resolve through the
// compiled default factory (D7c — collected from every compiled manifest).
// The importSource fallback compiles a raw default on demand for any default
// not pre-collected as a factory (defensive — both manifest compile passes
// collect var-default factories).
function makeResolveModuleVarDefault(context) {
  return async (rawDefault, entryId, key) => {
    const moduleEntry = context.modules[entryId];
    const compiledDefault = key ? moduleEntry.compiledVarDefaults?.[key] : undefined;
    if (compiledDefault) {
      return compiledDefault(makeManifestScope(context, moduleEntry));
    }
    const scope = makeManifestScope(context, moduleEntry);
    if (!scope.importSource || (!type.isObject(rawDefault) && !type.isArray(rawDefault))) {
      return rawDefault;
    }
    const label = `module:${entryId}/var:${key}`;
    const mod = await scope.importSource(YAML.stringify(rawDefault), label);
    return mod.default(scope);
  };
}

// D7a: `_ref: {module, component}` whose manifest export is a plain file ref
// compiles — resolves the registration to an absolute target. moduleDeps maps
// module names through the consuming module's dependency wiring (inside
// manifests); at the app level names are registration ids directly.
function makeResolveModuleExport(context, moduleDeps = null) {
  return ({ module: rawName, component }) => {
    const entryId = moduleDeps && rawName in moduleDeps ? moduleDeps[rawName] : rawName;
    const entry = context.modules?.[entryId];
    if (!entry?.moduleRoot) return null;
    const index = (entry.manifest?.components ?? []).findIndex((c) => c?.id === component);
    const defNode = entry.manifest?.components?.[index]?.component;
    if (!defNode) return null;
    // Plain file-target export: a static import of the compiled target.
    if (Object.keys(defNode).length === 1) {
      let refPath = null;
      if (typeof defNode._ref === 'string') {
        refPath = defNode._ref;
      } else if (
        defNode._ref &&
        typeof defNode._ref === 'object' &&
        typeof defNode._ref.path === 'string' &&
        Object.keys(defNode._ref).every((k) => k === 'path')
      ) {
        refPath = defNode._ref.path;
      }
      if (refPath !== null && !path.isAbsolute(refPath)) {
        return {
          kind: 'file',
          cfgPath: path.resolve(entry.moduleRoot, refPath),
          moduleRoot: entry.moduleRoot,
          entryId,
          exportName: component,
          innerRefLine: defNode['~l'],
          manifestFile:
            defNode['~deferredFrom'] ?? path.join(entry.moduleRoot, 'module.lowdefy.yaml'),
        };
      }
    }
    // Inline export: the compiled manifest exposes it as a factory keyed by
    // component index (D7c) — claimed only when the factory verifiably
    // exists (operator-built export lists collect none; compile order may
    // not have reached the target yet). Everything else resolves through
    // the runtime registry mode.
    if (entry.compiledManifest && entry.compiledFactories?.[`component:${index}`]) {
      return {
        kind: 'inline',
        entryId,
        exportName: component,
        factoryKey: `component:${index}`,
      };
    }
    return null;
  };
}

// D7c manifest factory exports: inline component contents and structured var
// defaults compile as factories alongside their raw preserve-zone data.
function manifestFactoryKey(wp) {
  const componentMatch = wp.match(/^components\.(\d+)\.component$/);
  if (componentMatch) {
    return `component:${componentMatch[1]}`;
  }
  if (/^vars(\.[^.]+\.properties)*\.[^.]+\.default$/.test(wp)) {
    return `varDefault:${wp}`;
  }
  return null;
}

export {
  makeRefTracker,
  makeScopeFileAccess,
  makeResolveModuleVarDefault,
  makeResolveModuleExport,
  makeManifestScope,
  manifestFactoryKey,
  runtimePath,
};
