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

import { useMemo, useRef } from 'react';

import buildTreeIndex from './buildTreeIndex.js';
import buildTreeItems from './buildTreeItems.js';
import getDescendantIds from './getDescendantIds.js';
import getExpandedIds from '../expansion/getExpandedIds.js';

// Tree rows from the row model: the index (parents and children) rebuilds when data changes, the
// display list when the filtered/sorted rows or the expanded keys change. `api.tree` is what
// cascading selection and keyboard expansion read.
function useTreeItems({ api, config, rows, state, table }) {
  const { tree } = config;
  const coreModel = table.getCoreRowModel();
  const index = useMemo(
    () =>
      tree
        ? buildTreeIndex({
            rows: coreModel.rows.map((row) => row.original),
            getId: config.getId,
            parentField: tree.parentField,
            parentOf: api.treeParents,
          })
        : null,
    [coreModel, tree, config.getId]
  );
  const cache = useRef(new WeakMap());
  const items = useMemo(
    () =>
      index
        ? buildTreeItems({
            rows,
            rowsById: coreModel.rowsById,
            parentOf: index.parentOf,
            childrenOf: index.childrenOf,
            expandedIds: getExpandedIds(state.expanded),
            hasChildrenField: tree.hasChildrenField,
            cache: cache.current,
          })
        : null,
    [rows, index, state.expanded]
  );
  api.tree = index
    ? { ...index, getDescendantIds: (id) => getDescendantIds({ id, childrenOf: index.childrenOf }) }
    : null;
  return items ? { rows: items } : null;
}

export default useTreeItems;
