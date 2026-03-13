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
import evaluateStaticOperators from './buildRefs/evaluateStaticOperators.js';
import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import validateOperatorsDynamic from './validateOperatorsDynamic.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

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
  if (!entry.source || !type.isString(entry.source)) {
    throw new ConfigError(
      `Module entry "${entry.id}": 'source' is required and must be a string.`
    );
  }

  if (context.modules[entry.id]) {
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
    moduleVars: entry.vars ?? {},
    packageRoot,
    path: '',
    currentFile: moduleYamlPath,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    dynamicIdentifiers,
    shouldStop: (childPath) => {
      if (/^components\.\d+\.component$/.test(childPath)) return 'preserve';
      if (/^pages(\..*)?$/.test(childPath)) return 'preserve';
      if (/^api(\..*)?$/.test(childPath)) return 'preserve';
      if (/^connections(\..*)?$/.test(childPath)) return 'preserve';
      if (/^menus\.\d+\.links$/.test(childPath)) return 'preserve';
      return false;
    },
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

  // Parse exports object from manifest
  const rawExports = manifest.exports ?? {};
  const exportSections = ['pages', 'components', 'menus', 'connections', 'api'];
  const exports = {};

  for (const section of exportSections) {
    const items = rawExports[section] ?? [];
    if (!type.isArray(items)) {
      throw new ConfigError(
        `Module "${entry.id}": exports.${section} must be an array.`
      );
    }
    for (const item of items) {
      if (!type.isString(item.id)) {
        throw new ConfigError(
          `Module "${entry.id}": each item in exports.${section} must have a string "id".`
        );
      }
    }
    exports[section] = items;
  }

  // Reject unknown keys in exports
  for (const key of Object.keys(rawExports)) {
    if (!exportSections.includes(key)) {
      throw new ConfigError(
        `Module "${entry.id}": unknown exports section "${key}". ` +
          `Valid sections: ${exportSections.join(', ')}.`
      );
    }
  }

  // Validate module vars against manifest var definitions
  const varDefs = manifest.vars ?? {};
  for (const [varName, varDef] of Object.entries(varDefs)) {
    const value = (entry.vars ?? {})[varName];

    if (varDef.required && type.isUndefined(value)) {
      throw new ConfigError(
        `Module "${entry.id}" (${entry.source}) requires var "${varName}"` +
          (varDef.description ? `\n  - ${varDef.description}` : '') +
          `\n  - Define it in lowdefy.yaml under modules[id=${entry.id}].vars.${varName}`
      );
    }

    if (varDef.type && !type.isUndefined(value)) {
      const actual = Array.isArray(value) ? 'array' : typeof value;
      if (actual !== varDef.type) {
        throw new ConfigError(
          `Module "${entry.id}" (${entry.source}) var "${varName}" must be type ` +
            `"${varDef.type}" but got "${actual}".` +
            (varDef.description ? `\n  - ${varDef.description}` : '')
        );
      }
    }
  }

  // Validate plugin dependencies against app's declared plugins
  const requiredPlugins = manifest.plugins ?? [];
  const appPlugins = (context.plugins ?? []).reduce(
    (map, p) => map.set(p.name, p.version),
    new Map()
  );
  for (const plugin of requiredPlugins) {
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
    vars: entry.vars ?? {},
    connections: entry.connections ?? {},
    manifest,
    dependencies,
    exports,
    moduleDependencies: entry.dependencies ?? {},
    refDef,
  };
}

async function resolveFullManifest({ entryId, context }) {
  const moduleEntry = context.modules[entryId];
  const { manifest, vars, packageRoot, moduleRoot, moduleDependencies, refDef } = moduleEntry;

  const moduleYamlPath = path.join(moduleRoot, 'module.lowdefy.yaml');

  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: {},
    moduleVars: vars,
    moduleDependencies,
    packageRoot,
    path: '',
    currentFile: moduleYamlPath,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    dynamicIdentifiers,
    shouldStop: (childPath) => {
      if (/^components\.\d+\.component$/.test(childPath)) return 'preserve';
      return false;
    },
  });

  let resolved = await resolve(manifest, ctx);

  resolved = evaluateStaticOperators({ context, input: resolved, refDef });

  // Filter null entries produced by _ref resolution failures
  for (const key of ['pages', 'connections', 'api']) {
    if (type.isArray(resolved[key])) {
      resolved[key] = resolved[key].filter((item) => !type.isNone(item));
    }
  }

  moduleEntry.manifest = resolved;
}

export { resolveLocalManifest, resolveFullManifest };
