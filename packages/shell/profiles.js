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

const path = require('node:path');

/*
  The capability profiles a shell picks from (shell.json `profile`). A shell cannot pick modules one
  by one: every shell on one profile carries the same native modules, so a fleet of shells has a
  handful of native variants to test, and a shell carries no permission text or store declaration
  for a feature its profile does not have.

  Each entry lists what the profile adds to the one it `extends`:
  - capabilities: the device features it gives the app (shell.json `capabilities`).
  - modules: { [package]: nativeModuleName }, the native modules it links. The name is the one the
    module's JavaScript asks for, which scripts/checkReleaseBundle.mjs looks for in a bundle that
    should not carry it; null for a module with no JavaScript of its own in the bundle.
  - plugins: the config plugin entries app.config.ts applies. A profile's entry for a plugin its
    parent also has replaces the parent's.
  - permissions: the iOS Info.plist keys and Android permissions its modules ask for.
  - infoPlist: iOS purpose texts no config plugin writes, as { [Info.plist key]: text }, for a
    module that links a framework App Store Connect asks a purpose for.
  - jsEntries: the feature modules only it uses. A bundle for any other profile resolves them to
    empty modules (metro.config.js).
  - privacyReasons: the required-reason APIs its modules use, for the iOS privacy manifest, as
    { category, reasons } (Apple's NSPrivacyAccessedAPIType and NSPrivacyAccessedAPITypeReasons).
  - dataCollected: the data its features let the app collect, for the App Store privacy label and
    Google Play's data safety form, as { type, purpose }.

  Every native module the shell package depends on is in some profile. A build leaves out every one
  not in its profile (getExclusions in shellVariant.js), and a release build also leaves out the
  developer features (`dev`'s own entries), whatever its profile.
*/

// Lowdefy Dev's developer features: connect, shake menu and dev-tab client (src/dev).
const DEV_ENTRY = path.join(__dirname, 'src', 'dev', 'index.js');

// One microphone purpose text for every plugin that writes NSMicrophoneUsageDescription: speech
// (basic) and expo-camera (field, dev). expo-camera writes its own default when no earlier plugin
// set the key, so it is given the same text and plugin order cannot change what a shell shows.
const MICROPHONE_PERMISSION =
  '$(PRODUCT_NAME) uses the microphone when you tap the microphone button, to turn what you say into text.';
const SPEECH_RECOGNITION_PERMISSION =
  '$(PRODUCT_NAME) turns what you say into text on this device. Your voice is not recorded or sent anywhere.';
// expo-image links the Photos framework (PhotoLibraryAssetLoader.swift, for `ph://` URIs), so App
// Store Connect refuses an upload without a photo library purpose (ITMS-90683). No config plugin
// writes it.
const PHOTO_LIBRARY_PERMISSION =
  '$(PRODUCT_NAME) shows a photo from your library only when you choose one.';

const PROFILES = {
  // What every shell carries: the runtime, native blocks, sign-in, biometric unlock and on-device
  // dictation (expo-speech-recognition, for the Composer and AgentChat mic).
  basic: {
    capabilities: ['biometrics', 'sign-in', 'speech'],
    modules: {
      '@expo/ui': 'ExpoUI',
      'expo-clipboard': 'ExpoClipboard',
      'expo-constants': 'ExponentConstants',
      'expo-crypto': 'ExpoCrypto',
      'expo-font': 'ExpoFontLoader',
      'expo-image': 'ExpoImage',
      'expo-linking': 'ExpoLinking',
      'expo-local-authentication': 'ExpoLocalAuthentication',
      'expo-network': 'ExpoNetwork',
      'expo-router': null,
      'expo-secure-store': 'ExpoSecureStore',
      'expo-speech-recognition': 'ExpoSpeechRecognition',
      'expo-splash-screen': 'ExpoSplashScreen',
      'expo-sqlite': 'ExpoSQLite',
      'expo-updates': 'ExpoUpdates',
      'expo-web-browser': 'ExpoWebBrowser',
      'react-native-safe-area-context': 'RNCSafeAreaContext',
      'react-native-screens': 'RNSModule',
      'react-native-svg': 'RNSVGSvgViewModule',
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
      [
        'expo-speech-recognition',
        {
          microphonePermission: MICROPHONE_PERMISSION,
          speechRecognitionPermission: SPEECH_RECOGNITION_PERMISSION,
        },
      ],
      'expo-splash-screen',
      'expo-sqlite',
      'expo-web-browser',
    ],
    permissions: [
      'NSFaceIDUsageDescription',
      'android.permission.USE_BIOMETRIC',
      'NSMicrophoneUsageDescription',
      'NSSpeechRecognitionUsageDescription',
      'android.permission.RECORD_AUDIO',
      'NSPhotoLibraryUsageDescription',
    ],
    infoPlist: { NSPhotoLibraryUsageDescription: PHOTO_LIBRARY_PERMISSION },
    jsEntries: [],
    // React Native's own (file timestamps, UserDefaults, boot time), and the free disk space
    // expo-sqlite checks before it writes.
    privacyReasons: [
      { category: 'NSPrivacyAccessedAPICategoryFileTimestamp', reasons: ['C617.1'] },
      { category: 'NSPrivacyAccessedAPICategoryUserDefaults', reasons: ['CA92.1'] },
      { category: 'NSPrivacyAccessedAPICategorySystemBootTime', reasons: ['35F9.1'] },
      { category: 'NSPrivacyAccessedAPICategoryDiskSpace', reasons: ['E174.1'] },
    ],
    dataCollected: [
      { type: 'emailAddress', purpose: 'appFunctionality' },
      { type: 'userId', purpose: 'appFunctionality' },
    ],
  },
  // Field work: the camera and scanning. Photos, location, maps and signatures join it as the
  // shell gains them.
  field: {
    extends: 'basic',
    capabilities: ['camera'],
    modules: { 'expo-camera': 'ExpoCamera' },
    // The camera does not add Android's microphone permission: the shell takes no video.
    // RECORD_AUDIO comes from basic, for speech.
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to use the camera.',
          microphonePermission: MICROPHONE_PERMISSION,
          recordAudioAndroid: false,
        },
      ],
    ],
    permissions: ['NSCameraUsageDescription', 'android.permission.CAMERA'],
    dataCollected: [{ type: 'photos', purpose: 'appFunctionality' }],
  },
  // `field` and NFC, which joins it as the shell gains it.
  'field-nfc': {
    extends: 'field',
  },
  // `field` and background location and geofences, which join it as the shell gains them. Its
  // session token stays readable while the phone is locked (src/auth/isBackgroundShell.js).
  'field-tracking': {
    extends: 'field',
  },
  // Lowdefy Dev: `field` and the developer features, which read the code `lowdefy dev` prints with
  // the camera, open the dev menu on a shake (expo-sensors) and take screenshots for the dev tab
  // (react-native-view-shot). expo-dev-client lets a development build load a local bundle.
  dev: {
    extends: 'field',
    capabilities: [],
    modules: {
      'expo-dev-client': null,
      'expo-sensors': 'ExponentAccelerometer',
      'react-native-view-shot': 'RNViewShot',
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to scan the code lowdefy dev prints.',
          microphonePermission: MICROPHONE_PERMISSION,
          recordAudioAndroid: false,
        },
      ],
    ],
    permissions: ['NSMotionUsageDescription'],
    jsEntries: [DEV_ENTRY],
  },
  // A development build of a developer's own shell (`lowdefy mobile build --profile development`):
  // Lowdefy Dev's features, for apps whose shell plugins Lowdefy Dev does not carry.
  development: {
    extends: 'dev',
  },
};

