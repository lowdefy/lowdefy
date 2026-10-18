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

// What a shell's app config carries so App Store Connect and Google Play take an upload without a
// person answering questions: export compliance, a privacy manifest, the icon, splash and Android
// adaptive icon.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { printerPlugin, withPrinterPlugin } from './fixtures/withPrinterPlugin.mjs';
import { createAdaptiveIconForeground } from './scripts/createShellAssets.mjs';

const require = createRequire(import.meta.url);
const Jimp = require('jimp-compact');
const applyShellPlugins = require('./applyShellPlugins.js');
const getPrivacyManifest = require('./getPrivacyManifest.js');
const { mergeProfiles, resolveProfile } = require('./profiles.js');
const resolveShellPlugins = require('./resolveShellPlugins.js');
const getRuntimeVersion = require('./runtimeVersion.js');
const { getShellProfile } = require('./shellVariant.js');
const shellPackage = require('./package.json');

const shellRoot = path.dirname(fileURLToPath(import.meta.url));

function withTemporaryDirectory(callback) {
  // The real path: scripts run by app.config.ts compare their own path with the one they were
  // started with, and macOS's temporary directory is behind a symlink.
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-shell-store-'));
  return Promise.resolve(callback(directory)).finally(() =>
    fs.rmSync(directory, { recursive: true, force: true })
  );
}

// A 1024×1024 opaque icon, filled to its edges, as a shell entry's icon must be.
async function writeIcon(filePath) {
  await new Jimp(1024, 1024, 0x0b5fffff).writeAsync(filePath);
}

// The box around the pixels that are not fully transparent.
function opaqueBounds(image) {
  let left = Infinity;
  let top = Infinity;
  let right = -1;
  let bottom = -1;
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, index) => {
    if (image.bitmap.data[index + 3] > 0) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  });
  return { left, top, right, bottom };
}

// The app config `expo config` prints: `introspect` as prebuild sees it, after the config plugins'
// Info.plist changes; `prebuild` as the config states it.
function readAppConfig(configPath, type = 'prebuild', env = process.env) {
  const output = execFileSync(
    path.join(shellRoot, 'node_modules', '.bin', 'expo'),
    ['config', '--type', type, '--json'],
    {
      cwd: shellRoot,
      encoding: 'utf8',
      env: { ...env, LOWDEFY_SHELL_CONFIG: configPath, LOWDEFY_SHELL_VARIANT: 'release' },
      stdio: ['ignore', 'pipe', 'ignore'],
    }
  );
  return JSON.parse(output);
}

const fieldShell = {
  id: 'field',
  name: 'Field',
  profile: 'field',
  version: '1.4.0',
  icon: './icon.png',
  color: '#0B5FFF',
  scheme: 'field',
  environment: 'production',
  ios: { bundleIdentifier: 'com.example.field' },
  android: { package: 'com.example.field' },
  app: { id: 'field', name: 'Field', urls: { production: 'https://field.example.com' } },
};

function categories(manifest) {
  return manifest.NSPrivacyAccessedAPITypes.map(({ NSPrivacyAccessedAPIType }) =>
    NSPrivacyAccessedAPIType.replace('NSPrivacyAccessedAPICategory', '')
  );
}

test('every profile declares the required-reason APIs React Native and expo-sqlite use', () => {
  ['basic', 'field', 'dev'].forEach((name) => {
    const manifest = getPrivacyManifest(resolveProfile(name));
    assert.deepEqual(categories(manifest), [
      'FileTimestamp',
      'UserDefaults',
      'SystemBootTime',
      'DiskSpace',
    ]);
    assert.deepEqual(manifest.NSPrivacyAccessedAPITypes[1], {
      NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
      NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
    });
  });
});

test('the privacy manifest grows when a profile adds a module with reasons, without duplicates', () => {
  const profile = mergeProfiles(resolveProfile('field'), {
    privacyReasons: [
      { category: 'NSPrivacyAccessedAPICategoryActiveKeyboards', reasons: ['3EC4.1'] },
      { category: 'NSPrivacyAccessedAPICategoryFileTimestamp', reasons: ['C617.1', '3B52.1'] },
    ],
  });
  const manifest = getPrivacyManifest(profile);
  assert.deepEqual(categories(manifest), [
    'FileTimestamp',
    'UserDefaults',
    'SystemBootTime',
    'DiskSpace',
    'ActiveKeyboards',
  ]);
  assert.deepEqual(manifest.NSPrivacyAccessedAPITypes[0].NSPrivacyAccessedAPITypeReasons, [
    'C617.1',
    '3B52.1',
  ]);
});

