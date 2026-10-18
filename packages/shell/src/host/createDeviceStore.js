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

import { Storage } from 'expo-sqlite/kv-store';

// The host store that lasts on the device ({ get, set, remove, keys }), over SQLite's key-value
// store. The core namespaces its keys per app and user.
function createDeviceStore() {
  return {
    get: (key) => Storage.getItemSync(key),
    set: (key, value) => Storage.setItemSync(key, String(value)),
    remove: (key) => {
      Storage.removeItemSync(key);
    },
    keys: () => Storage.getAllKeysSync(),
  };
}

export default createDeviceStore;
