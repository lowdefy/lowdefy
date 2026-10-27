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

import * as SecureStore from 'expo-secure-store';

/**
 * How the session token is kept in the Keychain or Keystore: on this device only, never in a
 * backup.
 *
 * - A shell with background work (location reports while the phone is locked) keeps it readable
 *   after the phone's first unlock, so its background task can call the server. Biometrics then
 *   guard the screens only.
 * - Any other shell keeps it readable only while the phone is unlocked, and, with biometric
 *   unlock, behind Face ID or a fingerprint: reading it is the unlock prompt. A change to the
 *   phone's biometrics makes it unreadable, and the person signs in again.
 *
 * A protected item is read and deleted with the same requireAuthentication it was written with.
 */
function getTokenStoreOptions({ background, biometric }) {
  if (background) {
    return { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
  }
  if (biometric) {
    return {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: true,
      authenticationPrompt: 'Unlock to continue',
    };
  }
  return { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
}

export default getTokenStoreOptions;
