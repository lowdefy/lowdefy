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
  - includes, extensions: other profiles' own entries and shell extensions it carries too
    (Lowdefy Dev carries every profile's modules).
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

// The device features of profiles and extensions (src/device, src/widgets). A shell that does not
// carry one resolves it to an empty module, so its native modules are never imported.
const FIELD_ENTRY = path.join(__dirname, 'src', 'device', 'field', 'index.js');
const NFC_ENTRY = path.join(__dirname, 'src', 'device', 'nfc', 'index.js');
const TRACKING_ENTRY = path.join(__dirname, 'src', 'device', 'tracking', 'index.js');
const CONTACTS_ENTRY = path.join(__dirname, 'src', 'device', 'contacts', 'index.js');
const CALENDAR_ENTRY = path.join(__dirname, 'src', 'device', 'calendar', 'index.js');
const WIDGETS_ENTRY = path.join(__dirname, 'src', 'widgets', 'index.js');

// The config plugin that adds the App Shortcuts intent to the iOS app (native/withAppShortcuts.js).
const APP_SHORTCUTS_PLUGIN = './native/withAppShortcuts.js';

// One microphone purpose text for every plugin that writes NSMicrophoneUsageDescription: speech
// (basic) and expo-camera (field, dev). expo-camera writes its own default when no earlier plugin
// set the key, so it is given the same text and plugin order cannot change what a shell shows.
const MICROPHONE_PERMISSION =
  '$(PRODUCT_NAME) uses the microphone when you tap the microphone button, to turn what you say into text.';
// `field` records voice notes too (expo-audio), so its shells claim more for the microphone. Every
// plugin that writes NSMicrophoneUsageDescription in a field shell is given this text.
const FIELD_MICROPHONE_PERMISSION =
  '$(PRODUCT_NAME) uses the microphone when you tap the microphone button, to turn what you say into text or to record a voice note.';
const CAMERA_PERMISSION =
  'Allow $(PRODUCT_NAME) to use the camera to take photos, scan codes and scan documents.';
const LOCATION_PERMISSION =
  'Allow $(PRODUCT_NAME) to use your location to show where you are and record where work is done.';
const LOCATION_ALWAYS_PERMISSION =
  'Allow $(PRODUCT_NAME) to use your location in the background to record trips and notice when you arrive at or leave a site.';
const SPEECH_RECOGNITION_PERMISSION =
  '$(PRODUCT_NAME) turns what you say into text on this device. Your voice is not recorded or sent anywhere.';
// expo-image links the Photos framework (PhotoLibraryAssetLoader.swift, for `ph://` URIs), so App
// Store Connect refuses an upload without a photo library purpose (ITMS-90683). No config plugin
// writes it.
const PHOTO_LIBRARY_PERMISSION =
  '$(PRODUCT_NAME) shows a photo from your library only when you choose one.';

const PROFILES = {
  // What every shell carries: the runtime, native blocks, sign-in, biometric unlock, on-device
  // dictation (expo-speech-recognition, for the Composer and AgentChat mic), push and local
  // notifications, haptics, share out, picking from Photos and Files, read aloud, keep awake, icon
  // quick actions and App Shortcuts, and background fetch. None asks for a permission at install:
  // Photos and Files use the system pickers, and notifications ask on first use.
  basic: {
    capabilities: [
      'background-fetch',
      'biometrics',
      'files',
      'haptics',
      'notifications',
      'photos',
      'share',
      'shortcuts',
      'sign-in',
      'speech',
    ],
    modules: {
      '@expo/ui': 'ExpoUI',
      'expo-background-task': 'ExpoBackgroundTask',
      'expo-clipboard': 'ExpoClipboard',
      'expo-constants': 'ExponentConstants',
      'expo-crypto': 'ExpoCrypto',
      'expo-document-picker': 'ExpoDocumentPicker',
      'expo-file-system': 'FileSystem',
      'expo-font': 'ExpoFontLoader',
      'expo-haptics': 'ExpoHaptics',
      'expo-image': 'ExpoImage',
      'expo-image-picker': 'ExponentImagePicker',
      'expo-keep-awake': 'ExpoKeepAwake',
      'expo-linking': 'ExpoLinking',
      'expo-local-authentication': 'ExpoLocalAuthentication',
      'expo-network': 'ExpoNetwork',
      'expo-notifications': 'ExpoNotificationCategoriesModule',
      'expo-quick-actions': 'ExpoQuickActions',
      'expo-router': null,
      'expo-secure-store': 'ExpoSecureStore',
      'expo-sharing': 'ExpoSharing',
      'expo-speech': 'ExpoSpeech',
      'expo-speech-recognition': 'ExpoSpeechRecognition',
      'expo-splash-screen': 'ExpoSplashScreen',
      'expo-sqlite': 'ExpoSQLite',
      'expo-task-manager': 'ExpoTaskManager',
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
      // Push in production builds (aps-environment), and background notifications so a button with
      // an endpoint runs without opening the app.
      ['expo-notifications', { enableBackgroundRemoteNotifications: true }],
      // Library mode only: the system photo picker needs no permission, and field adds the camera.
      // Its microphone text is speech's: `false` would remove the key speech needs.
      [
        'expo-image-picker',
        {
          photosPermission: false,
          cameraPermission: false,
          microphonePermission: MICROPHONE_PERMISSION,
        },
      ],
      'expo-background-task',
      // Share out only; the share extension adds receiving.
      ['expo-sharing', { ios: { enabled: false }, android: { enabled: false } }],
      APP_SHORTCUTS_PLUGIN,
    ],
    permissions: [
      'NSFaceIDUsageDescription',
      'android.permission.USE_BIOMETRIC',
      'NSMicrophoneUsageDescription',
      'NSSpeechRecognitionUsageDescription',
      'android.permission.RECORD_AUDIO',
      'NSPhotoLibraryUsageDescription',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.WAKE_LOCK',
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
      // The push token the app's register endpoint stores, and the photos and files a person picks.
      { type: 'deviceId', purpose: 'appFunctionality' },
      { type: 'photos', purpose: 'appFunctionality' },
      { type: 'otherUserContent', purpose: 'appFunctionality' },
    ],
  },
  // Field work: the camera (photos, code and document scanning), location in use, maps, voice
  // notes and screen brightness for scan screens. Its microphone text covers recording, for every
  // plugin that writes it.
  field: {
    extends: 'basic',
    capabilities: ['audio', 'camera', 'document-scanner', 'location', 'maps'],
    modules: {
      'expo-audio': 'ExpoAudio',
      'expo-brightness': 'ExpoBrightness',
      'expo-camera': 'ExpoCamera',
      'expo-location': 'ExpoLocation',
      'expo-maps': 'ExpoMaps',
      'react-native-document-scanner-plugin': 'DocumentScanner',
    },
    // The camera does not add Android's microphone permission: video capture records with the
    // audio permission basic already has for speech.
    plugins: [
      [
        'expo-speech-recognition',
        {
          microphonePermission: FIELD_MICROPHONE_PERMISSION,
          speechRecognitionPermission: SPEECH_RECOGNITION_PERMISSION,
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: CAMERA_PERMISSION,
          microphonePermission: FIELD_MICROPHONE_PERMISSION,
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: false,
          cameraPermission: CAMERA_PERMISSION,
          microphonePermission: FIELD_MICROPHONE_PERMISSION,
        },
      ],
      ['expo-audio', { microphonePermission: FIELD_MICROPHONE_PERMISSION }],
      [
        'expo-location',
        {
          locationWhenInUsePermission: LOCATION_PERMISSION,
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      ['expo-maps', { requestLocationPermission: false }],
      // react-native-document-scanner-plugin's config plugin only writes the camera purpose text,
      // which expo-camera writes above, and requires @expo/config-plugins without depending on it,
      // so the module is linked without it.
    ],
    permissions: [
      'NSCameraUsageDescription',
      'android.permission.CAMERA',
      'NSLocationWhenInUseUsageDescription',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    jsEntries: [FIELD_ENTRY],
    dataCollected: [
      { type: 'audioData', purpose: 'appFunctionality' },
      { type: 'preciseLocation', purpose: 'appFunctionality' },
    ],
  },
  // `field` and NFC: reading and writing NDEF tags (react-native-nfc-manager).
  'field-nfc': {
    extends: 'field',
    capabilities: ['nfc'],
    modules: { 'react-native-nfc-manager': 'NfcManager' },
    plugins: [
      [
        'react-native-nfc-manager',
        { nfcPermission: 'Allow $(PRODUCT_NAME) to read and write NFC tags, such as asset tags.' },
      ],
    ],
    permissions: ['NFCReaderUsageDescription', 'android.permission.NFC'],
    jsEntries: [NFC_ENTRY],
  },
  // `field` and background location and geofences (expo-location in the background, through
  // expo-task-manager). Its session token stays readable while the phone is locked
  // (src/auth/isBackgroundShell.js), so background points and region changes reach the app's
  // endpoints.
  'field-tracking': {
    extends: 'field',
    capabilities: ['background-location', 'geofencing'],
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission: LOCATION_PERMISSION,
          locationAlwaysAndWhenInUsePermission: LOCATION_ALWAYS_PERMISSION,
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
    ],
    permissions: [
      'NSLocationAlwaysAndWhenInUseUsageDescription',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
    ],
    jsEntries: [TRACKING_ENTRY],
  },
  // Lowdefy Dev: `field`, NFC, background location, contacts and calendar (so any app's pages can be
  // tried in it), and the developer features, which read the code `lowdefy dev` prints with the
  // camera, open the dev menu on a shake (expo-sensors) and take screenshots for the dev tab
  // (react-native-view-shot). expo-dev-client lets a development build load a local bundle. It
  // carries no share or widget extension: those are app extension targets of an app's own shell.
  dev: {
    extends: 'field',
    includes: ['field-nfc', 'field-tracking'],
    extensions: ['contacts', 'calendar'],
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
          microphonePermission: FIELD_MICROPHONE_PERMISSION,
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

/*
  The opt-in shell extensions (shell.json `extensions`): rows shaped like a profile's, added on top
  of any profile. Each brings a native target or a permission set a profile should not carry for
  every shell: an app extension with its own bundle id and App Group (share, widgets), or one of
  the permissions review scrutinises most (contacts, calendar). getShellProfile folds them in, and
  the runtime version names them.
*/
// The widget's source picker. Its options are the app's mobile.widgets sources, set at run time
// (setConfigurationParameterEnum); the static `default` stands for "the first source" until then.
const WIDGET_SOURCE_PARAMETER = {
  title: 'Show',
  type: 'enum',
  dynamic: true,
  values: [{ name: 'First', value: 'default' }],
  default: 'default',
};

const EXTENSIONS = {
  // Receiving text, links, images, videos and files from other apps (expo-sharing's share
  // extension on iOS, intent filters on Android). The app opens mobile.share.pageId.
  share: {
    capabilities: ['share-in'],
    plugins: [
      [
        'expo-sharing',
        {
          ios: {
            enabled: true,
            activationRule: {
              supportsText: true,
              supportsWebUrlWithMaxCount: 1,
              supportsImageWithMaxCount: 10,
              supportsMovieWithMaxCount: 5,
              supportsFileWithMaxCount: 10,
            },
          },
          android: {
            enabled: true,
            singleShareMimeTypes: ['text/*', 'image/*', 'video/*', 'application/*'],
            multipleShareMimeTypes: ['image/*', 'video/*', 'application/*'],
          },
        },
      ],
    ],
  },
  // Home Screen and Lock Screen widgets on iOS (expo-widgets): two fixed layouts fed with data the
  // shell fetches from mobile.widgets endpoints. The widget never holds the session token. Android
  // widgets need their own Compose layouts and come later.
  widgets: {
    capabilities: ['widgets'],
    modules: { 'expo-widgets': 'ExpoWidgets' },
    plugins: [
      [
        'expo-widgets',
        {
          enableAndroid: false,
          widgets: [
            {
              name: 'LowdefyCount',
              displayName: 'Count',
              description: 'A number from the app, like open tasks.',
              supportedFamilies: [
                'systemSmall',
                'accessoryCircular',
                'accessoryRectangular',
                'accessoryInline',
              ],
              configuration: {
                title: 'Source',
                parameters: {
                  source: WIDGET_SOURCE_PARAMETER,
                },
              },
            },
            {
              name: 'LowdefyList',
              displayName: 'List',
              description: 'A short list from the app, like the next jobs.',
              supportedFamilies: ['systemMedium', 'systemLarge', 'accessoryRectangular'],
              configuration: {
                title: 'Source',
                parameters: {
                  source: WIDGET_SOURCE_PARAMETER,
                },
              },
            },
          ],
        },
      ],
    ],
    jsEntries: [WIDGETS_ENTRY],
  },
  // Picking and adding contacts (expo-contacts).
  contacts: {
    capabilities: ['contacts'],
    modules: { 'expo-contacts': 'ExpoContacts' },
    plugins: [
      [
        'expo-contacts',
        { contactsPermission: 'Allow $(PRODUCT_NAME) to read and add the contacts you choose.' },
      ],
    ],
    permissions: [
      'NSContactsUsageDescription',
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS',
    ],
    jsEntries: [CONTACTS_ENTRY],
    dataCollected: [{ type: 'contacts', purpose: 'appFunctionality' }],
  },
  // Reading and adding calendar events (expo-calendar).
  calendar: {
    capabilities: ['calendar'],
    modules: { 'expo-calendar': 'ExpoCalendar' },
    plugins: [
      [
        'expo-calendar',
        {
          calendarPermission:
            'Allow $(PRODUCT_NAME) to read your calendar and add events you choose.',
          remindersPermission: false,
        },
      ],
    ],
    permissions: [
      'NSCalendarsFullAccessUsageDescription',
      'NSCalendarsUsageDescription',
      'android.permission.READ_CALENDAR',
      'android.permission.WRITE_CALENDAR',
    ],
    jsEntries: [CALENDAR_ENTRY],
    dataCollected: [{ type: 'otherUserContent', purpose: 'appFunctionality' }],
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
 * A capability profile with the shell's extensions folded in (EXTENSIONS). The profile keeps its
 * name.
 *
 * @param {Object} profile A resolved profile.
 * @param {string[]} [extensions] shell.json `extensions`.
 */
function applyExtensions(profile, extensions = []) {
  return extensions.reduce((merged, name) => {
    if (!Object.prototype.hasOwnProperty.call(EXTENSIONS, name)) {
      throw new Error(
        `Shell extension ${JSON.stringify(name)} does not exist. Use one of ${Object.keys(
          EXTENSIONS
        ).join(', ')}.`
      );
    }
    return mergeProfiles(merged, { ...EXTENSIONS[name], name: profile.name });
  }, profile);
}

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
  const parent = entry.extends ? resolveProfile(entry.extends) : EMPTY_PROFILE;
  const included = (entry.includes ?? []).reduce(
    (merged, include) => mergeProfiles(merged, { ...PROFILES[include], name }),
    parent
  );
  return mergeProfiles(applyExtensions(included, entry.extensions), { ...entry, name });
}

module.exports = {
  applyExtensions,
  DEV_ENTRY,
  EXTENSIONS,
  FIELD_MICROPHONE_PERMISSION,
  MICROPHONE_PERMISSION,
  PHOTO_LIBRARY_PERMISSION,
  PROFILES,
  RELEASE_PROFILES,
  mergeProfiles,
  pluginName,
  resolveProfile,
  SPEECH_RECOGNITION_PERMISSION,
  WIDGETS_ENTRY,
};
