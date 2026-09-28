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
import normalizePersist from '../features/views/normalizePersist.js';
import normalizeToolbar from '../features/toolbar/normalizeToolbar.js';
import useStableConfig from './useStableConfig.js';

function normalizeRowSelection(rowSelection) {
  if (!type.isObject(rowSelection)) return null;
  return {
    type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
    preserve: rowSelection.preserve === true,
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
  const toolbar = useStableConfig(properties.toolbar);
  const persist = useStableConfig(properties.persist);
  const keyboard = useStableConfig(properties.keyboard);
  const getKey = useMemo(
    () => createRowKeyGetter({ rowKey: properties.rowKey }),
    [properties.rowKey]
  );

  return useMemo(() => {
    const { columns, headerGroups } = normalizeColumns({ columns: columnsConfig, defaultColumn });
    const columnsByKey = new Map(columns.map((column) => [column.key, column]));
    return {
      columns,
      columnsByKey,
      columnDefs: createColumnDefs({ columns }),
      defaultView: defaultView ?? {},
      emptyText: properties.emptyText ?? 'No data',
      getId: (row) => String(getKey(row)),
      getKey,
      headerGroups,
      height: properties.height,
      keyboard: keyboard !== false,
      keyboardNext: keyboard?.next === true,
      maxHeight: properties.maxHeight ?? 600,
      persist: normalizePersist(persist),
      reorderable: properties.reorderable !== false,
      rowHeight: properties.rowHeight,
      rowLink: type.isObject(rowLink) ? rowLink : null,
      rowSelection: normalizeRowSelection(rowSelection),
      rowVersionField: properties.rowVersionField,
      stickyHeader: properties.stickyHeader !== false,
      toolbar: normalizeToolbar({ toolbar, columnsByKey }),
      virtual: properties.virtual ?? 'auto',
    };
  }, [
    columnsConfig,
    defaultColumn,
    defaultView,
    getKey,
    keyboard,
    persist,
    properties.emptyText,
    properties.height,
    properties.maxHeight,
    properties.reorderable,
    properties.rowHeight,
    properties.rowVersionField,
    properties.stickyHeader,
    properties.virtual,
    rowLink,
    rowSelection,
    toolbar,
  ]);
}

export default useTableConfig;
