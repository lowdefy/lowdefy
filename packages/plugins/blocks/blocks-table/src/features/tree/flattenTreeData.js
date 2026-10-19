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

// Nested rows (`childrenField`) become one flat list in depth-first order, so sorting, selection
// and diffing by key work on every node. `parentOf` maps each child's row id to its parent's.
function flattenTreeData({ data, childrenField, getId }) {
  const rows = [];
  const parentOf = new Map();
  const stack = [];
  for (let i = data.length - 1; i >= 0; i--) stack.push({ row: data[i], parentId: undefined });
  while (stack.length > 0) {
    const { row, parentId } = stack.pop();
    rows.push(row);
    const id = getId(row);
    if (parentId !== undefined) parentOf.set(id, parentId);
    const children = get(row, childrenField);
    if (!type.isArray(children)) continue;
    for (let i = children.length - 1; i >= 0; i--) {
      if (type.isObject(children[i])) stack.push({ row: children[i], parentId: id });
    }
  }
  return { rows, parentOf };
}

export default flattenTreeData;
