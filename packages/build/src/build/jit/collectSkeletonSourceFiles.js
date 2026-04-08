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

// Walk an object/array tree collecting non-enumerable ~r ref IDs.
// ~r is set by buildRefs (walker.js) on every resolved object/array
// and is non-enumerable, so Object.keys() won't find it.
function walkRefIds(obj, refIds) {
  if (obj === null || typeof obj !== 'object') return;

  if (obj['~r'] !== undefined) {
    refIds.add(obj['~r']);
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walkRefIds(obj[i], refIds);
    }
  } else {
    for (const key of Object.keys(obj)) {
      walkRefIds(obj[key], refIds);
    }
  }
}

// Collect file paths that contribute to skeleton (non-page) config.
// Walks ~r markers on non-page components, traces each through the
// refMap parent chain, and scans for scalar-resolving descendants.
function collectSkeletonSourceFiles({ components, context }) {
  const refIds = new Set();

  for (const key of Object.keys(components)) {
    if (key === 'pages') continue;
    walkRefIds(components[key], refIds);
  }

  const sourceFiles = new Set();

  // Walk parent chains for each collected ref ID
  for (const refId of refIds) {
    let current = refId;
    while (current != null) {
      const entry = context.refMap[current];
      if (!entry) break;
      if (entry.path) {
        sourceFiles.add(entry.path);
      }
      current = entry.parent;
    }
  }

  // Scan for scalar-resolving descendants: refs that resolved to primitives
  // have no ~r marker in the tree but are recorded in the refMap. Include
  // their paths if any ancestor in their parent chain is a collected ref ID.
  for (const [id, entry] of Object.entries(context.refMap)) {
    if (refIds.has(id)) continue;
    let current = entry.parent;
    while (current != null) {
      if (refIds.has(current)) {
        if (entry.path) {
          sourceFiles.add(entry.path);
        }
        break;
      }
      const parentEntry = context.refMap[current];
      if (!parentEntry) break;
      current = parentEntry.parent;
    }
  }

  return sourceFiles;
}

export default collectSkeletonSourceFiles;
