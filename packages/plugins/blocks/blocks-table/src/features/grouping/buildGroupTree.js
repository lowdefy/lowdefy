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

import computeAggregate from '@lowdefy/blocks-antd/table/computeAggregate.js';

import orderGroups from './orderGroups.js';
import toGroupIdentity from './toGroupIdentity.js';

function createNode({ parent, identity, value, depth, level, last, aggregateCount }) {
  const path = [...parent.path, identity];
  const values = new Array(aggregateCount);
  for (let a = 0; a < aggregateCount; a++) values[a] = [];
  return {
    aggregates: {},
    children: last ? null : [],
    childMap: last ? null : new Map(),
    columnKey: level.key,
    count: 0,
    depth,
    empty: identity === null,
    end: 0,
    key: JSON.stringify(path),
    path,
    rows: last ? [] : null,
    start: 0,
    value: identity === null ? null : value,
    values,
  };
}

// Orders each level, lays the leaf rows out in group order (every group owns the leaf range
// [start, end), so a group's rows are one slice however deep it is), and turns the collected
// values into aggregates. The build-only fields are dropped so the tree holds no second copy.
function finalizeGroups({ groups, levels, aggregates, leaves, depth }) {
  const ordered = orderGroups({ groups, level: levels[depth] });
  ordered.forEach((group) => {
    group.start = leaves.length;
    if (group.children === null) {
      for (let i = 0; i < group.rows.length; i++) leaves.push(group.rows[i]);
    } else {
      group.children = finalizeGroups({
        groups: group.children,
        levels,
        aggregates,
        leaves,
        depth: depth + 1,
      });
    }
    group.end = leaves.length;
    group.count = group.end - group.start;
    aggregates.forEach(({ key, fn, column }, a) => {
      group.aggregates[key] = computeAggregate({ fn, values: group.values[a], column });
    });
    group.values = null;
    group.childMap = null;
    group.rows = null;
  });
  return ordered;
}

// The group tree in one pass over the filtered, sorted rows: each row walks the levels, creating
// groups on first sight, counting itself and collecting its aggregate values into every group on
// its path. Leaves keep the sort order within their group. `rows` are row-model rows
// ({ id, original }); `levels` come from createGroupLevels and `aggregates` from
// createAggregateColumns.
function buildGroupTree({ rows, levels, aggregates }) {
  const root = { path: [], children: [], childMap: new Map() };
  const groupsByKey = new Map();
  const lastDepth = levels.length - 1;
  const aggregateCount = aggregates.length;
  const aggregateValues = new Array(aggregateCount);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const original = row.original;
    for (let a = 0; a < aggregateCount; a++) {
      aggregateValues[a] = aggregates[a].accessor(original);
    }
    let parent = root;
    for (let depth = 0; depth <= lastDepth; depth++) {
      const level = levels[depth];
      const value = level.accessor(original);
      const identity = toGroupIdentity(value);
      let group = parent.childMap.get(identity);
      if (group === undefined) {
        group = createNode({
          parent,
          identity,
          value,
          depth,
          level,
          last: depth === lastDepth,
          aggregateCount,
        });
        parent.childMap.set(identity, group);
        parent.children.push(group);
        groupsByKey.set(group.key, group);
      }
      for (let a = 0; a < aggregateCount; a++) group.values[a].push(aggregateValues[a]);
      parent = group;
    }
    parent.rows.push(row);
  }
  const leaves = [];
  const groups = finalizeGroups({ groups: root.children, levels, aggregates, leaves, depth: 0 });
  return { groups, groupsByKey, leaves };
}

export default buildGroupTree;
