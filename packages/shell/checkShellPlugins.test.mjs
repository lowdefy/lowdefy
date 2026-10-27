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

// Shell plugins add native code on top of a capability profile, never around it.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const checkShellPlugins = require('./checkShellPlugins.js');

function plugin(entry) {
  return { name: '@example/lowdefy-printer', version: '2.1.0', entry: { plugins: [], ...entry } };
}

test('a plugin with its own modules and permissions is taken on any release profile', () => {
  const plugins = [
    plugin({
      modules: { 'react-native-ble-plx': 'BlePlx' },
      permissions: ['NSBluetoothAlwaysUsageDescription', 'android.permission.BLUETOOTH_CONNECT'],
    }),
  ];
  ['basic', 'field', 'field-nfc', 'field-tracking'].forEach((profile) => {
    assert.equal(checkShellPlugins({ shell: { profile }, variant: 'release', plugins }), plugins);
  });
});

test("a plugin may ask for a permission its shell's profile carries", () => {
  const plugins = [plugin({ permissions: ['NSCameraUsageDescription'] })];
  assert.equal(
    checkShellPlugins({ shell: { profile: 'field' }, variant: 'release', plugins }),
    plugins
  );
});

test('a plugin linking a module @lowdefy/shell carries is refused, naming the profile to pick', () => {
  assert.throws(
    () =>
      checkShellPlugins({
        shell: { profile: 'basic' },
        variant: 'release',
        plugins: [plugin({ modules: { 'expo-camera': 'ExpoCamera' } })],
      }),
    /^Error: Shell plugin "@example\/lowdefy-printer" links "expo-camera", which @lowdefy\/shell carries in the "field" profile. Pick the profile that carries it instead of adding it with a plugin.$/
  );
  // Also when the shell's own profile carries it.
  assert.throws(
    () =>
      checkShellPlugins({
        shell: { profile: 'field' },
        variant: 'release',
        plugins: [plugin({ modules: { 'expo-image': 'ExpoImage' } })],
      }),
    /links "expo-image", which @lowdefy\/shell carries in the "basic" profile/
  );
});

test("a permission another profile carries and the shell's leaves out is refused, naming the profile", () => {
  assert.throws(
    () =>
      checkShellPlugins({
        shell: { profile: 'basic' },
        variant: 'release',
        plugins: [plugin({ permissions: ['NSCameraUsageDescription'] })],
      }),
    /^Error: Shell plugin "@example\/lowdefy-printer" asks for "NSCameraUsageDescription", which the "basic" profile leaves out. Pick the "field" profile, which carries it.$/
  );
  assert.throws(
    () =>
      checkShellPlugins({
        shell: {},
        variant: 'release',
        plugins: [plugin({ permissions: ['android.permission.CAMERA'] })],
      }),
    /"android.permission.CAMERA", which the "basic" profile leaves out. Pick the "field" profile/
  );
});

test("Lowdefy Dev's developer permissions stay out of a release shell", () => {
  assert.throws(
    () =>
      checkShellPlugins({
        shell: { profile: 'field' },
        variant: 'release',
        plugins: [plugin({ permissions: ['NSMotionUsageDescription'] })],
      }),
    /asks for "NSMotionUsageDescription", which the "field" profile leaves out/
  );
});
