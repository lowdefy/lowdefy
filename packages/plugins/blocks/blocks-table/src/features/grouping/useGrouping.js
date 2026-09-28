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
import flattenGroups from './flattenGroups.js';

// Groups the filtered, sorted rows (the sorted row model, before pagination) into the flat list
// the window renders. The tree rebuilds when rows, grouping, aggregates or sort change;
// collapsing and expanding only re-flattens it.
function useGrouping({ api, config, state, table }) {
  const keys = state.grouping;
  const active = keys.length > 0;
  const rows = table.getSortedRowModel().rows;
  const levels = useMemo(
    () => (active ? createGroupLevels({ keys, table, sorting: state.sorting }) : null),
    [active, config, keys, state.sorting]
  );
  const aggregates = useMemo(
    () => (active ? createAggregateColumns({ config, table, aggregates: state.aggregates }) : null),
    [active, config, state.aggregates]
  );
  const tree = useMemo(
    () => (active ? buildGroupTree({ rows, levels, aggregates: aggregates.columns }) : null),
    [rows, levels, aggregates]
  );
  const flat = useMemo(
    () =>
      active
        ? flattenGroups({
            groups: tree.groups,
            leaves: tree.leaves,
            collapsed: new Set(state.collapsedGroups),
          })
        : null,
    [tree, state.collapsedGroups]
  );
  if (!active) {
    api.grouping = null;
    return null;
  }
  api.grouping = {
    aggregateFns: aggregates.fnByKey,
    groupIndices: flat.groupIndices,
    levels,
    tree,
  };
  return { rows: flat.items, dataRows: tree.leaves };
}

export default useGrouping;
