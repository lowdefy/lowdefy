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

// Lazy tree children in flight (D17): the row ids whose `onRowExpand` (with `needsChildren`) is
// still running, and the error of the last failed load per row. The tree's display list
// subscribes (`version`), so a row shows a spinner in its chevron and one skeleton child while
// its children load, and the error in a tooltip on its chevron if they fail.
function createChildLoads() {
  const listeners = new Set();
  const loads = {
    loading: new Set(),
    errors: new Map(),
    version: 0,
  };

  function notify() {
    loads.version += 1;
    listeners.forEach((listener) => listener());
  }

  return Object.assign(loads, {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getVersion() {
      return loads.version;
    },
    start(id) {
      loads.loading.add(id);
      loads.errors.delete(id);
      notify();
    },
    finish(id, error) {
      loads.loading.delete(id);
      if (error) loads.errors.set(id, error);
      notify();
    },
    clearError(id) {
      if (!loads.errors.delete(id)) return;
      notify();
    },
  });
}

export default createChildLoads;
