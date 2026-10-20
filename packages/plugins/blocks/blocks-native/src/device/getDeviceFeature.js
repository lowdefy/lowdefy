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

// The shell that carries each device feature: a capability profile, or a shell extension.
const FEATURE_SHELLS = {
  audio: 'profile field',
  brightness: 'profile field',
  calendar: 'the calendar extension',
  camera: 'profile field',
  contacts: 'the contacts extension',
  documentScanner: 'profile field',
  files: 'profile basic',
  haptics: 'profile basic',
  keepAwake: 'profile basic',
  location: 'profile field',
  maps: 'profile field',
  nfc: 'profile field-nfc',
  notifications: 'profile basic',
  photos: 'profile basic',
  requestQueue: 'profile basic',
  share: 'profile basic',
  speech: 'profile basic',
  tracking: 'profile field-tracking',
  upload: 'profile basic',
  widgets: 'the widgets extension',
};

// The device features the shell installed at boot (installDevice). blocks-native imports no native
// module for them: the shell owns every module and installs only what its profile carries.
let installed = {};

/**
 * Installs the device features native actions and blocks reach the phone through:
 * `{ [feature]: implementation }`, with the features of FEATURE_SHELLS. The shell installs the ones
 * its profile and extensions carry; Lowdefy Dev wraps them so injected results answer first.
 *
 * @param {Object} device
 * @returns {() => void} Removes it.
 */
function installDevice(device) {
  installed = device;
  return () => {
    if (installed === device) {
      installed = {};
    }
  };
}

/**
 * Whether the shell carries a device feature.
 *
 * @param {string} feature
 */
function hasDeviceFeature(feature) {
  return installed[feature] !== undefined;
}

/**
 * One device feature, for the action that needs it. A shell without it throws a message naming the
 * profile or extension that carries it, which the action's onError can handle.
 *
 * @param {Object} params
 * @param {string} params.feature A key of FEATURE_SHELLS.
 * @param {string} params.action The action or block asking, for the message.
 */
function getDeviceFeature({ feature, action }) {
  if (!Object.prototype.hasOwnProperty.call(FEATURE_SHELLS, feature)) {
    throw new Error(`Unknown device feature ${JSON.stringify(feature)}.`);
  }
  const implementation = installed[feature];
  if (implementation === undefined) {
    throw new Error(
      `${action} needs a shell that carries ${feature} (${FEATURE_SHELLS[feature]}). This app's shell does not.`
    );
  }
  return implementation;
}

export { FEATURE_SHELLS, hasDeviceFeature, installDevice };
export default getDeviceFeature;
