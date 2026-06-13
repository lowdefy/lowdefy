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

import { compileDir } from '@lowdefy/compile';

import {
  makeManifestScope,
  makeResolveModuleExport,
  manifestFactoryKey,
  runtimePath,
} from './compileScopeTools.js';
import setNonEnumerableProperty from '../utils/setNonEnumerableProperty.js';
import makeId from '../utils/makeId.js';
import readManifestFile from './readManifestFile.js';
import evaluateStaticOperators from './evaluateStaticOperators.js';

// D7b zone rules. Content zones compile (refs/operators live); preserve
// zones stay raw data (consumed lazily — var defaults, component defs).
// Anything else is registration meta: a manifest with no operators/refs
// there extracts straight from the raw parse; one carrying them in meta
// zones runs an extraction compile (resolveLocalManifest).
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

// Extraction-compile preserve zones (E1, meta-operator manifests) — the
// walker's step-1 shouldStop list with menus preserved WHOLE: cross-module
// menu refs inside menu content must resolve on demand with the consumer's
// cycle chain (walker recursion), never at extraction time when the
// registry is incomplete.
function localManifestPreserveZones(wp) {
  if (/^vars(\.[^.]+\.properties)*\.[^.]+\.default(\..*)?$/.test(wp)) return true;
  if (/^components\.\d+\.component$/.test(wp)) return true;
  if (/^pages(\..*)?$/.test(wp)) return true;
  if (/^api(\..*)?$/.test(wp)) return true;
  if (/^connections(\..*)?$/.test(wp)) return true;
  if (/^menus(\..*)?$/.test(wp)) return true;
  return false;
}

// The step-1-preserved content zones double as factories for full resolve.
function localZoneFactoryKey(wp) {
  if (wp === 'pages' || wp === 'api' || wp === 'connections' || wp === 'menus') {
    return `zone:${wp}`;
  }
  return null;
}

// On-demand menu resolution for early-compiled manifests: resolves once
// (the menu files load once — walker step-1 parity), threading the
// consumer's refChain so cross-module menu refs inside the content carry
// the module cycle keys. Re-entry while resolving IS a circular module
// reference — thrown here with the consumer's chain, collected at the
// consuming ref (walker recursion parity, chain rendering differs).
function makeResolveMenus({ context, entryId, moduleYamlPath }) {
  let resolved = false;
  let resolving = false;
  return async function resolveMenus(refChain, menuName) {
    const moduleEntry = context.modules[entryId];
    const factory = moduleEntry.localZones?.factories?.['zone:menus'];
    if (resolved || !factory) {
      return moduleEntry.manifest?.menus;
    }
    if (resolving) {
      throw new ConfigError(
        `Circular module reference detected. Module "${entryId}" menu "${menuName}" ` +
          `references itself through:\n  -> ${(refChain ?? []).join('\n  -> ')}`
      );
    }
    resolving = true;
    try {
      const scope = {
        ...makeManifestScope(context, moduleEntry),
        importer: moduleEntry.localZones.importer,
        importSource: moduleEntry.localZones.importSource,
        refChain: refChain ?? [moduleYamlPath],
      };
      moduleEntry.manifest.menus = await factory(scope);
      resolved = true;
      return moduleEntry.manifest.menus;
    } finally {
      resolving = false;
    }
  };
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

  // The manifest's refMap entry — counter id, registered before content
  // loads (the menus chain and manifest scopes root at it).
  const refId = makeId.next();
  context.refMap[refId] = { parent: null, lineNumber: undefined };
  const refDef = { id: refId, parent: null, lineNumber: undefined, path: moduleYamlPath, vars: {} };

  const content = await readManifestFile({ context, filePath: moduleYamlPath });

  // D7b/E2: operator-free meta extracts straight from the raw parse;
  // manifests with operators in meta zones run an EXTRACTION COMPILE
  // mirroring the old step-1 walk — step-1 preserve zones stay raw (content
  // tops, component content, var defaults — collected as zone factories for
  // full-resolve), meta resolves once, and extraction reads resolved values.
  const compiledManifest = true;
  let manifest;
  let localZones = null;
  if (!manifestMetaHasOperators(content)) {
    manifest = content;
  } else {
    fs.mkdirSync(context.directories.build, { recursive: true });
    const outDir = fs.realpathSync(
      fs.mkdtempSync(path.join(context.directories.build, '.compile-local-'))
    );
    const extraction = await compileDir({
      configDir: context.directories.config,
      outDir,
      entry: moduleYamlPath,
      mode: 'markers',
      runtimePath,
      refResolver: context.refResolver ?? null,
      entryPreserveZones: localManifestPreserveZones,
      entryCollectFactoryExports: localZoneFactoryKey,
      entryModuleRoot: moduleRoot,
    });
    const extractionMod = await import(/* @vite-ignore */ extraction.entryUrl);
    // Preliminary registration — makeManifestScope needs the entry.
    context.modules[entry.id] = {
      id: entry.id,
      source: entry.source,
      packageRoot,
      moduleRoot,
      isLocal,
      consumerVars: entry.vars ?? {},
      varDefs: {},
      resolvedVarCache: {},
      connections: entry.connections ?? {},
      manifest: content,
      dependencies: [],
      moduleDependencies: entry.dependencies ?? {},
      refDef,
      compiledManifest,
    };
    const scope = {
      ...makeManifestScope(context, context.modules[entry.id]),
      importer: extraction.importer,
      importSource: extraction.importSource,
    };
    manifest = await extractionMod.default(scope);
    setDeferredFromMarks(manifest, moduleYamlPath);
    localZones = {
      factories: extractionMod.factories ?? {},
      importer: extraction.importer,
      importSource: extraction.importSource,
    };
  }

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
    // Extraction-compile zone factories (meta-operator manifests): full
    // resolve applies these to the stored manifest instead of re-running a
    // whole-manifest factory, so step-1 resolutions never repeat.
    localZones,
    resolveMenus: localZones
      ? makeResolveMenus({ context, entryId: entry.id, moduleYamlPath })
      : null,
  };
}

