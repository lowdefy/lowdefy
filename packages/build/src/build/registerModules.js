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
import semver from 'semver';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import operators from '@lowdefy/operators-js/operators/build';

import { compileDir } from '@lowdefy/compile';

import { resolve, WalkContext } from './buildRefs/walker.js';
import {
  makeManifestScope,
  makeResolveModuleExport,
  manifestFactoryKey,
  runtimePath,
} from './compileScopeTools.js';
import setNonEnumerableProperty from '../utils/setNonEnumerableProperty.js';
import getRefContent from './buildRefs/getRefContent.js';
import makeRefDefinition from './buildRefs/makeRefDefinition.js';
import evaluateStaticOperators from './buildRefs/evaluateStaticOperators.js';
import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import validateOperatorsDynamic from './validateOperatorsDynamic.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

// D7b zone rules. Content zones compile (refs/operators live); preserve
// zones stay raw data (consumed lazily — var defaults, component defs).
// Anything else is registration meta, which the compiled path extracts from
// the raw parse — a manifest carrying operators/refs there falls back to
// walker registration for that module.
const OP_ALLOWED_ZONES = [
  /^pages(\..*)?$/,
  /^api(\..*)?$/,
  /^connections(\..*)?$/,
  /^menus\.\d+\.links(\..*)?$/,
  /^components\.\d+\.component(\..*)?$/,
  /^vars(\.[^.]+\.properties)*\.[^.]+\.default(\..*)?$/,
];
const MANIFEST_PRESERVE_ZONES = [
  /^vars(\.[^.]+\.properties)*\.[^.]+\.default(\..*)?$/,
  /^components\.\d+\.component$/,
];
const CONTENT_TOP_KEYS = new Set(['pages', 'api', 'connections', 'menus']);

function manifestMetaHasOperators(node, nodePath = '') {
  if (OP_ALLOWED_ZONES.some((re) => re.test(nodePath))) return false;
  if (type.isArray(node)) {
    return node.some((item, i) =>
      manifestMetaHasOperators(item, nodePath ? `${nodePath}.${i}` : String(i))
    );
  }
  if (type.isObject(node)) {
    if (Object.keys(node).some((k) => k.startsWith('_'))) return true;
    return Object.entries(node).some(([k, v]) =>
      manifestMetaHasOperators(v, nodePath ? `${nodePath}.${k}` : k)
    );
  }
  return false;
}

// Entry preserve zones for the compiled manifest: walker step-4 preserves
// plus every non-content top-level subtree (registration meta is raw — its
// values come from the raw parse, so the factory must not re-resolve them).
function manifestPreserveZones(wp) {
  if (MANIFEST_PRESERVE_ZONES.some((re) => re.test(wp))) return true;
  const top = wp.split('.')[0];
  return !CONTENT_TOP_KEYS.has(top);
}

function validateRequiredVars(varDefs, consumerVars, entryId, source, prefix = '') {
  for (const [varName, varDef] of Object.entries(varDefs)) {
    const fullName = prefix ? `${prefix}.${varName}` : varName;

    if (varDef.properties) {
      if (!type.isNone(consumerVars[varName]) && !type.isObject(consumerVars[varName])) {
        throw new ConfigError(
          `Module "${entryId}" (${source}) var "${fullName}" must be type "object" ` +
            `(has properties) but got "${type.typeOf(consumerVars[varName])}".`
        );
      }
      const consumerObj = type.isObject(consumerVars[varName]) ? consumerVars[varName] : {};
      for (const key of Object.keys(consumerObj)) {
        if (!varDef.properties[key]) {
          throw new ConfigError(
            `Module "${entryId}" (${source}) var "${fullName}" has undeclared ` +
              `property "${key}". Declared properties: ${Object.keys(varDef.properties).join(
                ', '
              )}.`
          );
        }
      }
      validateRequiredVars(varDef.properties, consumerObj, entryId, source, fullName);
    } else if (
      varDef.required &&
      type.isUndefined(varDef.default) &&
      type.isNone(consumerVars[varName])
    ) {
      throw new ConfigError(
        `Module "${entryId}" (${source}) requires var "${fullName}"` +
          (varDef.description ? `\n  - ${varDef.description}` : '') +
          `\n  - Define it in lowdefy.yaml under modules[id=${entryId}].vars.${fullName}`
      );
    }
  }
}

function validateVarTypes(varDefs, resolvedVarCache, entryId, source, prefix = '') {
  for (const [varName, varDef] of Object.entries(varDefs)) {
    const fullName = prefix ? `${prefix}.${varName}` : varName;
    const value = resolvedVarCache[fullName];

    if (varDef.type && !type.isNone(value)) {
      if (type.typeOf(value) !== varDef.type) {
        throw new ConfigError(
          `Module "${entryId}" (${source}) var "${fullName}" must be type ` +
            `"${varDef.type}" but got "${type.typeOf(value)}".` +
            (varDef.description ? `\n  - ${varDef.description}` : '')
        );
      }
    }

    if (varDef.properties) {
      validateVarTypes(varDef.properties, resolvedVarCache, entryId, source, fullName);
    }
  }
}

