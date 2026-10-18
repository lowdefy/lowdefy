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

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

import { getAuthCallbackIntentFilters } from './authCallbackIntentFilters.js';
import readShellConfig from './readShellConfig.js';
import { getExclusions, getShellProfile, getShellVariant } from './shellVariant.js';
import withExcludedNativeModules from './withExcludedNativeModules.js';

// The shell's config is its shell.json (readShellConfig.js). Its capability profile, version and
// type manifest are added here, at build, so the app reads one object
// (src/config/getShellConfig.js).
const shellRoot = __dirname;

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function createTypeManifest() {
  const output = execFileSync(
    process.execPath,
    [path.join(shellRoot, 'scripts/createTypeManifest.mjs')],
    { encoding: 'utf8' }
  );
  return JSON.parse(output);
}

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  const { shell } = readShellConfig();
  const variant = getShellVariant();
  const { version } = readJson(path.join(shellRoot, 'package.json'));
  // The shell carries only its capability profile's native modules (profiles.js). The rest, and
  // Lowdefy Dev's developer features in a release shell, are left out: not linked, their config
  // plugins and permissions not applied (scripts/checkReleaseBundle.mjs checks it).
  const profile = getShellProfile({ shell, variant });
  const excluded = getExclusions({ shell, variant });
  const appConfigResult: ExpoConfig = {
    ...config,
    name: shell.name,
    slug: shell.id,
    version,
    platforms: ['ios', 'android'],
    scheme: shell.scheme,
    orientation: 'default',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: shell.ios?.bundleIdentifier,
      supportsTablet: true,
    },
    android: {
      package: shell.android?.package,
      // The sign-in sheet returns by a verified app link on Android (src/auth/signInWithSheet.js).
      intentFilters: getAuthCallbackIntentFilters({ shell }),
      blockedPermissions: excluded.permissions.filter((permission) =>
        permission.startsWith('android.permission.')
      ),
    },
    plugins: profile.plugins,
    extra: {
      shell: {
        ...shell,
        profile: profile.name,
        capabilities: shell.capabilities ?? profile.capabilities,
        variant,
        version,
        typeManifest: createTypeManifest(),
      },
    },
  };
  return withExcludedNativeModules(appConfigResult, Object.keys(excluded.modules));
}