// Preserved manifest zones carry ~deferredFrom — the compiled module-ref
// runtime and the component-export resolver read it to attribute reffed
// content to the module file.
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
  const mod = await import(/* @vite-ignore */ result.entryUrl);
  moduleEntry.compiledManifestModule = mod;
  moduleEntry.compiledManifestImporter = result.importer;
  moduleEntry.compiledManifestImportSource = result.importSource;
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
  const { manifest, moduleRoot, refDef } = moduleEntry;

  const moduleYamlPath = path.join(moduleRoot, 'module.lowdefy.yaml');

  let resolved;
  if (moduleEntry.localZones) {
    // Early-compiled manifest (meta operators): step 1 already resolved the
    // meta — only the step-1-preserved content zones resolve now, applied
    // as zone factories over the stored manifest. Running the whole-manifest
    // factory here would repeat the step-1 resolutions (duplicate refMap
    // entries — each ref resolves exactly once).
    resolved = manifest;
    for (const [factoryKey, factory] of Object.entries(moduleEntry.localZones.factories)) {
      if (factoryKey === 'zone:menus') {
        // Resolves once into the manifest (idempotent if a cross-module
        // consumer already triggered it).
        await moduleEntry.resolveMenus();
        continue;
      }
      const zone = factoryKey.slice('zone:'.length);
      const scope = {
        ...makeManifestScope(context, moduleEntry),
        importer: moduleEntry.localZones.importer,
        importSource: moduleEntry.localZones.importSource,
      };
      if (resolved[zone] !== undefined) {
        resolved[zone] = await factory(scope);
      }
    }
    setDeferredFromMarks(resolved, moduleYamlPath);
  } else {
    const scope = {
      ...makeManifestScope(context, moduleEntry),
      importer: moduleEntry.compiledManifestImporter,
    };
    resolved = await moduleEntry.compiledManifestModule.default(scope);
    setDeferredFromMarks(resolved, moduleYamlPath);
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
