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
import compileColumns from '@lowdefy/blocks-antd/table/compileColumns.js';
import compileRules from '@lowdefy/blocks-antd/table/compileRules.js';
import createRowKeyGetter from '@lowdefy/blocks-antd/table/createRowKeyGetter.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import createColumnDefs from './createColumnDefs.js';
import densityHeights from './densityHeights.js';
import getHeaderLevels from './getHeaderLevels.js';
import useStableConfig from './useStableConfig.js';

const DEFAULT_PAGE_SIZE = 50;

function normalizeRowSelection(rowSelection) {
  if (!type.isObject(rowSelection)) return null;
  return {
    type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
    preserve: rowSelection.preserve === true,
  };
}

// Pagination has TableLight's meaning when it is set (`true` always shows the pager), but it is
// off unless asked for: the Table scrolls any number of rows virtually.
function normalizePagination({ pagination, pageSize }) {
  if (pagination !== true) return null;
  return { pageSize: type.isInt(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE };
}

// Everything derived from properties except `data`, memoised on config content rather than
// identity, so a re-evaluated but unchanged property set leaves the column model alone. Columns
// go through the shared column core (`@lowdefy/blocks-antd/table`), the same normalisation and
// compiled rules, tooltips and templates TableLight uses.
function useTableConfig({ properties }) {
  const columnsConfig = useStableConfig(properties.columns);
  const defaultColumn = useStableConfig(properties.defaultColumn);
  const defaultView = useStableConfig(properties.defaultView);
  const rowSelection = useStableConfig(properties.rowSelection);
  const rowLink = useStableConfig(properties.rowLink);
  const rowRules = useStableConfig(properties.rowRules);
  const user = useStableConfig(properties.user);
  const getKey = useMemo(
    () => createRowKeyGetter({ rowKey: properties.rowKey }),
    [properties.rowKey]
  );

  const columnModel = useMemo(() => {
    const normalized = normalizeColumns({ columns: columnsConfig, defaultColumn });
    const columns = compileColumns({
      columns: normalized.columns,
      columnsByKey: normalized.columnsByKey,
      user,
    });
    return {
      columns,
      columnsByKey: new Map(columns.map((column) => [column.key, column])),
      columnDefs: createColumnDefs({ columns }),
      headerLevels: getHeaderLevels({ headerGroups: normalized.headerGroups }),
      rowRules: compileRules({ rules: rowRules, columnsByKey: normalized.columnsByKey, user }),
      user,
    };
  }, [columnsConfig, defaultColumn, rowRules, user]);

  return useMemo(
    () => ({
      ...columnModel,
      bordered: properties.bordered === true,
      defaultDensity: type.isUndefined(densityHeights[properties.size])
        ? 'default'
        : properties.size,
      defaultView: defaultView ?? {},
      emptyText: properties.emptyText ?? 'No data',
      getId: (row) => String(getKey(row)),
      getKey,
      height: properties.height,
      keyboard: properties.keyboard !== false,
      maxHeight: properties.maxHeight ?? 600,
      pagination: normalizePagination({
        pagination: properties.pagination,
        pageSize: properties.pageSize,
      }),
      reorderable: properties.reorderable !== false,
      rowHeight: properties.rowHeight,
      rowLink: type.isObject(rowLink) ? rowLink : null,
      rowSelection: normalizeRowSelection(rowSelection),
      rowVersionField: properties.rowVersionField,
      stickyHeader: properties.stickyHeader !== false,
      summary: properties.summary !== false,
      virtual: properties.virtual ?? 'auto',
    }),
    [
      columnModel,
      defaultView,
      getKey,
      properties.bordered,
      properties.emptyText,
      properties.height,
      properties.keyboard,
      properties.maxHeight,
      properties.pageSize,
      properties.pagination,
      properties.reorderable,
      properties.rowHeight,
      properties.rowVersionField,
      properties.size,
      properties.stickyHeader,
      properties.summary,
      properties.virtual,
      rowLink,
      rowSelection,
    ]
  );
}

export default useTableConfig;
