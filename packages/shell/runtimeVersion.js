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

// A short hash of the shell plugins a shell carries, the same whatever order they are listed in.
function hashPlugins(plugins) {
  const keys = plugins.map((plugin) => {
    if (typeof plugin?.name !== 'string' || typeof plugin?.version !== 'string') {
      throw new Error(
        `Each shell plugin should be { name, version } with string values. Received ${JSON.stringify(
          plugin
        )}.`
      );
    }
    return `${plugin.name}@${plugin.version}`;
  });
  return crypto.createHash('sha256').update(keys.sort().join('\n')).digest('hex').slice(0, 8);
}

/**
 * The runtime version of a shell build: `<nativeVersion>-<profile>`, and `-<plugins hash>` when the
 * shell carries shell plugins. An over-the-air update reaches only binaries with the same runtime
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
 * @param {{ name: string, version: string }[]} [params.plugins] The shell plugins it carries.
 * @returns {string}
 */
function getRuntimeVersion({ nativeVersion, profile, plugins = [] }) {
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
  if (plugins.length === 0) {
    return `${nativeVersion}-${profile}`;
  }
  return `${nativeVersion}-${profile}-${hashPlugins(plugins)}`;
}

// `require('./runtimeVersion.js')` is the function, and `.getRuntimeVersion` names it too, so
// `lowdefy mobile` can load it from the copied shell either way.
module.exports = getRuntimeVersion;
module.exports.getRuntimeVersion = getRuntimeVersion;
