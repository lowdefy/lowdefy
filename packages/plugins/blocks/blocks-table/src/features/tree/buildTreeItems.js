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

import { get } from '@lowdefy/helpers';

function isSameItem({ item, row, depth, hasChildren, expanded }) {
  return (
    item !== undefined &&
    item.row === row &&
    item.depth === depth &&
    item.hasChildren === hasChildren &&
    item.expanded === expanded
  );
}

// The display list of a tree from the row model rows (already filtered and sorted): siblings keep
// the order the rows arrive in, so a sort sorts within each level. Ancestors of every row the
// filter kept stay in the list, so a match deep in the tree keeps its path. Children of collapsed
// rows are left out. Unchanged rows keep their item object (and their memoised row component).
function buildTreeItems({
  rows,
  rowsById,
  parentOf,
  expandedIds,
  hasChildrenField,
  childrenOf,
  cache,
}) {
  const inRows = new Set(rows.map((row) => row.id));
  const walked = new Set();
  const visibleChildren = new Map();
  const roots = [];

  function emit(id) {
    const parentId = parentOf.get(id);
    if (parentId === undefined) {
      roots.push(id);
      return;
    }
    if (!visibleChildren.has(parentId)) visibleChildren.set(parentId, []);
    visibleChildren.get(parentId).push(id);
  }

  // Ancestors the filter left out are placed just before their first descendant in row order,
  // which is where their own sort position would be relative to their siblings' rows.
  rows.forEach((row) => {
    const missing = [];
    let ancestor = parentOf.get(row.id);
    while (ancestor !== undefined && !walked.has(ancestor)) {
      walked.add(ancestor);
      if (!inRows.has(ancestor)) missing.push(ancestor);
      ancestor = parentOf.get(ancestor);
    }
    for (let i = missing.length - 1; i >= 0; i--) emit(missing[i]);
    emit(row.id);
  });

  const items = [];
  const stack = [];
  for (let i = roots.length - 1; i >= 0; i--) stack.push({ id: roots[i], depth: 0 });
  while (stack.length > 0) {
    const { id, depth } = stack.pop();
    const row = rowsById[id];
    const children = visibleChildren.get(id);
    const lazyChildren =
      hasChildrenField !== null &&
      !childrenOf.has(id) &&
      get(row.original, hasChildrenField) === true;
    const hasChildren = children !== undefined || lazyChildren;
    const expanded = hasChildren && expandedIds.has(id);
    let item = cache.get(row);
    if (!isSameItem({ item, row, depth, hasChildren, expanded })) {
      item = {
        kind: 'row',
        id,
        row,
        original: row.original,
        index: row.index,
        depth,
        hasChildren,
        expanded,
        parentId: parentOf.get(id),
      };
      cache.set(row, item);
    }
    items.push(item);
    if (expanded && children) {
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({ id: children[i], depth: depth + 1 });
      }
    }
  }
  return items;
}

export default buildTreeItems;
