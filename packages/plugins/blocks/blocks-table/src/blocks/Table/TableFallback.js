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

import React, { useEffect, useMemo, useRef } from 'react';
import { type } from '@lowdefy/helpers';
import loadTemplateCompiler from '@lowdefy/blocks-antd/table/loadTemplateCompiler.js';
import needsTemplates from '@lowdefy/blocks-antd/table/needsTemplates.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';
import useSkeletonTiming from '@lowdefy/blocks-antd/table/useSkeletonTiming.js';

import computeFallbackLayout from '../../core/computeFallbackLayout.js';
import densityHeights from '../../core/densityHeights.js';
import EmptyState from '../../core/EmptyState.js';
import getHeaderLevels from '../../core/getHeaderLevels.js';
import getRowControlsWidth from '../../features/editing/getRowControlsWidth.js';
import getSortHeaderProps from '../../features/sorting/getSortHeaderProps.js';
import getTableSkeletonCount from '../../core/getTableSkeletonCount.js';
import HeaderRow from '../../core/HeaderRow.js';
import needsToolbar from '../../features/toolbar/needsToolbar.js';
import selectColumnWidth from '../../features/selection/selectColumnWidth.js';
import SkeletonRows from '../../core/SkeletonRows.js';
import SortIndicator from '../../features/sorting/SortIndicator.js';
import useStableConfig from '../../core/useStableConfig.js';
import useViewportSize from '../../core/useViewportSize.js';

import '../../core/table.css';

const DEFAULT_MAX_HEIGHT = 600;
const DEFAULT_PAGE_SIZE = 50;
// The header parts and header attributes the fallback can show without the engine: the sort
// indicator of sortable columns.
const HEADER_FEATURES = {
  headerParts: [SortIndicator],
  list: [{ headerCellProps: getSortHeaderProps }],
};

function toCssSize(size) {
  return typeof size === 'number' ? `${size}px` : size;
}

function EmptyHeader() {
  return null;
}

function SelectHeader() {
  return <input className="lf-table-checkbox" disabled type="checkbox" />;
}

function getLeadingColumns({ input, properties }) {
  const leading = [];
  const rowDrag = properties.rowDrag === true || type.isObject(properties.rowDrag);
  const deleteButton = input && properties.rowActions?.delete === true;
  if (rowDrag || deleteButton) {
    leading.push({
      key: '__row',
      special: 'row',
      width: getRowControlsWidth({ rowDrag, deleteButton }),
      Header: EmptyHeader,
    });
  }
  if (type.isObject(properties.rowSelection)) {
    leading.push({
      key: '__select',
      special: 'select',
      width: selectColumnWidth,
      Header: properties.rowSelection.type === 'radio' ? EmptyHeader : SelectHeader,
    });
  }
  return leading;
}

function getDensity({ properties, value }) {
  const density = value?.view?.density ?? properties.defaultView?.density ?? properties.size;
  return type.isUndefined(densityHeights[density]) ? 'default' : density;
}

function getSorting({ defaultView, value }) {
  const sort = value?.view?.sort ?? defaultView.sort;
  if (!type.isArray(sort)) return [];
  return sort
    .filter((entry) => type.isObject(entry))
    .map((entry) => ({ id: entry.key, desc: entry.desc === true }));
}

