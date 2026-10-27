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

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_BYTES = 32;
// Kept on this phone only: never synced to another device or restored from a backup to one.
const OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * This phone's device key for an app: a random secret made the first time it is asked for and
 * kept in the Keychain or Keystore, never cleared on sign-out. The shell sends it on its email-code
 * calls (x-lowdefy-device-key), so the app's server can let a phone that signed in with an address
 * before past that address's send cap, which a stranger can fill but cannot do as this phone.
 *
 * @param {Object} params
 * @param {string} params.appId The app, from shell.json.
 * @returns {() => Promise<string>} Reads, or first makes, the key; read once and then held.
 */
function createDeviceKey({ appId }) {
  const storeKey = `lowdefy-device-key.${appId.replace(/[^A-Za-z0-9._-]/g, '_')}`;
  let pending = null;
  async function load() {
    const stored = await SecureStore.getItemAsync(storeKey, OPTIONS);
    if (stored !== null) {
      return stored;
    }
    const key = toHex(Crypto.getRandomBytes(KEY_BYTES));
    await SecureStore.setItemAsync(storeKey, key, OPTIONS);
    return key;
  }
  return function getDeviceKey() {
    if (pending === null) {
      // A failed read is tried again on the next call.
      pending = load().catch((error) => {
        pending = null;
        throw error;
      });
    }
    return pending;
  };
}

export default createDeviceKey;