// The profiles a store or testing build of an app's shell picks from.
const RELEASE_PROFILES = ['basic', 'field', 'field-nfc', 'field-tracking'];

function pluginName(plugin) {
  return Array.isArray(plugin) ? plugin[0] : plugin;
}

function unique(values) {
  return [...new Set(values)];
}

// Merges two resolved profiles, or a profile entry onto its resolved parent: lists are joined
// without duplicates, and `added`'s modules, plugins and Info.plist texts replace `base`'s of the
// same name.
function mergeProfiles(base, added) {
  const plugins = [...base.plugins];
  (added.plugins ?? []).forEach((plugin) => {
    const index = plugins.findIndex((existing) => pluginName(existing) === pluginName(plugin));
    if (index === -1) {
      plugins.push(plugin);
    } else {
      plugins[index] = plugin;
    }
  });
  const privacyReasons = base.privacyReasons.map((reason) => ({ ...reason }));
  (added.privacyReasons ?? []).forEach(({ category, reasons }) => {
    const existing = privacyReasons.find((reason) => reason.category === category);
    if (existing) {
      existing.reasons = unique([...existing.reasons, ...reasons]);
    } else {
      privacyReasons.push({ category, reasons: [...reasons] });
    }
  });
  const dataCollected = [...base.dataCollected];
  (added.dataCollected ?? []).forEach((data) => {
    if (!dataCollected.some(({ type }) => type === data.type)) {
      dataCollected.push(data);
    }
  });
  return {
    name: added.name ?? base.name,
    capabilities: unique([...base.capabilities, ...(added.capabilities ?? [])]),
    modules: { ...base.modules, ...added.modules },
    plugins,
    permissions: unique([...base.permissions, ...(added.permissions ?? [])]),
    infoPlist: { ...base.infoPlist, ...added.infoPlist },
    jsEntries: unique([...base.jsEntries, ...(added.jsEntries ?? [])]),
    privacyReasons,
    dataCollected,
  };
}

const EMPTY_PROFILE = {
  capabilities: [],
  modules: {},
  plugins: [],
  permissions: [],
  infoPlist: {},
  jsEntries: [],
  privacyReasons: [],
  dataCollected: [],
};

/**
 * Everything a capability profile carries, with the profiles it extends folded in.
 *
 * @param {string} name The profile's name (shell.json `profile`).
 * @returns {{ name, capabilities, modules, plugins, permissions, infoPlist, jsEntries,
 *   privacyReasons, dataCollected }}
 */
function resolveProfile(name) {
  if (!Object.prototype.hasOwnProperty.call(PROFILES, name)) {
    throw new Error(
      `Shell profile ${JSON.stringify(name)} does not exist. Use one of ${Object.keys(
        PROFILES
      ).join(', ')}.`
    );
  }
  const entry = PROFILES[name];
  const base = entry.extends ? resolveProfile(entry.extends) : EMPTY_PROFILE;
  return mergeProfiles(base, { ...entry, name });
}

module.exports = {
  DEV_ENTRY,
  MICROPHONE_PERMISSION,
  PHOTO_LIBRARY_PERMISSION,
  PROFILES,
  RELEASE_PROFILES,
  mergeProfiles,
  pluginName,
  resolveProfile,
  SPEECH_RECOGNITION_PERMISSION,
};
