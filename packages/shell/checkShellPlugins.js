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

const { PROFILES, RELEASE_PROFILES, resolveProfile } = require('./profiles.js');
const { getProfileName, getShellProfile } = require('./shellVariant.js');

// Release profiles first, lowest first, so an error names the smallest profile a shell can pick.
const PROFILE_ORDER = [
  ...RELEASE_PROFILES,
  ...Object.keys(PROFILES).filter((name) => !RELEASE_PROFILES.includes(name)),
];

function findProfile(carries) {
  return PROFILE_ORDER.find((name) => carries(resolveProfile(name)));
}

/**
 * Refuses shell plugins that would carry native code around the capability profiles, so plugins
 * never become a way past profile review. Throws, naming the plugin and the profile to pick, when
 * a plugin's `./shell` entry:
 * - links a module @lowdefy/shell depends on itself (one of any profile's, such as expo-camera); or
 * - asks for a permission some profile carries and this shell's profile leaves out (the camera on
 *   `basic`).
 *
 * `lowdefy mobile config` runs it from the copied shell, and app.config.ts runs it again, so a
 * hand-edited shell.json is refused at prebuild.
 *
 * @param {Object} params
 * @param {Object} params.shell The shell config (shell.json).
 * @param {string} params.variant The shell variant, dev or release.
 * @param {{ name: string, entry: Object }[]} params.plugins The resolved shell plugins
 *   (resolveShellPlugins.js).
 */
function checkShellPlugins({ shell, variant, plugins }) {
  const profileName = getProfileName({ shell, variant });
  const profile = getShellProfile({ shell, variant });
  plugins.forEach(({ name, entry }) => {
    Object.keys(entry.modules ?? {}).forEach((module) => {
      const carrier = findProfile((candidate) => module in candidate.modules);
      if (carrier !== undefined) {
        throw new Error(
          `Shell plugin "${name}" links "${module}", which @lowdefy/shell carries in the "${carrier}" profile. Pick the profile that carries it instead of adding it with a plugin.`
        );
      }
    });
    (entry.permissions ?? []).forEach((permission) => {
      if (profile.permissions.includes(permission)) {
        return;
      }
      const carrier = findProfile((candidate) => candidate.permissions.includes(permission));
      if (carrier !== undefined) {
        throw new Error(
          `Shell plugin "${name}" asks for "${permission}", which the "${profileName}" profile leaves out. Pick the "${carrier}" profile, which carries it.`
        );
      }
    });
  });
  return plugins;
}

module.exports = checkShellPlugins;
