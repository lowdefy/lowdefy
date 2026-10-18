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

// The capability profile table: what each profile carries, with the profiles it extends.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { PROFILES, RELEASE_PROFILES, resolveProfile } = require('./profiles.js');

const shellPackage = require('./package.json');

test('field carries everything basic does, and the camera', () => {
  const basic = resolveProfile('basic');
  const field = resolveProfile('field');
  Object.keys(basic.modules).forEach((name) => assert.ok(name in field.modules, name));
  basic.capabilities.forEach((capability) => assert.ok(field.capabilities.includes(capability)));
  basic.permissions.forEach((permission) => assert.ok(field.permissions.includes(permission)));
  basic.plugins.forEach((plugin) => assert.ok(field.plugins.includes(plugin)));
  assert.deepEqual(
    field.privacyReasons.slice(0, basic.privacyReasons.length),
    basic.privacyReasons
  );
  assert.equal(field.modules['expo-camera'], 'ExpoCamera');
  assert.ok(field.capabilities.includes('camera'));
  assert.equal('expo-camera' in basic.modules, false);
});

test('field-nfc and field-tracking extend field', () => {
  const field = resolveProfile('field');
  ['field-nfc', 'field-tracking'].forEach((name) => {
    const profile = resolveProfile(name);
    assert.equal(profile.name, name);
    Object.keys(field.modules).forEach((module) => assert.ok(module in profile.modules));
  });
});

test('the dev and development profiles carry the developer features', () => {
  ['dev', 'development'].forEach((name) => {
    const profile = resolveProfile(name);
    ['expo-camera', 'expo-dev-client', 'expo-sensors', 'react-native-view-shot'].forEach((module) =>
      assert.ok(module in profile.modules, `${name} ${module}`)
    );
    assert.equal(profile.jsEntries.length, 1);
  });
});

test('expo-dev-client is in the dev and development profiles only', () => {
  Object.keys(PROFILES).forEach((name) => {
    assert.equal(
      'expo-dev-client' in resolveProfile(name).modules,
      ['dev', 'development'].includes(name),
      name
    );
  });
});

test("a profile's plugin entry replaces the one it extends", () => {
  const cameraPlugins = resolveProfile('dev').plugins.filter(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-camera'
  );
  assert.equal(cameraPlugins.length, 1);
  assert.match(cameraPlugins[0][1].cameraPermission, /lowdefy dev/);
});

test('an unknown profile throws with the list of valid names', () => {
  assert.throws(
    () => resolveProfile('standard'),
    /^Error: Shell profile "standard" does not exist. Use one of basic, field, field-nfc, field-tracking, dev, development.$/
  );
});

test('the release profiles are the ones a store build picks from', () => {
  assert.deepEqual(RELEASE_PROFILES, ['basic', 'field', 'field-nfc', 'field-tracking']);
});

test('every native module in the table is a dependency of the shell package', () => {
  Object.keys(PROFILES).forEach((name) => {
    Object.keys(resolveProfile(name).modules).forEach((module) =>
      assert.ok(module in shellPackage.dependencies, `${name}: ${module}`)
    );
  });
});
