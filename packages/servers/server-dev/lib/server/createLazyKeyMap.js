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

// The key map of a JIT build context: the entries its page builds add, as the
// map's own properties, over the config build's keyMap.json, read the first
// time a lookup misses an own entry. A page build adds keys and writes them to
// jitMaps/ without reading the config build's (a page's keys chain to a root
// of their own), so most builds never read it; an error or warning located
// through a key, or a node the config build keyed, does.
//
// The readers in @lowdefy/errors read entries through get (readKeyMapEntry),
// and Object.keys lists only the added entries, so the context's JIT map log
// (createJitMaps, scanJitMaps) tracks what its builds added without listing
// the config build's entries.
function createLazyKeyMap({ readSkeletonKeyMap }) {
  const keyMap = {};
  let skeletonKeyMap = null;
  Object.defineProperty(keyMap, 'get', {
    enumerable: false,
    value(id) {
      if (Object.hasOwn(keyMap, id)) {
        return keyMap[id];
      }
      skeletonKeyMap ??= readSkeletonKeyMap() ?? {};
      return Object.hasOwn(skeletonKeyMap, id) ? skeletonKeyMap[id] : undefined;
    },
  });
  return keyMap;
}

export default createLazyKeyMap;
