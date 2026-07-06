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

import path from 'path';
import semver from 'semver';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import operators from '@lowdefy/operators-js/operators/build';

import { resolve, WalkContext } from './buildRefs/walker.js';
import getRefContent from './buildRefs/getRefContent.js';
import makeRefDefinition from './buildRefs/makeRefDefinition.js';
import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import validateOperatorsDynamic from './validateOperatorsDynamic.js';
import { makeShouldStop } from './buildRefs/deferredRegions.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

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
              `property "${key}". Declared properties: ${Object.keys(varDef.properties).join(', ')}.`
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

function getRuntimeOperatorKey(value) {
  if (!type.isObject(value)) return null;
  const nonTildeKeys = Object.keys(value).filter((k) => !k.startsWith('~'));
  if (nonTildeKeys.length === 1 && nonTildeKeys[0].startsWith('_')) return nonTildeKeys[0];
  return null;
}

function suggestBuildOperator(operatorKey) {
  // '_string.concat' -> '_build.string.concat', '_sum' -> '_build.sum'
  return `_build.${operatorKey.slice(1)}`;
}

// Component bodies are preserved by config path (components.<i>.component), so
// bodies under an operator object at `components` itself or at an array element
// escape preservation and resolve eagerly during the manifest walk. That is
// harmless for static bodies (operator-composed component lists are supported —
// pinned by fixture 81-cross-module-build-op-components), but a _var in such a
// body resolves against the manifest walk's scope instead of the consumer's
// per-ref vars — a silently wrong value. Error on that combination explicitly.
// A _ref at either position is fully safe: it resolves top-down, so paths
// inside the ref'd file still match the preserve regex. An operator at
// components.<i>.component itself is inside the preserved body and is fine.
function findVarNode(value) {
  if (type.isArray(value)) {
    for (const item of value) {
      const found = findVarNode(item);
      if (found) return found;
    }
    return null;
  }
  if (!type.isObject(value)) return null;
  if (getRuntimeOperatorKey(value) === '_var') return value;
  for (const key of Object.keys(value)) {
    const found = findVarNode(value[key]);
    if (found) return found;
  }
  return null;
}

function assertStaticComponentsList({ components, entryId, filePath }) {
  if (!type.isObject(components) && !type.isArray(components)) return;
  const check = (value, position) => {
    const operatorKey = getRuntimeOperatorKey(value);
    if (operatorKey && operatorKey !== '_ref' && findVarNode(value)) {
      throw new ConfigError(
        `Module "${entryId}": _var inside an operator-generated components section ` +
          `cannot resolve per consumer. Found "${operatorKey}" at ${position} with a _var ` +
          `in its content. Define components whose bodies use _var as static ` +
          `{ id, component } list items so the bodies are preserved.`,
        { filePath }
      );
    }
  };
  check(components, '"components"');
  if (type.isArray(components)) {
    components.forEach((item, i) => check(item, `"components.${i}"`));
  }
}

function validateVarTypes(varDefs, resolvedVarCache, entryId, source, prefix = '') {
  for (const [varName, varDef] of Object.entries(varDefs)) {
    const fullName = prefix ? `${prefix}.${varName}` : varName;
    const value = resolvedVarCache[fullName];

    if (varDef.type && !type.isNone(value)) {
      // A typed var must hold a concrete value — runtime operators are not allowed
      // regardless of whether they are static-foldable or dynamic. Suggest the
      // build-time equivalent so the user knows how to fix it.
      const operatorKey = getRuntimeOperatorKey(value);
      if (operatorKey) {
        throw new ConfigError(
          `Module "${entryId}" (${source}) var "${fullName}" is typed "${varDef.type}" ` +
            `but received a runtime operator "${operatorKey}". ` +
            `Use the build-time equivalent "${suggestBuildOperator(operatorKey)}" instead.` +
            (varDef.description ? `\n  - ${varDef.description}` : '')
        );
      }
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
    throw new ConfigError(
      `Module entry "${entry.id}": 'source' is required and must be a string.`
    );
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

  if (type.isObject(content)) {
    assertStaticComponentsList({
      components: content.components,
      entryId: entry.id,
      filePath: moduleYamlPath,
    });
  }

  // Phase A — header parse: walk only the static header keys (dependencies,
  // plugins, secrets, vars definitions — defaults record-ified). Content
  // sections stay raw parsed YAML; Phase C.5 record-ifies exportables and
  // Phase D resolves the rest.
  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: {},
    moduleRoot,
    packageRoot,
    // The entry object is created after this walk; deferred-record coordinates
    // still need the owning entry id.
    entryId: entry.id,
    path: '',
    currentFile: moduleYamlPath,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    lowdefyApp: context.appMeta,
    dynamicIdentifiers,
    shouldStop: makeShouldStop('header'),
  });

  const manifest = await resolve(content, ctx);

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
  };
}

// Phase C.5 — record-ify exportables: walk only the components and menus
// sections in module-static scope (entry id known, but NO moduleEntry on the
// context — a _module.var at a structural position errors, because export ids
// must not vary per consumer). File refs are entered and static operators
// resolve; component bodies and menu links become records before any phase can
// consume them, so cross-entry consumption never races record creation.
async function recordifyExportables({ entryId, context }) {
  const moduleEntry = context.modules[entryId];
  const { manifest, packageRoot, moduleRoot, refDef } = moduleEntry;
  const moduleYamlPath = path.join(moduleRoot, 'module.lowdefy.yaml');

  if (type.isObject(manifest)) {
    assertStaticComponentsList({
      components: manifest.components,
      entryId,
      filePath: moduleYamlPath,
    });
  }

  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: {},
    moduleRoot,
    packageRoot,
    entryId,
    path: '',
    currentFile: moduleYamlPath,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    lowdefyApp: context.appMeta,
    dynamicIdentifiers,
    shouldStop: makeShouldStop('exportables'),
  });

  moduleEntry.manifest = await resolve(manifest, ctx);
}

// Phase D — manifest resolve: ONE full walk with the module entry in context.
// Pages, api, and connections resolve completely; component/menuLinks
// placeholders pass through the kind-aware dispatch untouched; varDefault
// placeholders keep their rule so the dispatch cannot force demand-only
// records.
async function resolveFullManifest({ entryId, context }) {
  const moduleEntry = context.modules[entryId];
  const { manifest, packageRoot, moduleRoot, moduleDependencies, refDef } = moduleEntry;

  const moduleYamlPath = path.join(moduleRoot, 'module.lowdefy.yaml');

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
    lowdefyApp: context.appMeta,
    dynamicIdentifiers,
    shouldStop: makeShouldStop('manifest'),
  });

  const resolved = await resolve(manifest, ctx);

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

export { resolveLocalManifest, recordifyExportables, resolveFullManifest, validateRequiredVars };
