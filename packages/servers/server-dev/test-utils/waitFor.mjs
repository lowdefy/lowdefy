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

// Polls until predicate() is true. The ceiling is generous because file
// events can take seconds to arrive on a loaded machine; a passing test never
// waits for it.
function waitFor(predicate, { timeout = 20000, interval = 25, description = 'condition' } = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - started > timeout) {
        reject(new Error(`Timed out after ${timeout}ms waiting for ${description}.`));
        return;
      }
      setTimeout(tick, interval);
    };
    tick();
  });
}

export default waitFor;
