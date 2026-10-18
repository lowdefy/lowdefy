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

/*
  Keeps the shell's `nativeVersion` (package.json) honest. A shell's runtime version is
  `<nativeVersion>-<profile>` (runtimeVersion.js), so an over-the-air update reaches every binary
  built on the same nativeVersion: a change to the shell's native code that does not bump it would
  send JavaScript to binaries that cannot run it.

  It computes Expo's fingerprint (@expo/fingerprint) of the shell package for each capability
  profile and fails when the result differs from the one native-fingerprint.json records for the
  current nativeVersion. After bumping nativeVersion, `--write` records the new fingerprint.

    node scripts/checkNativeVersion.mjs [--write]

  The fingerprint hashes native inputs only:
  - Autolinked native modules by package name and version (`nativeModuleSourceType: 'package'`),
    and config plugins from node_modules the same way (`configPluginSourceType: 'package'`), so the
    pnpm layout of one machine or another does not change it.
  - The Expo config app.config.ts evaluates to, for every profile (Lowdefy Dev's shell.dev.json with
    that profile), without what is not native or is per shell: versions and the string runtime
    version, names, ids, schemes, icons, the EAS project and `extra` (the `relaxed` preset, and the
    ExpoConfigEASProject and ExpoConfigExtraSection skips).
  - withExcludedNativeModules.js, the shell's one config plugin that edits native files. The files
    app.config.ts only reads its config with (shell.json reading, profiles, exclusions) are left
    out: what they change shows in the evaluated config.
  - Not package.json scripts or .gitignore.
*/

import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultShellRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const RECORD_FILE = 'native-fingerprint.json';

// The modules app.config.ts reads its config with. Their effect is in the evaluated config.
const CONFIG_READERS = [
  'authCallbackIntentFilters.js',
  'checkShellConfig.js',
  'runtimeVersion.js',
  'profiles.js',
  'readShellConfig.js',
  'shellVariant.js',
];

