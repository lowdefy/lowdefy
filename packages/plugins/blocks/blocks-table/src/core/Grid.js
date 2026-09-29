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

import React, { useMemo } from 'react';
import { cn } from '@lowdefy/block-utils';
import LoadingAnnouncer from '@lowdefy/blocks-antd/table/LoadingAnnouncer.js';

import applyLayoutVars from './applyLayoutVars.js';
import Body from './Body.js';
import computeLayout from './computeLayout.js';
import dispatchGridEvent from './dispatchGridEvent.js';
import EmptyState from './EmptyState.js';
import getRecordCount from './getRecordCount.js';
import getTableSkeletonCount from './getTableSkeletonCount.js';
import HeaderRow from './HeaderRow.js';
import isViewFiltered from './isViewFiltered.js';
import renderRegion from './renderRegion.js';
import SkeletonRows from './SkeletonRows.js';
import SummaryRow from './SummaryRow.js';
import useGridFeatures from './useGridFeatures.js';
import useViewportSize from './useViewportSize.js';

function toCssSize(size) {
  return typeof size === 'number' ? `${size}px` : size;
}

// A key, a pointer press or focus in the table ends a holding skeleton (D17's minimum time avoids
// flicker; it must not block input), before the handlers run, so the action lands on the rows.
const HOLD_ENDING_EVENTS = new Set(['focus', 'keydown', 'pointerdown']);

function hasSummary({ layout, summary }) {
  if (summary === null) return false;
  return layout.cols.some((col) => !col.special && summary.has(col.key));
}