// What the lazy Table shows while its code loads (D17): the table itself in its initial loading
// state, built from the column config: the real header (titles, sort indicators, header groups,
// the view's column order and widths), type-shaped skeleton rows at the table's density and
// exactly its height, and room for the toolbar, pager and TableInput's add-row button. It lays
// the columns out with the engine's buildLayout (computeFallbackLayout), renders the engine's
// skeleton rows and hands its skeleton timing to the table (useSkeletonTiming), so the swap to
// the table is invisible. When the rows are already there it shows as many skeleton rows as the
// table will show rows (loading or not: the table holds its rows while it loads); with none and
// nothing loading it shows the empty state.
function TableFallback({
  blockId,
  content = {},
  input = false,
  loading,
  methods,
  properties,
  value,
}) {
  const scrollerRef = useRef(null);
  const viewport = useViewportSize(scrollerRef);
  const columnsConfig = useStableConfig(properties.columns);
  const defaultColumn = useStableConfig(properties.defaultColumn);
  const defaultView = useStableConfig(properties.defaultView) ?? {};
  const expandable = useStableConfig(properties.expandable);
  const normalized = useMemo(
    () => normalizeColumns({ columns: columnsConfig, defaultColumn }),
    [columnsConfig, defaultColumn]
  );
  useEffect(() => {
    // The template compiler loads alongside the table's code, not after it.
    if (needsTemplates({ columns: normalized.columns, expandable })) loadTemplateCompiler();
  }, [normalized, expandable]);
  const layout = computeFallbackLayout({
    columns: normalized.columns,
    defaultView,
    leadingColumns: getLeadingColumns({ input, properties }),
    value,
    viewportWidth: viewport.width,
  });
  const levels = getHeaderLevels({ headerGroups: normalized.headerGroups });
  const rowHeight = properties.rowHeight ?? densityHeights[getDensity({ properties, value })];
  const headerHeight = Math.min(Math.max(rowHeight, 32), 48);
  const headerRowsHeight = headerHeight * (levels.depth + 1);
  const isLoading = loading === true || properties.loading === true;
  const server = type.isObject(properties.data);
  const rowCount = type.isArray(properties.data) ? properties.data.length : 0;
  // The table holds rows it has while loading, so known rows decide the height either way.
  const empty = !server && !isLoading && rowCount === 0;
  const phase = useSkeletonTiming({ active: !empty, id: blockId, handoff: true });
  const pagination = properties.pagination === true && !server;
  const pageSize = type.isInt(properties.pageSize) ? properties.pageSize : DEFAULT_PAGE_SIZE;

  const rootStyle = {
    ...layout.vars,
    '--lf-row-h': `${rowHeight}px`,
    '--lf-header-h': `${headerHeight}px`,
  };
  const scrollerStyle = {
    '--lf-center-before': '0px',
    '--lf-viewport-w': `${viewport.width}px`,
  };
  const fixedHeight = !type.isNone(properties.height);
  if (fixedHeight) {
    scrollerStyle.height = toCssSize(properties.height);
  } else {
    scrollerStyle.maxHeight = toCssSize(properties.maxHeight ?? DEFAULT_MAX_HEIGHT);
  }

  let body;
  if (empty) {
    body = (
      <EmptyState
        content={content}
        filtered={false}
        methods={methods}
        onClearFilters={() => undefined}
        text={properties.emptyText ?? 'No rows'}
      />
    );
  } else {
    body = (
      <SkeletonRows
        ariaRowOffset={levels.depth + 2}
        centerCols={layout.center}
        count={getTableSkeletonCount({
          height: properties.height,
          maxHeight: properties.maxHeight ?? DEFAULT_MAX_HEIGHT,
          headerHeight: headerRowsHeight,
          measuredHeight: viewport.height,
          pageSize: pagination ? pageSize : null,
          rowCount: rowCount > 0 ? rowCount : null,
          rowHeight,
        })}
        layout={layout}
        rowClassName="lf-table-row"
      />
    );
  }

  return (
    <div
      className="lf-table"
      data-bordered={properties.bordered === true ? '' : undefined}
      data-lf-fallback=""
      data-loading-state={empty ? 'empty' : 'initial'}
      data-skeleton-hidden={phase === 'hidden' ? '' : undefined}
      id={blockId}
      style={rootStyle}
    >
      {needsToolbar({ content, properties }) ? (
        <div className="lf-table-toolbar-placeholder" data-lf-toolbar-placeholder="" />
      ) : null}
      <div
        aria-busy={empty ? undefined : true}
        aria-colcount={layout.cols.length}
        className="lf-table-scroller"
        data-autoheight={fixedHeight ? undefined : ''}
        ref={scrollerRef}
        role={properties.tree ? 'treegrid' : 'grid'}
        style={scrollerStyle}
      >
        <div className="lf-table-canvas">
          <HeaderRow
            activeCol={-1}
            api={{ features: HEADER_FEATURES, methods }}
            centerCols={layout.center}
            className="lf-table-header"
            layout={layout}
            levels={levels}
            state={{ sorting: getSorting({ defaultView, value }) }}
            sticky={properties.stickyHeader !== false}
          />
          {body}
        </div>
      </div>
      {pagination ? <div className="lf-table-pagination-placeholder" /> : null}
      {input && properties.addRow === true ? (
        <div className="lf-table-add-row-placeholder" />
      ) : null}
    </div>
  );
}

export default TableFallback;
