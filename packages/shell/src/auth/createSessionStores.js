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

/**
 * The page cache and device store the app's session writes through. Once the session has ended
 * (isEnded), a sync or page load still in flight writes nothing: the person's pages arriving after
 * their sign-out are dropped, not cached.
 */
function createSessionStores({ cacheStore, isEnded, kv }) {
  function unlessEnded(write) {
    return async (params) => {
      if (isEnded()) return;
      await write(params);
    };
  }
  return {
    cacheStore: {
      read: async (cacheKey) => (isEnded() ? null : cacheStore.read(cacheKey)),
      writeRoot: unlessEnded(cacheStore.writeRoot),
      writePage: unlessEnded(cacheStore.writePage),
      removePages: unlessEnded(cacheStore.removePages),
    },
    kv: {
      get: (key) => kv.get(key),
      set: (key, value) => {
        if (!isEnded()) kv.set(key, value);
      },
    },
  };
}

export default createSessionStores;
