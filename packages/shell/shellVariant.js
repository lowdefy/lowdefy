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

const {
  applyExtensions,
  DEV_ENTRY,
  EXTENSIONS,
  PROFILES,
  mergeProfiles,
  pluginName,
  resolveProfile,
} = require('./profiles.js');

const VARIANTS = ['dev', 'release'];

// The string the dev-tab client sends to the dev server. scripts/checkReleaseBundle.mjs fails when a
// release bundle holds it. Keep it in step with src/dev/tab/devClientMarker.js.
const DEV_CLIENT_MARKER = 'lowdefy-dev-tab-client';

// Everything any profile or extension carries: every module, entry and permission a build can
// leave out.
const EVERYTHING = applyExtensions(
  Object.keys(PROFILES).reduce(
    (all, name) => mergeProfiles(all, resolveProfile(name)),
    resolveProfile('basic')
  ),
  Object.keys(EXTENSIONS)
);

// What the `dev` profile adds itself: the developer features, which a release build never carries.
const DEV_ONLY = PROFILES.dev;

// The shell's capability profile: shell.json `profile`, else `dev` for Lowdefy Dev and `basic` for
// any other shell.
function getProfileName({ shell, variant }) {
  return shell.profile ?? (variant === 'dev' ? 'dev' : 'basic');
}

/**
 * What a shell build of this variant carries: its profile, resolved (profiles.js), with its
 * extensions (shell.json `extensions`). The dev variant also carries Lowdefy Dev's developer
 * features, whatever the profile; a release build carries none of them.
 */
function getShellProfile({ shell, variant }) {
  const profile = applyExtensions(
    resolveProfile(getProfileName({ shell, variant })),
    shell.extensions
  );
  if (variant === 'dev') {
    return mergeProfiles(profile, { ...resolveProfile('dev'), name: profile.name });
  }
  return {
    ...profile,
    modules: Object.fromEntries(
      Object.entries(profile.modules).filter(([name]) => !(name in DEV_ONLY.modules))
    ),
    plugins: profile.plugins.filter((plugin) => !(pluginName(plugin) in DEV_ONLY.modules)),
    permissions: profile.permissions.filter(
      (permission) => !DEV_ONLY.permissions.includes(permission)
    ),
    jsEntries: profile.jsEntries.filter((entry) => !DEV_ONLY.jsEntries.includes(entry)),
  };
}

/**
 * What a shell build of this variant leaves out: every module, JavaScript entry and permission some
 * profile carries and its own does not. app.config.ts leaves the modules unlinked and their config
 * plugins unapplied (withExcludedNativeModules.js) and blocks the permissions; metro.config.js
 * resolves the entries to empty modules.
 *
 * @returns {{ modules: Object<string, string|null>, jsEntries: string[], permissions: string[] }}
 *   modules as { [package]: nativeModuleName }.
 */
function getExclusions({ shell, variant }) {
  const profile = getShellProfile({ shell, variant });
  return {
    modules: Object.fromEntries(
      Object.entries(EVERYTHING.modules).filter(([name]) => !(name in profile.modules))
    ),
    jsEntries: EVERYTHING.jsEntries.filter((entry) => !profile.jsEntries.includes(entry)),
    permissions: EVERYTHING.permissions.filter(
      (permission) => !profile.permissions.includes(permission)
    ),
  };
}

// The native modules a shell build leaves unlinked, as { [package]: nativeModuleName }.
function getExcludedModules({ shell, variant }) {
  return getExclusions({ shell, variant }).modules;
}

// LOWDEFY_SHELL_VARIANT=dev | release. Without it, Lowdefy Dev (no LOWDEFY_SHELL_CONFIG) is dev and
// every other shell is release, so a customer shell leaves the developer features out unless its
// build asks for them.
function getShellVariant(env = process.env) {
  const variant = env.LOWDEFY_SHELL_VARIANT || (env.LOWDEFY_SHELL_CONFIG ? 'release' : 'dev');
  if (!VARIANTS.includes(variant)) {
    throw new Error(
      `LOWDEFY_SHELL_VARIANT must be "dev" or "release". Received ${JSON.stringify(variant)}.`
    );
  }
  return variant;
}

module.exports = {
  DEV_CLIENT_MARKER,
  DEV_ENTRY,
  getExcludedModules,
  getExclusions,
  getProfileName,
  getShellProfile,
  getShellVariant,
};
