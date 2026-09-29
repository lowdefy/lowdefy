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
import needsTemplates from '@lowdefy/blocks-antd/table/needsTemplates.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';
import readTemplateCompiler from '@lowdefy/blocks-antd/table/readTemplateCompiler.js';

import createColumnDefs from './createColumnDefs.js';
import densityHeights from './densityHeights.js';
import getHeaderLevels from './getHeaderLevels.js';
import getProviderIds from './getProviderIds.js';
import normalizeEnrichment from '../features/enrichment/normalizeEnrichment.js';
import normalizeExpandable from '../features/expandable/normalizeExpandable.js';
import normalizeServerData from '../features/serverData/normalizeServerData.js';
import normalizeTree from '../features/tree/normalizeTree.js';
import normalizePersist from '../features/views/normalizePersist.js';
import normalizeToolbar from '../features/toolbar/normalizeToolbar.js';
import useStableConfig from './useStableConfig.js';

const DEFAULT_PAGE_SIZE = 50;

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

// Pagination has TableLight's meaning when it is set (`true` always shows the pager), but it is
// off unless asked for: the Table scrolls any number of rows virtually. Server mode loads rows in
// blocks as they scroll into view, which is its own paging.
function normalizePagination({ pagination, pageSize, server }) {
  if (pagination !== true) return null;
  if (server) {
    throw new Error(
      'Table "pagination" needs client data; server mode loads rows in blocks while scrolling.'
    );
  }
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
  // Client `data` is an array of rows, never compared here; server mode is a small object.
  const serverData = useStableConfig(type.isObject(properties.data) ? properties.data : null);
  const tree = useStableConfig(properties.tree);
  const expandable = useStableConfig(properties.expandable);
  const toolbar = useStableConfig(properties.toolbar);
  const persist = useStableConfig(properties.persist);
  const keyboard = useStableConfig(properties.keyboard);
  const providers = useStableConfig(properties.providers);
  const addColumn = useStableConfig(properties.addColumn);
  const getKey = useMemo(
    () => createRowKeyGetter({ rowKey: properties.rowKey }),
    [properties.rowKey]
  );

  const normalized = useMemo(
    () =>
      normalizeColumns({
        columns: columnsConfig,
        defaultColumn,
        providerIds: getProviderIds(providers),
      }),
    [columnsConfig, defaultColumn, providers]
  );
  // The template compiler loads only for a config with templates; until it has, the table
  // suspends and the lazy block keeps its skeleton fallback up.
  const compileTemplate = readTemplateCompiler({
    needed: needsTemplates({ columns: normalized.columns, expandable }),
  });
  const columnModel = useMemo(() => {
    // `$user` values resolve from an empty user when the app sets none.
    const configUser = user ?? {};
    const columns = compileColumns({
      columns: normalized.columns,
      columnsByKey: normalized.columnsByKey,
      user: configUser,
      compileTemplate,
    });
    return {
      columns,
      columnsByKey: new Map(columns.map((column) => [column.key, column])),
      columnDefs: createColumnDefs({ columns }),
      expandable: normalizeExpandable({ expandable, columns, user: configUser, compileTemplate }),
      headerLevels: getHeaderLevels({ headerGroups: normalized.headerGroups }),
      rowRules: compileRules({
        rules: rowRules,
        columnsByKey: normalized.columnsByKey,
        user: configUser,
      }),
      user: configUser,
    };
  }, [normalized, compileTemplate, expandable, rowRules, user]);

  return useMemo(() => {
    const server = normalizeServerData(serverData);
    return {
      ...columnModel,
      bordered: properties.bordered === true,
      defaultDensity: type.isUndefined(densityHeights[properties.size])
        ? 'default'
        : properties.size,
      defaultView: defaultView ?? {},
      emptyText: properties.emptyText ?? 'No rows',
      enrichment: normalizeEnrichment({
        properties: {
          addColumn,
          addRow: properties.addRow,
          addRowText: properties.addRowText,
          importCsv: properties.importCsv,
          inputFieldPrefix: properties.inputFieldPrefix,
          providers,
        },
        columns: columnModel.columns,
      }),
      getId: (row) => String(getKey(row)),
      getKey,
      headerMenu: properties.headerMenu !== false,
      height: properties.height,
      keyboard: keyboard !== false,
      keyboardNext: keyboard?.next === true,
      maxHeight: properties.maxHeight ?? 600,
      pagination: normalizePagination({
        pagination: properties.pagination,
        pageSize: properties.pageSize,
        server,
      }),
      persist: normalizePersist(persist),
      reorderable: properties.reorderable !== false,
      rowHeight: properties.rowHeight,
      rowLink: type.isObject(rowLink) ? rowLink : null,
      rowSelection: normalizeRowSelection({ rowSelection, server }),
      rowVersionField: properties.rowVersionField,
      server,
      stickyHeader: properties.stickyHeader !== false,
      summary: properties.summary !== false,
      tree: normalizeTree({ tree, server }),
      toolbar: normalizeToolbar({ toolbar, columnsByKey: columnModel.columnsByKey }),
      virtual: properties.virtual ?? 'auto',
    };
  }, [
    addColumn,
    columnModel,
    defaultView,
    getKey,
    properties.bordered,
    keyboard,
    persist,
    properties.addRow,
    properties.addRowText,
    properties.emptyText,
    properties.headerMenu,
    properties.importCsv,
    properties.inputFieldPrefix,
    properties.height,
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
    providers,
    rowLink,
    rowSelection,
    serverData,
    tree,
    toolbar,
  ]);
}

export default useTableConfig;
