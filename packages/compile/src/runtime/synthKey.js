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

// Provenance for build-step-synthesized nodes (design D8): build steps create
// config (default pages, menus, computed auth) that has no source position.
// Reserved-namespace keys carry the generating step; keyMap entries get the
// key path and step — parity with today, where synthesized nodes have keys
// but no source line.
function createSynthKeys(step) {
  let counter = 0;
  return function synthKey(keyMap, keyPath) {
    counter += 1;
    const id = `gen:${step}:${counter.toString(36)}`;
    if (keyMap) {
      keyMap[id] = { key: keyPath ?? '', step };
    }
    return id;
  };
}

export default createSynthKeys;
