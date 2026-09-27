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

import { type } from '@lowdefy/helpers';

// Returns the keys of every ancestor of the node with `key`, in the simple-mode `treeData` built by
// getTreeData (nodes linked by `id`/`pId`). Parent ids resolve the way antd builds the tree: a
// repeated id resolves to its last node. `seen` stops at a parent cycle in the data.
function getTreeAncestorKeys({ key, treeData }) {
  const nodesById = new Map(treeData.map((node) => [node.id, node]));
  const node = treeData.find((treeNode) => treeNode.key === key);
  const keys = [];
  const seen = new Set([key]);
  let parent = nodesById.get(node.pId);
  while (!type.isUndefined(parent) && !seen.has(parent.key)) {
    keys.push(parent.key);
    seen.add(parent.key);
    parent = nodesById.get(parent.pId);
  }
  return keys;
}

export default getTreeAncestorKeys;
