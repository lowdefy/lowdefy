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

const { mergeProfiles } = require('./profiles.js');

/**
 * A shell's resolved profile with its plugins' `./shell` entries folded in (resolveShellPlugins.js):
 * their capabilities, modules, config plugins, permissions, privacy reasons and data join the
 * profile's. The profile keeps its name, and its JavaScript entries are its own.
 *
 * @param {Object} params
 * @param {Object} params.profile The shell's resolved profile (getShellProfile in shellVariant.js).
 * @param {{ entry: Object }[]} params.plugins The resolved shell plugins.
 */
function applyShellPlugins({ profile, plugins }) {
  return plugins.reduce(
    (merged, { entry }) =>
      mergeProfiles(merged, {
        capabilities: entry.capabilities,
        modules: entry.modules,
        plugins: entry.plugins,
        permissions: entry.permissions,
        privacyReasons: entry.privacyReasons,
        dataCollected: entry.dataCollected,
      }),
    profile
  );
}

module.exports = applyShellPlugins;
