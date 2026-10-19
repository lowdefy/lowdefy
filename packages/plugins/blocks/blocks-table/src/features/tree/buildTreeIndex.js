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

import { get, type } from '@lowdefy/helpers';

// Parent and children of every loaded row, by row id. With `parentField` the parent is the row
// whose key equals the field's value; a parent that is not in `data`, or a link that would close
// a cycle, makes the row a root.
function buildTreeIndex({ rows, getId, parentField, parentOf: flattenedParents }) {
  const ids = new Set(rows.map(getId));
  const parentOf = new Map();
  rows.forEach((row) => {
    const id = getId(row);
    let parentId = flattenedParents?.get(id);
    if (parentField) {
      const parentKey = get(row, parentField);
      parentId = type.isNone(parentKey) ? undefined : String(parentKey);
    }
    if (parentId !== undefined && parentId !== id && ids.has(parentId)) {
      parentOf.set(id, parentId);
    }
  });
  parentOf.forEach((_, id) => {
    const seen = new Set([id]);
    let current = parentOf.get(id);
    while (current !== undefined) {
      if (seen.has(current)) {
        parentOf.delete(id);
        return;
      }
      seen.add(current);
      current = parentOf.get(current);
    }
  });
  const childrenOf = new Map();
  rows.forEach((row) => {
    const id = getId(row);
    const parentId = parentOf.get(id);
    if (parentId === undefined) return;
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(id);
  });
  return { parentOf, childrenOf };
}

export default buildTreeIndex;
