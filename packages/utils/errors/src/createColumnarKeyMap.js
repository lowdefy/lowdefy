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

const BASE36_ID = /^[0-9a-z]+$/;

/**
 * Reads a key map encoded by encodeColumnarKeyMap. The columns are held as
 * typed arrays and each entry is built only when it is asked for, so a large
 * app's key map stays a few tens of MB in memory instead of a million objects.
 *
 * The key map readers of @lowdefy/errors (resolveKeyEntry, resolveConfigLocation,
 * createKeyPathResolver, shouldSuppressBuildCheck) take the result in place of
 * a plain key map.
 *
 * @param {Object} columns - The output of encodeColumnarKeyMap, as parsed JSON
 * @returns {Object} { get(id) }: the entry in the short shape { s, p?, r?, l?, i? },
 *   or undefined when the map has no entry with that id. An entry whose parent
 *   is not in the map has no `p`.
 */
function createColumnarKeyMap({ base, segments, segment, parent, line, refs, ignoreBuildChecks }) {
  const segmentColumn = Int32Array.from(segment);
  const parentColumn = Int32Array.from(parent);
  const lineColumn = Int32Array.from(line);
  const refAt = new Map(refs);
  const ignoreAt = new Map(ignoreBuildChecks);

  function indexOf(id) {
    if (typeof id !== 'string' || !BASE36_ID.test(id)) {
      return -1;
    }
    const index = parseInt(id, 36) - base;
    if (index < 0 || index >= segmentColumn.length || segmentColumn[index] === -1) {
      return -1;
    }
    // A leading zero parses to another id's index; only the canonical spelling
    // is that entry's id.
    return (index + base).toString(36) === id ? index : -1;
  }

  function get(id) {
    const index = indexOf(id);
    if (index === -1) {
      return undefined;
    }
    const entry = { s: segments[segmentColumn[index]] };
    if (parentColumn[index] !== -1) {
      entry.p = (parentColumn[index] + base).toString(36);
    }
    if (refAt.has(index)) {
      entry.r = refAt.get(index);
    }
    if (lineColumn[index] !== 0) {
      entry.l = lineColumn[index];
    }
    if (ignoreAt.has(index)) {
      entry.i = ignoreAt.get(index);
    }
    return entry;
  }

  return { get };
}

export default createColumnarKeyMap;
