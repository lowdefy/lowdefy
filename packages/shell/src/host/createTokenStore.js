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
 * The session token store a bearer host gives the core (validateAuthTransport): the token is kept
 * in the Keychain or Keystore, one per app, and held in memory so `get` is synchronous. `load`
 * reads it before the app's first request.
 */
function createTokenStore({ appId }) {
  const key = `lowdefy-session-token.${appId.replace(/[^A-Za-z0-9._-]/g, '_')}`;
  let token = null;
  return {
    async load() {
      token = await SecureStore.getItemAsync(key);
    },
    get() {
      return token;
    },
    async set(value) {
      token = value;
      await SecureStore.setItemAsync(key, value);
    },
    async clear() {
      token = null;
      await SecureStore.deleteItemAsync(key);
    },
  };
}

export default createTokenStore;
