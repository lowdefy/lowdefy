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
 * Holds a Screen's footer slot for the page to draw outside its scroll view: `set(render)` with
 * the slot's render function (or null for none), and `get` and `subscribe` for the footer view
 * (useSyncExternalStore). Only the footer view hears a change, so a Screen render that sets its
 * footer renders the footer again, not the page around the Screen.
 */
function createFooterStore() {
  const listeners = new Set();
  let render = null;
  return {
    get: () => render,
    set: (next) => {
      render = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export default createFooterStore;
