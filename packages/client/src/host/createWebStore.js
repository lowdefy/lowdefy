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

// A host store over a browser Storage. getStorage is called on every access:
// a browser that blocks site data throws on reaching window.localStorage
// itself, and the core catches that where it uses the store.
function createWebStore(getStorage) {
  return {
    get: (key) => getStorage().getItem(key),
    set: (key, value) => getStorage().setItem(key, value),
    remove: (key) => getStorage().removeItem(key),
    keys: () => {
      const storage = getStorage();
      const keys = [];
      for (let index = 0; index < storage.length; index += 1) {
        keys.push(storage.key(index));
      }
      return keys;
    },
  };
}

export default createWebStore;
