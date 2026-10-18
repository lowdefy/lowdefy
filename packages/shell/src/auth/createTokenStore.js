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

import getTokenStoreOptions from './getTokenStoreOptions.js';

const PROTECTED = 'protected';

/**
 * The session token store a bearer host gives the core (validateAuthTransport): one token per app
 * in the Keychain or Keystore (getTokenStoreOptions), read once per unlock and held in memory, so
 * `get` is synchronous.
 *
 * Whether the stored token is behind biometrics is kept beside it in the device store (not a
 * secret), since it must be read with the options it was written with.
 *
 * `set` and `clear` tell subscribers: a token cleared anywhere (the core on a 401, a Logout
 * action, the shell's own sign-out) is how the shell hears the session ended. `load` and `unload`
 * (a lock drops the protected token from memory) tell no one.
 *
 * @param {Object} params
 * @param {string} params.appId The app, from shell.json.
 * @param {boolean} params.background The shell does background work (isBackgroundShell).
 * @param {Function} params.getBiometric Whether a new token goes behind biometrics.
 * @param {{ get, set, remove }} params.kv The device store.
 */
function createTokenStore({ appId, background, getBiometric, kv }) {
  const key = `lowdefy-session-token.${appId.replace(/[^A-Za-z0-9._-]/g, '_')}`;
  const modeKey = `lowdefy-shell:token-mode:${appId}`;
  const listeners = new Set();
  let token = null;

  function notify() {
    listeners.forEach((listener) => listener(token));
  }

  function isProtected() {
    return !background && kv.get(modeKey) === PROTECTED;
  }

  return {
    isProtected,
    async load() {
      token = await SecureStore.getItemAsync(
        key,
        getTokenStoreOptions({ background, biometric: isProtected() })
      );
    },
    get() {
      return token;
    },
    async set(value) {
      const biometric = !background && getBiometric();
      if (biometric !== isProtected()) {
        await SecureStore.deleteItemAsync(
          key,
          getTokenStoreOptions({ background, biometric: !biometric })
        );
      }
      await SecureStore.setItemAsync(key, value, getTokenStoreOptions({ background, biometric }));
      kv.set(modeKey, biometric ? PROTECTED : 'plain');
      token = value;
      notify();
    },
    unload() {
      token = null;
    },
    async clear() {
      const held = token !== null;
      token = null;
      // Both forms, so a token written before a change of unlock mode never outlives sign-out.
      await SecureStore.deleteItemAsync(key, getTokenStoreOptions({ background, biometric: true }));
      await SecureStore.deleteItemAsync(
        key,
        getTokenStoreOptions({ background, biometric: false })
      );
      kv.remove(modeKey);
      if (held) {
        notify();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export default createTokenStore;