test('the adaptive-icon foreground holds the icon inside the centre 66%', () =>
  withTemporaryDirectory(async (directory) => {
    const icon = path.join(directory, 'icon.png');
    const output = path.join(directory, 'foreground.png');
    await writeIcon(icon);
    await createAdaptiveIconForeground({ icon, output });
    const foreground = await Jimp.read(output);
    assert.equal(foreground.bitmap.width, 1024);
    assert.equal(foreground.bitmap.height, 1024);
    const bounds = opaqueBounds(foreground);
    const margin = (1024 * (1 - 0.66)) / 2;
    assert.ok(bounds.left >= Math.floor(margin), JSON.stringify(bounds));
    assert.ok(bounds.top >= Math.floor(margin), JSON.stringify(bounds));
    assert.ok(bounds.right <= Math.ceil(1024 - margin), JSON.stringify(bounds));
    assert.ok(bounds.bottom <= Math.ceil(1024 - margin), JSON.stringify(bounds));
    assert.ok(bounds.right - bounds.left >= 670, 'the icon fills the safe zone');
  }));

test("a store shell's app config declares export compliance, privacy, icon, splash and adaptive icon", () =>
  withTemporaryDirectory(async (directory) => {
    const configPath = path.join(directory, 'shell.json');
    await writeIcon(path.join(directory, 'icon.png'));
    fs.writeFileSync(configPath, JSON.stringify(fieldShell));

    const config = readAppConfig(configPath, 'introspect');
    const icon = path.join(directory, 'icon.png');
    assert.deepEqual(config.ios.config, { usesNonExemptEncryption: false });
    assert.equal(config.ios.infoPlist.ITSAppUsesNonExemptEncryption, false);
    assert.deepEqual(config.ios.privacyManifests, getPrivacyManifest(resolveProfile('field')));
    assert.equal(config.icon, icon);
    assert.deepEqual(
      config.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'),
      ['expo-splash-screen', { image: icon, imageWidth: 200, backgroundColor: '#0B5FFF' }]
    );
    assert.equal(config.android.adaptiveIcon.backgroundColor, '#0B5FFF');
    const foreground = config.android.adaptiveIcon.foregroundImage;
    assert.equal(path.dirname(foreground), directory);
    assert.match(path.basename(foreground), /^adaptive-icon-[0-9a-f]{12}\.png$/);

    // Written once per icon: a second evaluation reuses it.
    const written = fs.statSync(foreground).mtimeMs;
    assert.equal(readAppConfig(configPath).android.adaptiveIcon.foregroundImage, foreground);
    assert.equal(fs.statSync(foreground).mtimeMs, written);
  }));

test('a shell config without an icon keeps Expo defaults and still declares compliance', () =>
  withTemporaryDirectory(async (directory) => {
    const configPath = path.join(directory, 'shell.json');
    fs.writeFileSync(configPath, JSON.stringify({ ...fieldShell, icon: undefined }));
    const config = readAppConfig(configPath);
    assert.equal(config.icon, undefined);
    assert.equal(config.android.adaptiveIcon, undefined);
    assert.ok(config.plugins.includes('expo-splash-screen'));
    assert.deepEqual(config.ios.config, { usesNonExemptEncryption: false });
  }));

const printerShell = {
  ...fieldShell,
  icon: undefined,
  plugins: [{ ...printerPlugin, typePrefix: 'Printer', options: { tenant: 'field-team' } }],
};

