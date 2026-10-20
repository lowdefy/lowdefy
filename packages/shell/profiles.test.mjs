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
const {
  applyExtensions,
  DEV_ENTRY,
  FIELD_MICROPHONE_PERMISSION,
  MICROPHONE_PERMISSION,
  PROFILES,
  pluginName,
  RELEASE_PROFILES,
  SPEECH_RECOGNITION_PERMISSION,
  resolveProfile,
} = require('./profiles.js');

const shellPackage = require('./package.json');

test('field carries everything basic does, and the camera', () => {
  const basic = resolveProfile('basic');
  const field = resolveProfile('field');
  Object.keys(basic.modules).forEach((name) => assert.ok(name in field.modules, name));
  basic.capabilities.forEach((capability) => assert.ok(field.capabilities.includes(capability)));
  basic.permissions.forEach((permission) => assert.ok(field.permissions.includes(permission)));
  // field gives some of basic's plugins other options (the microphone text, the camera picker), so
  // it carries each by name.
  const fieldPluginNames = field.plugins.map(pluginName);
  basic.plugins.forEach((plugin) => assert.ok(fieldPluginNames.includes(pluginName(plugin))));
  assert.deepEqual(
    field.privacyReasons.slice(0, basic.privacyReasons.length),
    basic.privacyReasons
  );
  assert.equal(field.modules['expo-camera'], 'ExpoCamera');
  assert.ok(field.capabilities.includes('camera'));
  assert.equal('expo-camera' in basic.modules, false);
});

test('basic carries the speech module, its config plugin and its permissions', () => {
  const basic = resolveProfile('basic');
  assert.equal(basic.modules['expo-speech-recognition'], 'ExpoSpeechRecognition');
  assert.ok(basic.capabilities.includes('speech'));
  assert.deepEqual(
    basic.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-speech-recognition'
    ),
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          '$(PRODUCT_NAME) uses the microphone when you tap the microphone button, to turn what you say into text.',
        speechRecognitionPermission:
          '$(PRODUCT_NAME) turns what you say into text on this device. Your voice is not recorded or sent anywhere.',
      },
    ]
  );
  [
    'NSMicrophoneUsageDescription',
    'NSSpeechRecognitionUsageDescription',
    'android.permission.RECORD_AUDIO',
  ].forEach((permission) => assert.ok(basic.permissions.includes(permission), permission));
});

test('every profile carries speech', () => {
  Object.keys(PROFILES).forEach((name) => {
    const profile = resolveProfile(name);
    assert.equal(profile.modules['expo-speech-recognition'], 'ExpoSpeechRecognition', name);
    assert.ok(profile.capabilities.includes('speech'), name);
    assert.ok(profile.permissions.includes('android.permission.RECORD_AUDIO'), name);
    assert.equal(
      profile.plugins.filter(
        (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-speech-recognition'
      ).length,
      1,
      name
    );
  });
});

test('every plugin that writes the microphone text in a profile writes the same one', () => {
  Object.keys(PROFILES).forEach((name) => {
    const profile = resolveProfile(name);
    const texts = new Set(
      profile.plugins
        // `false` turns a plugin's microphone text off (the photo picker on basic).
        .filter(
          (plugin) => Array.isArray(plugin) && typeof plugin[1]?.microphonePermission === 'string'
        )
        .map(([, props]) => props.microphonePermission)
    );
    const expected =
      'expo-audio' in profile.modules ? FIELD_MICROPHONE_PERMISSION : MICROPHONE_PERMISSION;
    assert.deepEqual([...texts], [expected], name);
    profile.plugins
      .filter((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-camera')
      .forEach(([, props]) => assert.equal(props.recordAudioAndroid, false, name));
  });
  assert.match(SPEECH_RECOGNITION_PERMISSION, /not recorded or sent anywhere/);
});

test('field-nfc carries NFC and field-tracking background location', () => {
  assert.equal(resolveProfile('field-nfc').modules['react-native-nfc-manager'], 'NfcManager');
  const tracking = resolveProfile('field-tracking');
  const location = tracking.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-location'
  );
  assert.equal(location[1].isIosBackgroundLocationEnabled, true);
  assert.ok(tracking.permissions.includes('android.permission.ACCESS_BACKGROUND_LOCATION'));
  assert.equal(
    resolveProfile('field').plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-location'
    )[1].isIosBackgroundLocationEnabled,
    false
  );
});

test('extensions fold into a profile and an unknown one throws', () => {
  const shell = applyExtensions(resolveProfile('basic'), ['contacts', 'widgets']);
  assert.equal(shell.name, 'basic');
  assert.equal(shell.modules['expo-contacts'], 'ExpoContacts');
  assert.equal(shell.modules['expo-widgets'], 'ExpoWidgets');
  assert.ok(shell.permissions.includes('NSContactsUsageDescription'));
  assert.throws(() => applyExtensions(resolveProfile('basic'), ['bluetooth']), /does not exist/);
  const sharing = applyExtensions(resolveProfile('basic'), ['share']).plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-sharing'
  );
  assert.equal(sharing[1].ios.enabled, true);
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
    assert.ok(profile.jsEntries.includes(DEV_ENTRY), name);
  });
});

test("Lowdefy Dev carries every profile's modules, and contacts and calendar", () => {
  const dev = resolveProfile('dev');
  ['field', 'field-nfc', 'field-tracking'].forEach((name) =>
    Object.keys(resolveProfile(name).modules).forEach((module) =>
      assert.ok(module in dev.modules, `${name} ${module}`)
    )
  );
  assert.ok('expo-contacts' in dev.modules);
  assert.ok('expo-calendar' in dev.modules);
  assert.equal('expo-widgets' in dev.modules, false);
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
