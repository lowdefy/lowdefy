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
import { type } from '@lowdefy/helpers';

import createColumnDefs from './createColumnDefs.js';
import createRowKeyGetter from './createRowKeyGetter.js';
import normalizeColumns from './normalizeColumns.js';
import normalizeExpandable from '../features/expandable/normalizeExpandable.js';
import normalizeServerData from '../features/serverData/normalizeServerData.js';
import normalizeTree from '../features/tree/normalizeTree.js';
import useStableConfig from './useStableConfig.js';

// In server mode rows leave the block cache while they stay selected, so selection is always
// preserved there.
function normalizeRowSelection({ rowSelection, server }) {
  if (!type.isObject(rowSelection)) return null;
  return {
    type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
    preserve: rowSelection.preserve === true || Boolean(server),
    cascade: rowSelection.cascade === true,
  };
}

// Everything derived from properties except `data`, memoised on config content rather than
// identity, so a re-evaluated but unchanged property set leaves the column model alone.
function useTableConfig({ properties }) {
  const columnsConfig = useStableConfig(properties.columns);
  const defaultColumn = useStableConfig(properties.defaultColumn);
  const defaultView = useStableConfig(properties.defaultView);
  const rowSelection = useStableConfig(properties.rowSelection);
  const rowLink = useStableConfig(properties.rowLink);
  // Client `data` is an array of rows, never compared here; server mode is a small object.
  const serverData = useStableConfig(type.isObject(properties.data) ? properties.data : null);
  const tree = useStableConfig(properties.tree);
  const expandable = useStableConfig(properties.expandable);
  const getKey = useMemo(
    () => createRowKeyGetter({ rowKey: properties.rowKey }),
    [properties.rowKey]
  );

  return useMemo(() => {
    const { columns, headerGroups } = normalizeColumns({ columns: columnsConfig, defaultColumn });
    const server = normalizeServerData(serverData);
    return {
      columns,
      columnsByKey: new Map(columns.map((column) => [column.key, column])),
      columnDefs: createColumnDefs({ columns }),
      defaultView: defaultView ?? {},
      emptyText: properties.emptyText ?? 'No data',
      expandable: normalizeExpandable({ expandable, columns }),
      getId: (row) => String(getKey(row)),
      getKey,
      headerGroups,
      height: properties.height,
      keyboard: properties.keyboard !== false,
      maxHeight: properties.maxHeight ?? 600,
      reorderable: properties.reorderable !== false,
      rowHeight: properties.rowHeight,
      rowLink: type.isObject(rowLink) ? rowLink : null,
      rowSelection: normalizeRowSelection({ rowSelection, server }),
      rowVersionField: properties.rowVersionField,
      server,
      stickyHeader: properties.stickyHeader !== false,
      tree: normalizeTree({ tree, server }),
      virtual: properties.virtual ?? 'auto',
    };
  }, [
    columnsConfig,
    defaultColumn,
    defaultView,
    expandable,
    getKey,
    properties.emptyText,
    properties.height,
    properties.keyboard,
    properties.maxHeight,
    properties.reorderable,
    properties.rowHeight,
    properties.rowVersionField,
    properties.stickyHeader,
    properties.virtual,
    rowLink,
    rowSelection,
    serverData,
    tree,
  ]);
}

export default useTableConfig;
