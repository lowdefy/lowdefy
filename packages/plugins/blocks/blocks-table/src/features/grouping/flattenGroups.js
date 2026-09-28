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

function toGroupItem({ group, collapsed }) {
  return {
    kind: 'group',
    key: group.key,
    depth: group.depth,
    columnKey: group.columnKey,
    value: group.value,
    empty: group.empty,
    count: group.count,
    aggregates: group.aggregates,
    collapsed,
    start: group.start,
    end: group.end,
  };
}

// The one virtual list the window renders: group header items and the leaf rows of expanded
// groups, in display order, plus the list index of every header (ascending, for the sticky
// header's binary search). Collapsing reruns this, never the tree build.
function flattenGroups({ groups, leaves, collapsed }) {
  const items = [];
  const groupIndices = [];
  function visit(siblings) {
    siblings.forEach((group) => {
      const isCollapsed = collapsed.has(group.key);
      groupIndices.push(items.length);
      items.push(toGroupItem({ group, collapsed: isCollapsed }));
      if (isCollapsed) return;
      if (group.children !== null) {
        visit(group.children);
        return;
      }
      for (let i = group.start; i < group.end; i++) items.push(leaves[i]);
    });
  }
  visit(groups);
  return { items, groupIndices: Uint32Array.from(groupIndices) };
}

export default flattenGroups;