async function resolveLocalManifest({ entry, resolvedPaths, context }) {
  if (!entry.id || !type.isString(entry.id)) {
    throw new ConfigError("Module entry 'id' is required and must be a string.");
  }
  if (entry.id.includes('/')) {
    throw new ConfigError(
      `Module entry id "${entry.id}" must not contain '/'. ` +
        `Use a flat identifier like "team-users".`
    );
  }
  if (entry.id === '__proto__' || entry.id === 'constructor' || entry.id === 'prototype') {
    throw new ConfigError(`Module entry id "${entry.id}" is a reserved name.`);
  }
  if (!entry.source || !type.isString(entry.source)) {
    throw new ConfigError(`Module entry "${entry.id}": 'source' is required and must be a string.`);
  }

  if (Object.hasOwn(context.modules, entry.id)) {
    throw new ConfigError(`Duplicate module entry id "${entry.id}".`);
  }

  const { packageRoot, moduleRoot, isLocal } = resolvedPaths;

  const moduleYamlPath = path.join(moduleRoot, 'module.lowdefy.yaml');

  // Use makeRefDefinition + getRefContent to read and parse module.lowdefy.yaml.
  // The absolute path works because path.resolve(configDir, absolutePath) = absolutePath.
  const refDef = makeRefDefinition(moduleYamlPath, null, context.refMap);
  const content = await getRefContent({ context, refDef, referencedFrom: null });

  // Run walker with shouldStop preserving content that may contain cross-module refs
  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: {},
    moduleRoot,
    packageRoot,
    path: '',
    currentFile: moduleYamlPath,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    dynamicIdentifiers,
    shouldStop: (childPath) => {
      if (/^vars(\.[^.]+\.properties)*\.[^.]+\.default(\..*)?$/.test(childPath)) return 'preserve';
      if (/^components\.\d+\.component$/.test(childPath)) return 'preserve';
      if (/^pages(\..*)?$/.test(childPath)) return 'preserve';
      if (/^api(\..*)?$/.test(childPath)) return 'preserve';
      if (/^connections(\..*)?$/.test(childPath)) return 'preserve';
      if (/^menus\.\d+\.links$/.test(childPath)) return 'preserve';
      return false;
    },
  });

  // D7b: with the compiler on and no operators/refs in registration meta,
  // skip the local walk — meta extracts from the raw parse, content resolves
  // through the compiled manifest at full-resolve time.
  const compiledManifest = context.compiler === true && !manifestMetaHasOperators(content);
  const manifest = compiledManifest ? content : await resolve(content, ctx);

  // Parse dependencies array from manifest
  const dependencies = manifest.dependencies ?? [];
  for (const dep of dependencies) {
    if (!type.isString(dep.id)) {
      throw new ConfigError(
        `Module "${entry.id}": each item in "dependencies" must have a string "id".`
      );
    }
  }

  // Capture var definitions for the registered module entry.
  // Required-var validation is deferred to Phase 2.5 (buildModuleDefs.js)
  // because entry.vars may contain unresolved _refs at this point.
  // Type validation runs at the end of Phase 3 against the lazily-populated
  // resolvedVarCache.
  const varDefs = manifest.vars ?? {};

  // Validate plugin dependencies against app's declared plugins
  const requiredPlugins = manifest.plugins ?? [];
  for (const plugin of requiredPlugins) {
    if (!type.isString(plugin.version)) {
      throw new ConfigError(
        `Module "${entry.id}": plugin "${plugin.name}" must declare a "version" ` +
          `(semver range) in module.lowdefy.yaml.`
      );
    }
  }
  const appPlugins = (context.plugins ?? []).reduce(
    (map, p) => map.set(p.name, p.version),
    new Map()
  );
  for (const plugin of requiredPlugins) {
    if (context.defaultPackageNames.has(plugin.name)) {
      continue;
    }
    const appVersion = appPlugins.get(plugin.name);
    if (!appVersion) {
      throw new ConfigError(
        `Module "${entry.id}" requires plugin "${plugin.name}" version "${plugin.version}".\n` +
          `Add it to your app's plugins array in lowdefy.yaml:\n\n` +
          `  plugins:\n` +
          `    - name: "${plugin.name}"\n` +
          `      version: "${semver.minVersion(plugin.version)}"`
      );
    }
    if (appVersion.startsWith('workspace:')) {
      continue;
    }
    if (!semver.satisfies(appVersion, plugin.version)) {
      throw new ConfigError(
        `Module "${entry.id}" requires plugin "${plugin.name}" version "${plugin.version}" ` +
          `but the app has version "${appVersion}" installed. ` +
          `Update the plugin to a compatible version.`
      );
    }
  }

  context.modules[entry.id] = {
    id: entry.id,
    source: entry.source,
    packageRoot,
    moduleRoot,
    isLocal,
    consumerVars: entry.vars ?? {},
    varDefs,
    resolvedVarCache: {},
    connections: entry.connections ?? {},
    manifest,
    dependencies,
    moduleDependencies: entry.dependencies ?? {},
    refDef,
    compiledManifest,
  };
}