// The window component: one scroll container for header, body and summary footer (native scroll,
// sticky header and footer). It owns the scroll-driven state (rendered ranges, active cell), so
// scrolling renders the grid and never the block above it.
//
// Loading (D17): `loadingState` is resolveLoadingState's. `showSkeleton` renders skeleton rows
// in place of the body (the initial load, and the minimum time a shown skeleton stays);
// `skeletonPhase` is useSkeletonTiming's: `hidden` keeps them invisible for the first 120 ms, and
// `holding` (rows are there, the skeleton stays its minimum time) is marked on the root; a key,
// pointer press or focus in the table ends it (`endSkeletonHold`). `busy` (a refetch or refresh with
// rows on screen) and `isPending` (a view change) show the progress bar under the header through
// CSS on the root; a view change also dims the rows once it takes longer than 300 ms (table.css).
function Grid({
  api,
  blockId,
  busy,
  classNames,
  clickable,
  config,
  endSkeletonHold,
  headerHeight,
  isPending,
  leadingColumns,
  loadingState,
  regions,
  rowHeight,
  rowHeights,
  rows,
  showSkeleton,
  skeletonPhase,
  state,
  strategy,
  styles,
  summary,
}) {
  const { rootRef, scrollerRef } = api;
  const levels = config.headerLevels;
  const viewport = useViewportSize(scrollerRef);
  const layout = useMemo(
    () =>
      computeLayout({
        table: api.table,
        leadingColumns,
        viewportWidth: viewport.width,
        wrap: state.wrap,
      }),
    [
      config,
      leadingColumns,
      state.wrap,
      state.columnOrder,
      state.columnPinning,
      state.columnSizing,
      state.columnVisibility,
      viewport.width,
    ]
  );
  // Header group rows stack above the leaf header row, each one header row high.
  const headerRowsHeight = headerHeight * (levels.depth + 1);
  const showRows = rows.length > 0 && !showSkeleton;
  const showSummary = showRows && hasSummary({ layout, summary });
  const footerHeight = showSummary ? rowHeight : 0;
  Object.assign(api, { footerHeight, headerHeight: headerRowsHeight, layout, rowHeight, rows });
  api.previewLayout = ({ widths }) =>
    applyLayoutVars({
      element: rootRef.current,
      layout: computeLayout({
        table: api.table,
        leadingColumns,
        viewportWidth: viewport.width,
        widths,
        wrap: state.wrap,
      }),
    });

  const { activeCell, measuredColumns, measureRows, range, rowOffsets, scrollerTabIndex } =
    useGridFeatures({
      api,
      config,
      headerHeight: headerRowsHeight,
      layout,
      rowHeight,
      rowHeights,
      rows,
      scrollerRef,
      state,
      strategy,
      viewport,
    });

  const centerCols = useMemo(
    () => layout.center.slice(range.colStart, range.colEnd),
    [layout, range.colStart, range.colEnd]
  );
  const rootStyle = useMemo(
    () => ({
      ...layout.vars,
      '--lf-row-h': `${rowHeight}px`,
      '--lf-header-h': `${headerHeight}px`,
      ...styles.element,
    }),
    [layout, rowHeight, headerHeight, styles.element]
  );
  const scrollerStyle = {
    '--lf-center-before': `${layout.centerStarts[range.colStart] ?? 0}px`,
    '--lf-viewport-w': `${viewport.width}px`,
  };
  const fixedHeight = config.height !== undefined && config.height !== null;
  if (fixedHeight) {
    scrollerStyle.height = toCssSize(config.height);
  } else {
    scrollerStyle.maxHeight = toCssSize(config.maxHeight);
  }
  const rowClassName = cn('lf-table-row', classNames.row);
  const dispatch = (eventType) => (event) => {
    if (HOLD_ENDING_EVENTS.has(eventType)) endSkeletonHold();
    dispatchGridEvent({ api, event, eventType });
  };

  // Body rows follow the header rows in aria-rowindex (1-based).
  const ariaRowOffset = levels.depth + 2;
  let body;
  if (showSkeleton) {
    body = (
      <SkeletonRows
        ariaRowOffset={ariaRowOffset}
        centerCols={centerCols}
        count={getTableSkeletonCount({
          height: config.height,
          maxHeight: config.maxHeight,
          headerHeight: headerRowsHeight,
          measuredHeight: viewport.height,
          pageSize: config.pagination ? state.pageSize : null,
          // Holding a shown skeleton while the rows are there: as many as the rows.
          rowCount: rows.length > 0 ? rows.length : null,
          rowHeight,
        })}
        layout={layout}
        rowClassName={rowClassName}
      />
    );
  } else if (rows.length > 0) {
    body = (
      <Body
        activeCell={activeCell}
        api={api}
        ariaRowOffset={ariaRowOffset}
        centerCols={centerCols}
        layout={layout}
        measuredRows={measuredColumns}
        measureRows={measureRows}
        range={range}
        rowClassName={rowClassName}
        rowHeight={rowHeight}
        rowOffsets={rowOffsets}
        rowStyle={styles.row}
        rows={rows}
        selectable={Boolean(config.rowSelection)}
        selection={state.rowSelection}
      />
    );
  } else {
    body = (
      <EmptyState
        content={api.content}
        filtered={isViewFiltered(state)}
        methods={api.methods}
        onClearFilters={() => api.actions.applyFiltering({ filter: null, search: null })}
        text={config.emptyText}
      />
    );
  }

  return (
    <div
      className={cn('lf-table', classNames.element)}
      data-bordered={config.bordered ? '' : undefined}
      data-busy={busy ? '' : undefined}
      data-clickable={clickable ? '' : undefined}
      data-loading-state={showSkeleton ? 'initial' : loadingState}
      data-pending={isPending ? '' : undefined}
      data-skeleton-hidden={showSkeleton && skeletonPhase === 'hidden' ? '' : undefined}
      data-skeleton-holding={skeletonPhase === 'holding' ? '' : undefined}
      id={blockId}
      onAuxClick={dispatch('auxclick')}
      onBlur={dispatch('blur')}
      onClick={dispatch('click')}
      onDoubleClick={dispatch('dblclick')}
      onFocus={dispatch('focus')}
      onKeyDown={dispatch('keydown')}
      onPointerDown={dispatch('pointerdown')}
      onPointerLeave={dispatch('pointerleave')}
      onPointerOver={dispatch('pointerover')}
      ref={rootRef}
      style={rootStyle}
    >
      {renderRegion(regions.top)}
      <div
        aria-busy={showSkeleton || busy || isPending ? true : undefined}
        aria-colcount={layout.cols.length}
        aria-multiselectable={config.rowSelection?.type === 'checkbox' ? true : undefined}
        aria-rowcount={rows.length + levels.depth + 1 + (showSummary ? 1 : 0)}
        className="lf-table-scroller"
        data-autoheight={fixedHeight ? undefined : ''}
        ref={scrollerRef}
        role={config.tree ? 'treegrid' : 'grid'}
        style={scrollerStyle}
        tabIndex={scrollerTabIndex}
      >
        <div className="lf-table-canvas">
          <HeaderRow
            activeCol={activeCell.row === -1 ? activeCell.col : -1}
            api={api}
            centerCols={centerCols}
            className={cn('lf-table-header', classNames.header)}
            layout={layout}
            levels={levels}
            state={state}
            sticky={config.stickyHeader}
            style={styles.header}
          />
          {showRows
            ? api.features.bodyOverlays.map((Overlay, i) => (
                <Overlay
                  api={api}
                  centerCols={centerCols}
                  headerHeight={headerRowsHeight}
                  key={i}
                  layout={layout}
                  rowClassName={rowClassName}
                  rows={rows}
                  selectable={Boolean(config.rowSelection)}
                  selection={state.rowSelection}
                  sticky={config.stickyHeader}
                />
              ))
            : null}
          {body}
          {showSummary ? (
            <SummaryRow
              api={api}
              ariaRowIndex={rows.length + ariaRowOffset}
              centerCols={centerCols}
              layout={layout}
              summary={summary}
            />
          ) : null}
        </div>
      </div>
      {renderRegion(regions.bottom)}
      <LoadingAnnouncer
        count={getRecordCount({ api })}
        state={showSkeleton ? 'initial' : loadingState}
      />
    </div>
  );
}

export default Grid;
