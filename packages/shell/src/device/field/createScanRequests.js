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
 * The ScanCode requests the scan sheet answers: one at a time. `open` resolves with the first code
 * read, or null when the sheet closes without one; a request made while one is open replaces it
 * (the first resolves null).
 */
function createScanRequests() {
  let current = null;
  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(current));
  }

  function finish(result) {
    if (current === null) return;
    const { resolve } = current;
    current = null;
    notify();
    resolve(result);
  }

  return {
    open(params) {
      finish(null);
      return new Promise((resolve) => {
        current = { params, resolve };
        notify();
      });
    },
    finish,
    get: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export default createScanRequests;
