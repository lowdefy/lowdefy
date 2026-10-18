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

import { getShellVariant } from './shellVariant.js';

// The shell's config comes from shell.json, written for each shell at build: LOWDEFY_SHELL_CONFIG
// is its path. Without it the shell is Lowdefy Dev (shell.dev.json), which opens `lowdefy dev`.
// The shell's version and type manifest are added here, at build, so the app reads one object
// (src/config/getShellConfig.js).
const shellRoot = __dirname;

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readShellJson() {
  const configPath = process.env.LOWDEFY_SHELL_CONFIG
    ? path.resolve(process.env.LOWDEFY_SHELL_CONFIG)
    : path.join(shellRoot, 'shell.dev.json');
  return readJson(configPath);
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
  const shell = readShellJson();
  const variant = getShellVariant();
  const { version } = readJson(path.join(shellRoot, 'package.json'));
  return {
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
      blockedPermissions: variant === 'release' ? ['android.permission.CAMERA'] : [],
    },
    plugins: [
      'expo-router',
      [
        'expo-local-authentication',
        { faceIDPermission: 'Allow $(PRODUCT_NAME) to use Face ID to unlock the app.' },
      ],
      [
        'expo-secure-store',
        { faceIDPermission: 'Allow $(PRODUCT_NAME) to use Face ID to unlock the app.' },
      ],
      'expo-splash-screen',
      'expo-sqlite',
      'expo-web-browser',
      // expo-camera is linked into every shell: Lowdefy Dev scans the code lowdefy dev prints
      // with it (src/dev). Android's microphone permission is left out; a release shell, which
      // never asks for the camera, blocks Android's camera permission too.
      [
        'expo-camera',
        {
          cameraPermission:
            variant === 'dev'
              ? 'Allow $(PRODUCT_NAME) to scan the code lowdefy dev prints.'
              : 'Allow $(PRODUCT_NAME) to use the camera.',
          recordAudioAndroid: false,
        },
      ],
    ],
    extra: {
      shell: {
        ...shell,
        variant,
        version,
        typeManifest: createTypeManifest(),
      },
    },
  };
}
