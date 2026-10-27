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

// A host store held in memory. throws makes every call throw, as a browser
// that blocks site data does.
function createMemoryStore({ stored = {}, throws = false } = {}) {
  function check() {
    if (throws) throw new Error('storage disabled');
  }
  return {
    get: (key) => {
      check();
      return stored[key] ?? null;
    },
    set: (key, value) => {
      check();
      stored[key] = String(value);
    },
    remove: (key) => {
      check();
      delete stored[key];
    },
    keys: () => {
      check();
      return Object.keys(stored);
    },
  };
}

export default createMemoryStore;
