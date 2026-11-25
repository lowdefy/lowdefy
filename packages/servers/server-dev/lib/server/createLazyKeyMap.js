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
// time a lookup needs one of its entries. A page build's keys chain to a root
// of their own (isPageBuildKey tells them apart), so a build that locates no
// error and reuses no node the config build keyed never reads it.
// onConfigBuildEntryRead is called for each config build entry a lookup
// returns: the build that made it reached a node keyed by this config build,
// whose key the next config build no longer resolves.
//
// The readers in @lowdefy/errors read entries through get (readKeyMapEntry),
// and Object.keys lists only the added entries, so the context's JIT map log
// (createJitMaps, scanJitMaps) tracks what its builds added without listing
// the config build's entries.
function createLazyKeyMap({ readSkeletonKeyMap, isPageBuildKey, onConfigBuildEntryRead }) {
  const keyMap = {};
  let skeletonKeyMap = null;
  Object.defineProperty(keyMap, 'get', {
    enumerable: false,
    value(id) {
      if (Object.hasOwn(keyMap, id)) {
        return keyMap[id];
      }
      if (isPageBuildKey(id)) {
        return undefined;
      }
      skeletonKeyMap ??= readSkeletonKeyMap() ?? {};
      if (!Object.hasOwn(skeletonKeyMap, id)) {
        return undefined;
      }
      onConfigBuildEntryRead();
      return skeletonKeyMap[id];
    },
  });
  return keyMap;
}

export default createLazyKeyMap;
