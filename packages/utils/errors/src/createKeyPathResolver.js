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
import resolveKeyEntry from './resolveKeyEntry.js';

/**
 * Creates a resolver for scans over a whole key map. It gives the same result
 * as resolveKeyEntry, but remembers each entry it resolves, so an entry's
 * parent chain is walked only as far as the nearest entry already resolved and
 * a scan reads and resolves every entry once.
 *
 * @param {Object} params
 * @param {Object} params.keyMap - The keyMap from build output
 * @returns {Function} (configKey) => { path, refId, line, parentId, ignoreBuildChecks } | null
 */
function createKeyPathResolver({ keyMap }) {
  const resolved = new Map();

  function resolveChain(configKey) {
    const chain = [];
    const seen = new Set();
    let currentId = configKey;
    while (!resolved.has(currentId)) {
      const entry = keyMap[currentId];
      if (!entry) {
        break;
      }
      if (seen.has(currentId)) {
        // A corrupt map that cycles has no root to resolve from, so the entry
        // is resolved on its own, as resolveKeyEntry ends such a walk.
        return resolveKeyEntry({ keyMap, configKey });
      }
      seen.add(currentId);
      const fields = readKeyEntryFields(entry);
      chain.push({ id: currentId, fields });
      if (fields.complete) {
        break;
      }
      currentId = fields.parentId;
    }
    let parent = resolved.get(currentId) ?? null;
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      const { id, fields } = chain[index];
      let path = fields.pathPart;
      let refId = fields.refId;
      if (!fields.complete && parent !== null) {
        path = `${parent.path}${fields.pathPart}`;
        if (!fields.ownsRef) {
          refId = parent.refId;
        }
      }
      const result = {
        path,
        refId,
        line: fields.line,
        parentId: fields.parentId,
        ignoreBuildChecks: fields.ignoreBuildChecks,
      };
      resolved.set(id, result);
      parent = result;
    }
    return resolved.get(configKey) ?? null;
  }

  return function resolveKeyPath(configKey) {
    if (resolved.has(configKey)) {
      return resolved.get(configKey);
    }
    if (!configKey) {
      return null;
    }
    return resolveChain(configKey);
  };
}

export default createKeyPathResolver;