// Walker parity for the compiled manifest: preserved zones carry
// ~deferredFrom — getModuleRefContent and the component-export hook read it.
function setDeferredFromMarks(manifest, moduleYamlPath) {
  for (const item of manifest?.components ?? []) {
    if (type.isObject(item?.component) || type.isArray(item?.component)) {
      setNonEnumerableProperty(item.component, '~deferredFrom', moduleYamlPath);
    }
  }
  const markDefaults = (defs) => {
    for (const def of Object.values(defs ?? {})) {
      if (!type.isObject(def)) continue;
      if (type.isObject(def.default) || type.isArray(def.default)) {
        setNonEnumerableProperty(def.default, '~deferredFrom', moduleYamlPath);
      }
      if (def.properties) {
        markDefaults(def.properties);
      }
    }
  };
  markDefaults(manifest?.vars);
}

// D7b/D7c compile phase: every compiled-mode manifest compiles and its
// factory exports (inline components, structured var defaults) register on
// the entry BEFORE any content factory runs — cross-module consumption is
// order-independent, like the walker reading raw registry content.
async function compileManifest({ entryId, context }) {
  const moduleEntry = context.modules[entryId];
  if (!moduleEntry.compiledManifest) {
    return;
  }
  const { moduleRoot, moduleDependencies } = moduleEntry;
  const moduleYamlPath = path.join(moduleRoot, 'module.lowdefy.yaml');
  fs.mkdirSync(context.directories.build, { recursive: true });
  const outDir = fs.realpathSync(
    fs.mkdtempSync(path.join(context.directories.build, '.compile-mod-'))
  );
  const result = await compileDir({
    configDir: context.directories.config,
    outDir,
    entry: moduleYamlPath,
    mode: 'markers',
    runtimePath,
    resolveModuleExport: makeResolveModuleExport(context, moduleDependencies),
    entryPreserveZones: manifestPreserveZones,
    entryCollectFactoryExports: manifestFactoryKey,
    entryModuleRoot: moduleRoot,
  });
  const mod = await import(result.entryUrl);
  moduleEntry.compiledManifestModule = mod;
  moduleEntry.compiledManifestImporter = result.importer;
  moduleEntry.compiledFactories = mod.factories ?? {};
  moduleEntry.compiledVarDefaults = {};
  for (const [factoryKey, factoryFn] of Object.entries(moduleEntry.compiledFactories)) {
    if (factoryKey.startsWith('varDefault:')) {
      const wp = factoryKey.slice('varDefault:'.length);
      const varKey = wp.slice('vars.'.length, -'.default'.length).split('.properties.').join('.');
      moduleEntry.compiledVarDefaults[varKey] = factoryFn;
    }
  }
}

async function resolveFullManifest({ entryId, context }) {
  const moduleEntry = context.modules[entryId];
  const { manifest, packageRoot, moduleRoot, moduleDependencies, refDef } = moduleEntry;

  const moduleYamlPath = path.join(moduleRoot, 'module.lowdefy.yaml');

  let resolved;
  if (moduleEntry.compiledManifest) {
    const scope = {
      ...makeManifestScope(context, moduleEntry),
      importer: moduleEntry.compiledManifestImporter,
    };
    resolved = await moduleEntry.compiledManifestModule.default(scope);
    setDeferredFromMarks(resolved, moduleYamlPath);
  } else {
    const ctx = new WalkContext({
      buildContext: context,
      refId: refDef.id,
      sourceRefId: null,
      vars: {},
      moduleDependencies,
      moduleEntry,
      moduleRoot,
      packageRoot,
      path: '',
      currentFile: moduleYamlPath,
      refChain: new Set(refDef.path ? [refDef.path] : []),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: (childPath) => {
        if (/^vars(\.[^.]+\.properties)*\.[^.]+\.default(\..*)?$/.test(childPath))
          return 'preserve';
        if (/^components\.\d+\.component$/.test(childPath)) return 'preserve';
        return false;
      },
    });

    resolved = await resolve(manifest, ctx);
  }

  resolved = evaluateStaticOperators({ context, input: resolved, refDef });

  // Filter null entries produced by _ref resolution failures
  for (const key of ['pages', 'connections', 'api']) {
    if (type.isArray(resolved[key])) {
      resolved[key] = resolved[key].filter((item) => !type.isNone(item));
    }
  }

  moduleEntry.manifest = resolved;

  // Validate var types against lazily-resolved values
  const varDefs = moduleEntry.varDefs;
  if (Object.keys(varDefs).length > 0) {
    validateVarTypes(varDefs, moduleEntry.resolvedVarCache, entryId, moduleEntry.source);
  }
}

export { resolveLocalManifest, compileManifest, resolveFullManifest, validateRequiredVars };
