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

// The ids a JIT build context holds when it is created are the config build's,
// already written to keyMap.json and refMap.json. Ids added later are logged in
// the order they are first seen, so a page build can write exactly the entries
// added while it ran (see scanJitMaps and writeJitMaps).
function createIdLog(map) {
  return { seen: new Set(Object.keys(map)), added: [] };
}

function createJitMaps({ keyMap, refMap, name }) {
  return {
    name,
    writes: 0,
    keys: createIdLog(keyMap),
    refs: createIdLog(refMap),
  };
}

export default createJitMaps;
