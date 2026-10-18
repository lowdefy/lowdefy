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
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

import { getAuthCallbackIntentFilters } from './authCallbackIntentFilters.js';
import getPrivacyManifest from './getPrivacyManifest.js';
import { pluginName } from './profiles.js';
import readShellConfig from './readShellConfig.js';
import getRuntimeVersion from './runtimeVersion.js';
import { getExclusions, getShellProfile, getShellVariant } from './shellVariant.js';
import withExcludedNativeModules from './withExcludedNativeModules.js';

// The shell's config is its shell.json (readShellConfig.js). Its capability profile and version are
// added here, at build, so the app reads one object (src/config/getShellConfig.js). The type
// manifest is not: it travels in the JavaScript bundle (src/plugins/typeManifest.js), since an
// embedded launch reads the Expo config of the native build, not that of the JavaScript it runs.
//
// Three versions: `version` is the store version (shell.json `version`, set per build by
// `lowdefy mobile`); `extra.shell.version` is the @lowdefy/shell package version, which the runtime
// sends as `x-lowdefy-shell`; `runtimeVersion` is `<nativeVersion>-<profile>[-<plugins hash>]`
// (runtimeVersion.js), which decides which over-the-air updates a binary takes.
const shellRoot = __dirname;

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// The shell's icon (shell.json `icon`, a 1024×1024 PNG, relative to shell.json) and its Android
// adaptive-icon foreground: the icon padded into the launcher's safe zone, written beside shell.json
// once per icon (scripts/createShellAssets.mjs) and reused while the icon is unchanged.
function createShellIcons({ configPath, shell }) {
  const directory = path.dirname(configPath);
  const icon = path.resolve(directory, shell.icon);
  const iconHash = crypto
    .createHash('sha256')
    .update(fs.readFileSync(icon))
    .digest('hex')
    .slice(0, 12);
  const adaptiveForeground = path.join(directory, `adaptive-icon-${iconHash}.png`);
  if (!fs.existsSync(adaptiveForeground)) {
    execFileSync(process.execPath, [
      path.join(shellRoot, 'scripts/createShellAssets.mjs'),
      icon,
      adaptiveForeground,
    ]);
  }
  return { adaptiveForeground, icon };
}

// The splash shows the shell's icon on its colour.
function withSplash({ color, icon, plugins }) {
  return plugins.map((plugin) =>
    pluginName(plugin) === 'expo-splash-screen'
      ? ['expo-splash-screen', { image: icon, imageWidth: 200, backgroundColor: color }]
      : plugin
  );
}

export default function appConfig({ config }: ConfigContext): ExpoConfig {
  const { configPath, shell } = readShellConfig();
  const variant = getShellVariant();
  const { nativeVersion, version } = readJson(path.join(shellRoot, 'package.json'));
  // The shell carries only its capability profile's native modules (profiles.js). The rest, and
  // Lowdefy Dev's developer features in a release shell, are left out: not linked, their config
  // plugins and permissions not applied (scripts/checkReleaseBundle.mjs checks it).
  const profile = getShellProfile({ shell, variant });
  const excluded = getExclusions({ shell, variant });
  // Lowdefy Dev has no icon of its own and keeps Expo's.
  const icons = shell.icon === undefined ? null : createShellIcons({ configPath, shell });
  const color = shell.color ?? '#FFFFFF';
  const appConfigResult: ExpoConfig = {
    ...config,
    name: shell.name,
    slug: shell.id,
    // Lowdefy Dev has no store version of its own here.
    version: shell.version ?? '0.0.0',
    runtimeVersion: getRuntimeVersion({
      nativeVersion,
      profile: profile.name,
      plugins: shell.plugins,
    }),
    platforms: ['ios', 'android'],
    scheme: shell.scheme,
    orientation: 'default',
    userInterfaceStyle: 'automatic',
    ...(icons ? { icon: icons.icon } : {}),
    ios: {
      bundleIdentifier: shell.ios?.bundleIdentifier,
      supportsTablet: true,
      // The shell uses only the encryption the OS provides (HTTPS, the Keychain), so App Store
      // Connect asks no export compliance question on upload.
      config: { usesNonExemptEncryption: false },
      privacyManifests: getPrivacyManifest({ privacyReasons: profile.privacyReasons }),
    },
    android: {
      package: shell.android?.package,
      ...(icons
        ? { adaptiveIcon: { foregroundImage: icons.adaptiveForeground, backgroundColor: color } }
        : {}),
      // The sign-in sheet returns by a verified app link on Android (src/auth/signInWithSheet.js).
      intentFilters: getAuthCallbackIntentFilters({ shell }),
      blockedPermissions: excluded.permissions.filter((permission) =>
        permission.startsWith('android.permission.')
      ),
    },
    plugins: icons
      ? withSplash({ color, icon: icons.icon, plugins: profile.plugins })
      : profile.plugins,
    // A shell built for the stores is its own EAS project, which serves its over-the-air updates.
    // Lowdefy Dev's shell.dev.json has none.
    ...(shell.eas
      ? {
          owner: shell.eas.owner,
          updates: { url: `https://u.expo.dev/${shell.eas.projectId}` },
        }
      : {}),
    extra: {
      ...(shell.eas ? { eas: { projectId: shell.eas.projectId } } : {}),
      shell: {
        ...shell,
        profile: profile.name,
        capabilities: shell.capabilities ?? profile.capabilities,
        variant,
        version,
      },
    },
  };
  return withExcludedNativeModules(appConfigResult, Object.keys(excluded.modules));
}
