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

// Which native modules, entries and permissions a shell leaves out. scripts/checkReleaseBundle.mjs
// checks a real bundle and prebuild against the same lists.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { DEV_ENTRY, WIDGETS_ENTRY } = require('./profiles.js');
const {
  getExcludedModules,
  getExclusions,
  getProfileName,
  getShellProfile,
  getShellVariant,
} = require('./shellVariant.js');

// Lowdefy Dev carries every profile's modules; it leaves out only the widgets extension, an app
// extension target of an app's own shell.
const LOWDEFY_DEV_EXCLUDED = { 'expo-widgets': 'ExpoWidgets' };

const FIELD_MODULES = [
  'expo-audio',
  'expo-brightness',
  'expo-camera',
  'expo-location',
  'expo-maps',
  'react-native-document-scanner-plugin',
];
const OPT_IN_MODULES = ['expo-calendar', 'expo-contacts', 'expo-widgets'];
const DEV_MODULES = ['expo-dev-client', 'expo-sensors', 'react-native-view-shot'];

test('Lowdefy Dev links every module it uses', () => {
  assert.deepEqual(
    getExcludedModules({ shell: { profile: 'dev' }, variant: 'dev' }),
    LOWDEFY_DEV_EXCLUDED
  );
});

test('a development build links every module the dev variant uses', () => {
  assert.deepEqual(
    getExcludedModules({ shell: { profile: 'development' }, variant: 'dev' }),
    LOWDEFY_DEV_EXCLUDED
  );
});

test('a basic release shell leaves out the field, NFC, opt-in and dev-only modules', () => {
  assert.deepEqual(
    Object.keys(getExcludedModules({ shell: { profile: 'basic' }, variant: 'release' })).sort(),
    [...FIELD_MODULES, ...OPT_IN_MODULES, ...DEV_MODULES, 'react-native-nfc-manager'].sort()
  );
});

test('a field release shell keeps the field modules', () => {
  assert.deepEqual(
    Object.keys(getExcludedModules({ shell: { profile: 'field' }, variant: 'release' })).sort(),
    [...OPT_IN_MODULES, ...DEV_MODULES, 'react-native-nfc-manager'].sort()
  );
});

test('a shell keeps the modules of the extensions it lists', () => {
  const excluded = getExcludedModules({
    shell: { profile: 'basic', extensions: ['widgets', 'contacts'] },
    variant: 'release',
  });
  assert.equal('expo-widgets' in excluded, false);
  assert.equal('expo-contacts' in excluded, false);
  assert.equal('expo-calendar' in excluded, true);
});

test('a release build leaves out the developer features whatever its profile', () => {
  const exclusions = getExclusions({ shell: { profile: 'dev' }, variant: 'release' });
  assert.deepEqual(Object.keys(exclusions.modules).sort(), ['expo-widgets', ...DEV_MODULES].sort());
  assert.deepEqual(exclusions.jsEntries.sort(), [DEV_ENTRY, WIDGETS_ENTRY].sort());
  assert.deepEqual(exclusions.permissions, ['NSMotionUsageDescription']);
});

test('the dev variant carries the developer features whatever its profile', () => {
  const profile = getShellProfile({ shell: { profile: 'basic' }, variant: 'dev' });
  assert.equal(profile.name, 'basic');
  assert.ok('expo-camera' in profile.modules);
  assert.ok('expo-sensors' in profile.modules);
  assert.deepEqual(
    getExcludedModules({ shell: { profile: 'basic' }, variant: 'dev' }),
    LOWDEFY_DEV_EXCLUDED
  );
});

test('a basic release shell blocks the permissions only left-out modules ask for', () => {
  const { jsEntries, permissions } = getExclusions({
    shell: { profile: 'basic' },
    variant: 'release',
  });
  assert.ok(jsEntries.includes(DEV_ENTRY));
  [
    'NSCameraUsageDescription',
    'android.permission.CAMERA',
    'NSMotionUsageDescription',
    'NFCReaderUsageDescription',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'NSContactsUsageDescription',
  ].forEach((permission) => assert.ok(permissions.includes(permission), permission));
  assert.equal(permissions.includes('android.permission.POST_NOTIFICATIONS'), false);
});

test('a shell config without a profile is basic for a release shell and dev for Lowdefy Dev', () => {
  assert.equal(getProfileName({ shell: {}, variant: 'release' }), 'basic');
  assert.equal(getProfileName({ shell: {}, variant: 'dev' }), 'dev');
  assert.deepEqual(
    getExcludedModules({ shell: {}, variant: 'release' }),
    getExcludedModules({ shell: { profile: 'basic' }, variant: 'release' })
  );
  assert.deepEqual(getExcludedModules({ shell: {}, variant: 'dev' }), LOWDEFY_DEV_EXCLUDED);
});

test("a release shell's plugins are its profile's, with the camera's only when it has one", () => {
  const pluginNames = (profile) =>
    getShellProfile({ shell: { profile }, variant: 'release' }).plugins.map((plugin) =>
      Array.isArray(plugin) ? plugin[0] : plugin
    );
  assert.equal(pluginNames('basic').includes('expo-camera'), false);
  assert.equal(pluginNames('field').includes('expo-camera'), true);
});

test("Lowdefy Dev's camera plugin asks for the camera to scan the code lowdefy dev prints", () => {
  const camera = getShellProfile({ shell: { profile: 'dev' }, variant: 'dev' }).plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-camera'
  );
  assert.match(camera[1].cameraPermission, /scan the code lowdefy dev prints/);
});

test('an unknown profile is refused', () => {
  assert.throws(
    () => getExcludedModules({ shell: { profile: 'standard' }, variant: 'release' }),
    /Shell profile "standard" does not exist/
  );
});

test('the variant is dev for Lowdefy Dev and release for a shell config, unless set', () => {
  assert.equal(getShellVariant({}), 'dev');
  assert.equal(getShellVariant({ LOWDEFY_SHELL_CONFIG: 'shell.json' }), 'release');
  assert.equal(getShellVariant({ LOWDEFY_SHELL_VARIANT: 'dev', LOWDEFY_SHELL_CONFIG: 'x' }), 'dev');
  assert.throws(
    () => getShellVariant({ LOWDEFY_SHELL_VARIANT: 'store' }),
    /LOWDEFY_SHELL_VARIANT must be "dev" or "release". Received "store"./
  );
});
