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
function bindModuleEntry({ id, consumerVars = {}, varDefs = {}, connections = {}, deps = {} }) {
  const resolvedVarCache = {};
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

// Walker resolveEffectiveVar parity, with one S1 deferral: defaults that need
// walking (containing _ref/_var/operators) are out of S0 scope and throw a
// clear error — static defaults resolve identically.
function resolveEffectiveVar(key, binding, loc) {
  if (Object.hasOwn(binding.resolvedVarCache, key)) {
    return binding.resolvedVarCache[key];
  }
  const consumerValue = get(binding.consumerVars, key, { default: undefined });
  const varDef = getVarDef(binding.varDefs, key);

  let result;
  if (varDef?.properties) {
    result = {};
    for (const propName of Object.keys(varDef.properties)) {
      result[propName] = resolveEffectiveVar(`${key}.${propName}`, binding, loc);
    }
  } else if (!type.isNone(consumerValue)) {
    result = consumerValue;
  } else if (varDef && !type.isUndefined(varDef.default)) {
    if (type.isObject(varDef.default) || type.isArray(varDef.default)) {
      throw new ConfigError(
        `Module var "${key}" has a structured default — compiling module var defaults that contain refs or operators lands in config-compiler S1.`,
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    result = varDef.default;
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
  return cloneVarValue(resolveEffectiveVar(key, scope.module, loc), scope.sourceRefId ?? null);
}

function resolveDep({ binding, depName, usage, loc }) {
  const target = binding?.deps?.[depName];
  if (!target) {
    throw new ConfigError(`Module dependency "${depName}" not found for ${usage}.`, {
      filePath: loc?.file,
      lineNumber: loc?.line,
    });
  }
  return target;
}

// Walker resolveModule*Id parity — string form scopes against the bound
// module (ambiguous at app level), object form { id, module } resolves a
// dependency target; connectionId honors remappings.
function moduleId({ scope, kind, arg, loc }) {
  const binding = scope.module;
  const opName = `_module.${kind}`;

  if (type.isString(arg)) {
    if (!binding) {
      throw new ConfigError(
        `${opName} string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.`,
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    if (kind === 'connectionId') {
      const remapping = binding.connections ?? {};
      if (remapping[arg]) return remapping[arg];
    }
    return `${binding.id}/${arg}`;
  }

  if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
    const target = resolveDep({
      binding,
      depName: arg.module,
      usage: `${opName} { id: "${arg.id}", module: "${arg.module}" }`,
      loc,
    });
    if (kind === 'connectionId') {
      const remapping = target.connections ?? {};
      if (remapping[arg.id]) return remapping[arg.id];
    }
    return `${target.id}/${arg.id}`;
  }

  throw new ConfigError(`${opName} requires a string or object { id, module }.`, {
    filePath: loc?.file,
    lineNumber: loc?.line,
  });
}

export { bindModuleEntry, moduleVar, moduleId };
