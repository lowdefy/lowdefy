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

// A test shell plugin's `./shell` entry (resolveShellPlugins.js): a Bluetooth label printer. Its
// config plugin is a function here; a published plugin names its own `app.plugin.js` instead.

function withPrinter(config, { bluetoothText }) {
  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: { ...config.ios?.infoPlist, NSBluetoothAlwaysUsageDescription: bluetoothText },
    },
    android: {
      ...config.android,
      permissions: [...(config.android?.permissions ?? []), 'android.permission.BLUETOOTH_CONNECT'],
    },
  };
}

module.exports = {
  capabilities: ['printer'],
  modules: { 'react-native-ble-plx': 'BlePlx' },
  plugins: (options) => [
    [withPrinter, { bluetoothText: `Print labels for ${options.tenant ?? 'the app'}.` }],
  ],
  permissions: ['NSBluetoothAlwaysUsageDescription', 'android.permission.BLUETOOTH_CONNECT'],
  privacyReasons: [
    { category: 'NSPrivacyAccessedAPICategoryUserDefaults', reasons: ['1C8F.1'] },
    { category: 'NSPrivacyAccessedAPICategoryActiveKeyboards', reasons: ['3EC4.1'] },
  ],
  dataCollected: [{ type: 'deviceId', purpose: 'appFunctionality' }],
};
