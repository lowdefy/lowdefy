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

import { get, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import cloneVarValue from './cloneVarValue.js';

// scope.module is bound per module REGISTRATION at the manifest boundary
// (design D7) — one compiled file can serve several registrations. The
// binding carries the registration id, consumer vars, var definitions,
// connection/endpoint remappings, and resolvable dependencies.
function bindModuleEntry({
  id,
  consumerVars = {},
  varDefs = {},
  connections = {},
  deps = {},
  // Share the registration entry's cache when given (walker parity: lazy
  // structured defaults resolve once per entry, not once per binding).
  resolvedVarCache = {},
}) {
  return { id, consumerVars, varDefs, connections, deps, resolvedVarCache };
}

// Walker getVarDef parity: navigate var definitions by dot-path, following
// `properties` nesting.
function getVarDef(varDefs, key) {
  const parts = key.split('.');
  let current = varDefs;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!current?.[part]) return undefined;
    if (current[part].properties && i < parts.length - 1) {
      current = current[part].properties;
    } else {
      return current[part];
    }
  }
  return undefined;
}

// Walker resolveEffectiveVar parity. Structured defaults (containing
// refs/operators) resolve through the build-injected
// scope.resolveModuleVarDefault — the walker's fresh manifest-rooted walk —
// and cache on the binding (shared with the registration entry).
async function resolveEffectiveVar(key, binding, loc, scope) {
  if (Object.hasOwn(binding.resolvedVarCache, key)) {
    return binding.resolvedVarCache[key];
  }
  const consumerValue = get(binding.consumerVars, key, { default: undefined });
  const varDef = getVarDef(binding.varDefs, key);

  let result;
  if (varDef?.properties) {
    result = {};
    for (const propName of Object.keys(varDef.properties)) {
      result[propName] = await resolveEffectiveVar(`${key}.${propName}`, binding, loc, scope);
    }
  } else if (!type.isNone(consumerValue)) {
    result = consumerValue;
  } else if (varDef && !type.isUndefined(varDef.default)) {
    if (type.isObject(varDef.default) || type.isArray(varDef.default)) {
      if (!scope?.resolveModuleVarDefault) {
        throw new ConfigError(
          `Module var "${key}" has a structured default — compiling module var defaults that contain refs or operators lands in config-compiler S1.`,
          { filePath: loc?.file, lineNumber: loc?.line }
        );
      }
      result = await scope.resolveModuleVarDefault(varDef.default, binding.id, key);
    } else {
      result = varDef.default;
    }
  } else {
    result = null;
  }

  binding.resolvedVarCache[key] = result;
  return result;
}

async function moduleVar({ scope, key, loc }) {
  if (!type.isString(key)) {
    throw new ConfigError('_module.var operator takes a string argument.', {
      filePath: loc?.file,
      lineNumber: loc?.line,
    });
  }
  if (!scope.module) {
    throw new ConfigError(
      `_module.var "${key}" used outside a module — no module to resolve against.`,
      { filePath: loc?.file, lineNumber: loc?.line }
    );
  }
  return cloneVarValue(
    await resolveEffectiveVar(key, scope.module, loc, scope),
    scope.sourceRefId ?? null
  );
}

// Walker resolveDepTarget parity: at app level the module name IS the entry
// id; inside a module, names map through the registration's dependency
// wiring. Targets come from the build registry (scope.getModuleEntry).
// Errors carry no location (the walker passes an undefined configKey here).
function resolveDepTarget({ scope, depName, usage }) {
  const binding = scope.module;
  const getEntry = scope.getModuleEntry ?? (() => undefined);
  if (!binding) {
    const targetEntry = getEntry(depName);
    if (!targetEntry) {
      throw new ConfigError(
        `${usage} references module "${depName}" but no module with that entry id was registered.`
      );
    }
    return targetEntry;
  }
  const targetEntryId = (binding.deps ?? {})[depName];
  if (!targetEntryId) {
    throw new ConfigError(
      `${usage} in module "${binding.id}" references dependency "${depName}" but no mapping exists. ` +
        `Add dependencies.${depName} to module "${binding.id}".`
    );
  }
  const targetEntry = getEntry(targetEntryId);
  if (!targetEntry) {
    throw new ConfigError(
      `${usage} in module "${binding.id}" references dependency "${depName}" which maps to "${targetEntryId}", ` +
        `but no module with entry id "${targetEntryId}" was registered.`
    );
  }
  return targetEntry;
}

// Walker resolveModule*Id parity. _module.id accepts any non-object value
// when a module is bound; the others take a string (scoped against the
// binding, connectionId honoring remappings) or { id, module } resolving a
// dependency target.
function moduleId({ scope, kind, arg }) {
  const binding = scope.module;
  const opName = `_module.${kind}`;

  if (kind === 'id') {
    if (!type.isObject(arg)) {
      if (!binding) {
        throw new ConfigError(
          '_module.id is ambiguous at the app level — no module to scope against. Use { module } to specify the target module.'
        );
      }
      return binding.id;
    }
    if (type.isString(arg.module)) {
      const target = resolveDepTarget({
        scope,
        depName: arg.module,
        usage: `_module.id { module: "${arg.module}" }`,
      });
      return target.id;
    }
    throw new ConfigError('_module.id requires a truthy value or object { module }.');
  }

  if (type.isString(arg)) {
    if (!binding) {
      throw new ConfigError(
        `${opName} string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.`
      );
    }
    if (kind === 'connectionId') {
      const remapping = binding.connections ?? {};
      if (remapping[arg]) {
        return remapping[arg];
      }
    }
    return `${binding.id}/${arg}`;
  }

  if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
    const target = resolveDepTarget({
      scope,
      depName: arg.module,
      usage: `${opName} { id: "${arg.id}", module: "${arg.module}" }`,
    });
    if (kind === 'connectionId') {
      const remapping = target.connections ?? {};
      if (remapping[arg.id]) {
        return remapping[arg.id];
      }
    }
    return `${target.id}/${arg.id}`;
  }

  throw new ConfigError(`${opName} requires a string or object { id, module }.`);
}

export { bindModuleEntry, moduleVar, moduleId };
