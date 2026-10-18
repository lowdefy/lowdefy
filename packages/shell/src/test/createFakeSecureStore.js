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

import { jest } from '@jest/globals';

// expo-secure-store over a Map, keyed as the native module keys items: by key and by whether the
// item is behind biometrics (a protected item is a different Keychain service on iOS).
function createFakeSecureStore() {
  const items = new Map();
  function itemKey(key, options = {}) {
    return `${key}|${options.requireAuthentication === true ? 'auth' : 'no-auth'}`;
  }
  return {
    items,
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key, options) => items.get(itemKey(key, options))?.value ?? null),
    setItemAsync: jest.fn(async (key, value, options) => {
      items.set(itemKey(key, options), { value, options });
    }),
    deleteItemAsync: jest.fn(async (key, options) => {
      items.delete(itemKey(key, options));
    }),
  };
}

export default createFakeSecureStore;
