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

import readKeyEntryFields from './readKeyEntryFields.js';

/**
 * Resolves one key map entry, in either entry shape, to its full config path
 * and ref id. A short-shape entry walks its parent chain: its path is the
 * parent's path joined with its own segment, and its ref is the nearest ref on
 * the way up (`r: null` stops the search with no ref). The walk ends at a
 * parent id that is not in the map (addKeys gives each tree root a parent id
 * it never writes), at a full-shape ancestor, which carries its whole path and
 * ref, or where a corrupt map cycles.
 *
 * For a scan over the whole map use createKeyPathResolver, which resolves each
 * entry once.
 *
 * @param {Object} params
 * @param {Object} params.keyMap - The keyMap from build output
 * @param {string} params.configKey - The ~k value from the config object
 * @returns {Object|null} { path, refId, line, parentId, ignoreBuildChecks }, or
 *   null when configKey is missing or not in the map. line, parentId and
 *   ignoreBuildChecks are the entry's own fields.
 */
function resolveKeyEntry({ keyMap, configKey }) {
  if (!configKey || !keyMap?.[configKey]) {
    return null;
  }
  const own = readKeyEntryFields(keyMap[configKey]);
  if (own.complete) {
    return {
      path: own.pathPart,
      refId: own.refId,
      line: own.line,
      parentId: own.parentId,
      ignoreBuildChecks: own.ignoreBuildChecks,
    };
  }
  const pathParts = [];
  let refId = null;
  let refFound = false;
  let fields = own;
  let currentId = configKey;
  const seen = new Set();
  while (fields !== null) {
    seen.add(currentId);
    pathParts.push(fields.pathPart);
    if (!refFound && fields.ownsRef) {
      refId = fields.refId;
      refFound = true;
    }
    const parentId = fields.parentId;
    const walkOn = !fields.complete && Boolean(keyMap[parentId]) && !seen.has(parentId);
    currentId = parentId;
    fields = walkOn ? readKeyEntryFields(keyMap[parentId]) : null;
  }
  return {
    path: pathParts.reverse().join(''),
    refId,
    line: own.line,
    parentId: own.parentId,
    ignoreBuildChecks: own.ignoreBuildChecks,
  };
}

export default resolveKeyEntry;
