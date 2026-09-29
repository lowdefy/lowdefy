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

import { useMemo } from 'react';

import buildGroupTree from './buildGroupTree.js';
import createAggregateColumns from './createAggregateColumns.js';
import createGroupLevels from './createGroupLevels.js';
import findGroupIndices from './findGroupIndices.js';
import flattenGroups from './flattenGroups.js';

// The grouping feature's display-list hook (`useItems`). Client mode groups the filtered, sorted
// rows (the sorted row model, before pagination) into the flat list the window renders: the tree
// rebuilds when rows, grouping, aggregates or sort change; collapsing and expanding only
// re-flattens it. In server mode the server's groups are already in the list (serverData runs
// first and builds the same group items), so this adds no rows and only provides what the group
// header rows read (`api.grouping`).
function useGrouping({ api, config, rows, state, table }) {
  const keys = state.grouping;
  // A tree is never grouped: its rows are already a hierarchy.
  const active = keys.length > 0 && !config.tree;
  const server = Boolean(config.server);
  const sortedRows = table.getSortedRowModel().rows;
  const levels = useMemo(
    () => (active ? createGroupLevels({ keys, table, sorting: state.sorting }) : null),
    [active, config, keys, state.sorting]
  );
  const aggregates = useMemo(
    () => (active ? createAggregateColumns({ config, table, aggregates: state.aggregates }) : null),
    [active, config, state.aggregates]
  );
  const tree = useMemo(
    () =>
      active && !server
        ? buildGroupTree({ rows: sortedRows, levels, aggregates: aggregates.columns })
        : null,
    [sortedRows, levels, aggregates, server]
  );
  const flat = useMemo(
    () =>
      tree
        ? flattenGroups({
            groups: tree.groups,
            leaves: tree.leaves,
            collapsed: new Set(state.collapsedGroups),
          })
        : null,
    [tree, state.collapsedGroups]
  );
  const serverGroupIndices = useMemo(
    () => (active && server ? findGroupIndices(rows) : null),
    [active, server, rows]
  );
  if (!active) {
    api.grouping = null;
    return null;
  }
  api.grouping = {
    aggregateFns: aggregates.fnByKey,
    groupIndices: flat ? flat.groupIndices : serverGroupIndices,
    levels,
    tree,
  };
  if (!flat) return null;
  return { rows: flat.items, dataRows: tree.leaves };
}

export default useGrouping;
