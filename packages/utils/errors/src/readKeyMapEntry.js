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
 * Reads one entry from a key map: a plain object keyed by id (keyMap.json),
 * or the columnar key map production servers hold (createColumnarKeyMap),
 * which builds the entry on request. Internal to @lowdefy/errors: the key map
 * readers read entries only through it.
 *
 * @param {Object} params
 * @param {Object} params.keyMap - A plain key map or a columnar key map
 * @param {string} params.id - The key id
 * @returns {Object|undefined} The entry, or undefined when the map has none
 */
function readKeyMapEntry({ keyMap, id }) {
  // A plain map's entries are objects, so even an entry whose id is "get" is
  // never a function.
  if (typeof keyMap.get === 'function') {
    return keyMap.get(id);
  }
  return keyMap[id];
}

export default readKeyMapEntry;