function loadModules(shellRoot) {
  const require = createRequire(path.join(shellRoot, 'package.json'));
  return {
    fingerprint: require('@expo/fingerprint'),
    PROFILES: require(path.join(shellRoot, 'profiles.js')).PROFILES,
    RELEASE_PROFILES: require(path.join(shellRoot, 'profiles.js')).RELEASE_PROFILES,
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// The fingerprint of the shell built on one profile, with the variant that profile is built as.
async function createProfileFingerprint({ fingerprint, profile, shellRoot, variant }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `lowdefy-shell-fingerprint-${profile}-`));
  const configPath = path.join(directory, 'shell.json');
  const devShell = readJson(path.join(shellRoot, 'shell.dev.json'));
  fs.writeFileSync(configPath, JSON.stringify({ ...devShell, profile }));
  const previousEnv = {
    LOWDEFY_SHELL_CONFIG: process.env.LOWDEFY_SHELL_CONFIG,
    LOWDEFY_SHELL_VARIANT: process.env.LOWDEFY_SHELL_VARIANT,
  };
  // The Expo config is evaluated in a child process, which takes the environment from this one.
  process.env.LOWDEFY_SHELL_CONFIG = configPath;
  process.env.LOWDEFY_SHELL_VARIANT = variant;
  try {
    const { SourceSkips } = fingerprint;
    const result = await fingerprint.createFingerprintAsync(shellRoot, {
      preset: 'relaxed',
      sourceSkips:
        SourceSkips.PackageJsonScriptsAll |
        SourceSkips.GitIgnore |
        SourceSkips.ExpoConfigVersions |
        SourceSkips.ExpoConfigRuntimeVersionIfString |
        SourceSkips.ExpoConfigNames |
        SourceSkips.ExpoConfigAndroidPackage |
        SourceSkips.ExpoConfigIosBundleIdentifier |
        SourceSkips.ExpoConfigSchemes |
        SourceSkips.ExpoConfigEASProject |
        SourceSkips.ExpoConfigAssets |
        SourceSkips.ExpoConfigExtraSection |
        SourceSkips.EasJson |
        SourceSkips.Easignore |
        SourceSkips.AutolinkingConfigPaths,
      nativeModuleSourceType: 'package',
      configPluginSourceType: 'package',
      ignorePaths: CONFIG_READERS,
      silent: true,
    });
    // @expo/fingerprint leaves the Expo config out when it cannot evaluate it, which would hide
    // every change the config makes.
    if (!result.sources.some((source) => source.id === 'expoConfig')) {
      throw new Error(
        `Could not evaluate the shell's Expo config for profile "${profile}". Run \`LOWDEFY_SHELL_CONFIG=${configPath} LOWDEFY_SHELL_VARIANT=${variant} npx expo config\` in packages/shell to see why.`
      );
    }
    return result.hash;
  } finally {
    Object.entries(previousEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

/**
 * Expo's fingerprint of the shell package's native inputs, for every capability profile.
 *
 * @returns {Promise<{ hash: string, profiles: Object<string, string> }>}
 */
async function createNativeFingerprint({ shellRoot = defaultShellRoot } = {}) {
  const { fingerprint, PROFILES, RELEASE_PROFILES } = loadModules(shellRoot);
  const profiles = {};
  // One at a time: each sets the environment its Expo config is evaluated with.
  for (const profile of Object.keys(PROFILES)) {
    const variant = RELEASE_PROFILES.includes(profile) ? 'release' : 'dev';
    profiles[profile] = await createProfileFingerprint({
      fingerprint,
      profile,
      shellRoot,
      variant,
    });
  }
  const hash = crypto
    .createHash('sha1')
    .update(
      Object.keys(profiles)
        .sort()
        .map((profile) => `${profile}:${profiles[profile]}`)
        .join('\n')
    )
    .digest('hex');
  return { hash, profiles };
}

/**
 * Compares the shell's native fingerprint with the one recorded for its nativeVersion.
 *
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
async function checkNativeVersion({ shellRoot = defaultShellRoot, write = false } = {}) {
  const { nativeVersion } = readJson(path.join(shellRoot, 'package.json'));
  if (!Number.isInteger(nativeVersion) || nativeVersion < 1) {
    return {
      ok: false,
      message: `package.json "nativeVersion" should be a positive integer. Received ${JSON.stringify(
        nativeVersion
      )}.`,
    };
  }
  const recordPath = path.join(shellRoot, RECORD_FILE);
  const recorded = fs.existsSync(recordPath) ? readJson(recordPath) : null;
  const current = await createNativeFingerprint({ shellRoot });
  if (recorded?.nativeVersion === nativeVersion && recorded.hash === current.hash) {
    return {
      ok: true,
      message: `The shell's native fingerprint matches the one recorded for nativeVersion ${nativeVersion}.`,
    };
  }
  if (recorded?.nativeVersion === nativeVersion) {
    const changed = Object.keys(current.profiles).filter(
      (profile) => recorded.profiles?.[profile] !== current.profiles[profile]
    );
    return {
      ok: false,
      message: `The shell's native code changed (profiles ${changed.join(
        ', '
      )}) but nativeVersion is still ${nativeVersion}. Bump "nativeVersion" in packages/shell/package.json, then run \`pnpm --filter=@lowdefy/shell check:native-version --write\`. Every shell then needs a native build before it takes over-the-air updates.`,
    };
  }
  if (recorded !== null && nativeVersion < recorded.nativeVersion) {
    return {
      ok: false,
      message: `nativeVersion ${nativeVersion} is below the recorded ${recorded.nativeVersion}. nativeVersion only goes up.`,
    };
  }
  if (!write) {
    return {
      ok: false,
      message: `nativeVersion is ${nativeVersion}, but ${RECORD_FILE} records ${
        recorded?.nativeVersion ?? 'nothing'
      }. Run \`pnpm --filter=@lowdefy/shell check:native-version --write\` to record the fingerprint for ${nativeVersion}.`,
    };
  }
  fs.writeFileSync(
    recordPath,
    `${JSON.stringify(
      { nativeVersion, hash: current.hash, profiles: current.profiles },
      null,
      2
    )}\n`
  );
  return {
    ok: true,
    message: `Recorded the shell's native fingerprint for nativeVersion ${nativeVersion}.`,
  };
}

async function main() {
  const { ok, message } = await checkNativeVersion({ write: process.argv.includes('--write') });
  if (!ok) {
    console.error(message);
    process.exit(1);
  }
  console.log(message);
}

if (fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

export { checkNativeVersion, createNativeFingerprint };
