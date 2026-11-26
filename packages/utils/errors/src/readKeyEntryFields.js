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
 * Reads one key map entry's own fields, in either entry shape. Internal to
 * @lowdefy/errors: everything else reads entries through resolveKeyEntry or
 * createKeyPathResolver.
 *
 * Full shape (written by builds before the short shape):
 *   { key, '~k_parent', '~r'?, '~l'?, '~ignoreBuildChecks'? }
 *   `key` is the full config path and `~r` the entry's own ref id, so the
 *   entry is complete on its own: an absent `~r` means no ref.
 *
 * Short shape:
 *   { s, p, r?, l?, i? }
 *   `s` is the entry's own path segment, joined onto its parent's path, and
 *   `r` is written only where the ref differs from the parent's resolved ref;
 *   `r: null` means no ref, under a parent that has one.
 *
 * Builds of different Lowdefy versions write different shapes (journeys scope
 * reads the app's own build, and cached scope builds keep their shape), so
 * each entry is read by its own shape: short when it has `s`, which every
 * short entry carries, else full.
 *
 * @param {Object} entry - A key map entry
 * @returns {Object} { complete, pathPart, ownsRef, refId, line, parentId, ignoreBuildChecks }
 *   complete is true when pathPart is the full path and refId the resolved ref;
 *   ownsRef is true when the entry sets its ref rather than inheriting it.
 */
function readKeyEntryFields(entry) {
  if (entry.s !== undefined) {
    return {
      complete: false,
      pathPart: entry.s,
      ownsRef: entry.r !== undefined,
      refId: entry.r ?? null,
      line: entry.l ?? null,
      parentId: entry.p ?? null,
      ignoreBuildChecks: entry.i ?? null,
    };
  }
  return {
    complete: true,
    pathPart: entry.key,
    ownsRef: true,
    refId: entry['~r'] ?? null,
    line: entry['~l'] ?? null,
    parentId: entry['~k_parent'] ?? null,
    ignoreBuildChecks: entry['~ignoreBuildChecks'] ?? null,
  };
}

export default readKeyEntryFields;