test("a shell plugin's config plugins, permissions, privacy reasons and data join the profile", () =>
  withPrinterPlugin(({ directory, env, require: shellRequire }) => {
    const configPath = path.join(directory, 'shell.json');
    fs.writeFileSync(configPath, JSON.stringify(printerShell));
    const config = readAppConfig(configPath, 'introspect', env);

    // The plugin's config plugin ran, with the plugin's options.
    assert.equal(
      config.ios.infoPlist.NSBluetoothAlwaysUsageDescription,
      'Print labels for field-team.'
    );
    assert.ok(config.android.permissions.includes('android.permission.BLUETOOTH_CONNECT'));
    assert.ok(!config.android.blockedPermissions.includes('android.permission.BLUETOOTH_CONNECT'));
    // The profile's own config plugins and permissions stay.
    assert.equal(
      config.ios.infoPlist.NSCameraUsageDescription,
      'Allow $(PRODUCT_NAME) to use the camera.'
    );
    assert.deepEqual(config.extra.shell.capabilities, [
      'biometrics',
      'sign-in',
      'camera',
      'printer',
    ]);

    // Privacy reasons merge per category: UserDefaults gains the plugin's reason, and its new
    // category is added once.
    const reasons = Object.fromEntries(
      config.ios.privacyManifests.NSPrivacyAccessedAPITypes.map((type) => [
        type.NSPrivacyAccessedAPIType.replace('NSPrivacyAccessedAPICategory', ''),
        type.NSPrivacyAccessedAPITypeReasons,
      ])
    );
    assert.deepEqual(reasons, {
      FileTimestamp: ['C617.1'],
      UserDefaults: ['CA92.1', '1C8F.1'],
      SystemBootTime: ['35F9.1'],
      DiskSpace: ['E174.1'],
      ActiveKeyboards: ['3EC4.1'],
    });

    assert.equal(
      config.runtimeVersion,
      getRuntimeVersion({
        nativeVersion: shellPackage.nativeVersion,
        profile: 'field',
        plugins: printerShell.plugins,
      })
    );
    assert.match(
      config.runtimeVersion,
      new RegExp(`^${shellPackage.nativeVersion}-field-[0-9a-f]{8}$`)
    );

    // The profile app.config.ts builds with carries the plugin's data, for the store answers.
    const profile = applyShellPlugins({
      profile: getShellProfile({ shell: printerShell, variant: 'release' }),
      plugins: resolveShellPlugins({ shell: printerShell, require: shellRequire }),
    });
    assert.equal(profile.name, 'field');
    assert.deepEqual(profile.dataCollected, [
      { type: 'emailAddress', purpose: 'appFunctionality' },
      { type: 'userId', purpose: 'appFunctionality' },
      { type: 'photos', purpose: 'appFunctionality' },
      { type: 'deviceId', purpose: 'appFunctionality' },
    ]);
    assert.deepEqual(profile.modules['react-native-ble-plx'], 'BlePlx');
  }));

test('a shell plugin asking for the camera on a basic shell fails the app config', () =>
  withPrinterPlugin(({ directory, env }) => {
    const packageDir = path.join(directory, 'node_modules', '@example', 'lowdefy-scanner');
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(
      path.join(packageDir, 'package.json'),
      JSON.stringify({
        name: '@example/lowdefy-scanner',
        version: '1.0.0',
        exports: { './shell': './shell.cjs' },
      })
    );
    fs.writeFileSync(
      path.join(packageDir, 'shell.cjs'),
      "module.exports = { plugins: [], permissions: ['NSCameraUsageDescription'] };"
    );
    const configPath = path.join(directory, 'shell.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        ...fieldShell,
        icon: undefined,
        profile: 'basic',
        plugins: [{ name: '@example/lowdefy-scanner', version: '1.0.0' }],
      })
    );
    assert.throws(
      () =>
        execFileSync(path.join(shellRoot, 'node_modules', '.bin', 'expo'), ['config', '--json'], {
          cwd: shellRoot,
          encoding: 'utf8',
          env: { ...env, LOWDEFY_SHELL_CONFIG: configPath, LOWDEFY_SHELL_VARIANT: 'release' },
          stdio: ['ignore', 'pipe', 'pipe'],
        }),
      (error) =>
        error.stderr.includes(
          'Shell plugin "@example/lowdefy-scanner" asks for "NSCameraUsageDescription", which the "basic" profile leaves out. Pick the "field" profile, which carries it.'
        )
    );
  }));
