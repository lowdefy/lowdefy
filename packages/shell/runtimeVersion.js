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

const crypto = require('node:crypto');

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// JSON with every object's keys sorted, at every depth, so options that differ only in key order
// give the same text.
function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (isObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

// A short hash of the shell plugins a shell carries, the same whatever order they are listed in.
// Each plugin is keyed on name@version and its options: config plugins bake the options into the
// native project, so an option change is a native change. No options and {} hash the same.
function hashPlugins(plugins) {
  const keys = plugins.map((plugin) => {
    if (typeof plugin?.name !== 'string' || typeof plugin?.version !== 'string') {
      throw new Error(
        `Each shell plugin should be { name, version } with string values. Received ${JSON.stringify(
          plugin
        )}.`
      );
    }
    if (plugin.options !== undefined && !isObject(plugin.options)) {
      throw new Error(
        `Shell plugin "${plugin.name}" options should be an object. Received ${JSON.stringify(
          plugin.options
        )}.`
      );
    }
    return `${plugin.name}@${plugin.version} ${canonicalJson(plugin.options ?? {})}`;
  });
  return crypto.createHash('sha256').update(keys.sort().join('\n')).digest('hex').slice(0, 8);
}

/**
 * The runtime version of a shell build: `<nativeVersion>-<profile>`, `+<extension>` for each
 * extension it carries (in a fixed order), and `-<plugins hash>` when it carries shell plugins. An over-the-air update reaches only binaries with the same runtime
 * version, so it changes only with the shell's native code (`nativeVersion` in package.json, bumped
 * on purpose and kept honest by scripts/checkNativeVersion.mjs), its capability profile and its
 * plugins. Shell identity (name, ids, scheme, icon, colour, URLs) is not part of it, so every shell
 * on one nativeVersion and profile shares a runtime version.
 *
 * Pure, with no Expo import, so `lowdefy mobile` computes the same value app.config.ts sets from the copied
 * shell's runtimeVersion.js and package.json `nativeVersion`.
 *
 * @param {Object} params
 * @param {number} params.nativeVersion The shell package's nativeVersion.
 * @param {string} params.profile The shell's capability profile.
 * @param {{ name: string, version: string, options?: Object }[]} [params.plugins] The shell plugins
 *   it carries (shell.json `plugins`).
 * @param {string[]} [params.extensions] The shell extensions it carries (shell.json `extensions`).
 * @returns {string}
 */
function getRuntimeVersion({ nativeVersion, profile, plugins = [], extensions = [] }) {
  if (!isPositiveInteger(nativeVersion)) {
    throw new Error(
      `nativeVersion should be a positive integer. Received ${JSON.stringify(nativeVersion)}.`
    );
  }
  if (typeof profile !== 'string' || profile.length === 0) {
    throw new Error(`profile should be a string. Received ${JSON.stringify(profile)}.`);
  }
  if (!Array.isArray(plugins)) {
    throw new Error(`plugins should be an array. Received ${JSON.stringify(plugins)}.`);
  }
  if (!Array.isArray(extensions) || !extensions.every((name) => typeof name === 'string')) {
    throw new Error(
      `extensions should be an array of names. Received ${JSON.stringify(extensions)}.`
    );
  }
  const base = [`${nativeVersion}-${profile}`, ...[...extensions].sort()].join('+');
  if (plugins.length === 0) {
    return base;
  }
  return `${base}-${hashPlugins(plugins)}`;
}

// `require('./runtimeVersion.js')` is the function, and `.getRuntimeVersion` names it too, so
// `lowdefy mobile` can load it from the copied shell either way.
module.exports = getRuntimeVersion;
module.exports.getRuntimeVersion = getRuntimeVersion;
