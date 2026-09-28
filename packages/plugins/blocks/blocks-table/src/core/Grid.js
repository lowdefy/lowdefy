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

import applyLayoutVars from './applyLayoutVars.js';
import Body from './Body.js';
import bodyOverlays from './bodyOverlays.js';
import computeLayout from './computeLayout.js';
import dispatchGridEvent from './dispatchGridEvent.js';
import EmptyState from './EmptyState.js';
import HeaderRow from './HeaderRow.js';
import LoadingRows from './LoadingRows.js';
import renderRegion from './renderRegion.js';
import useGridFeatures from './useGridFeatures.js';
import useViewportSize from './useViewportSize.js';

function toCssSize(size) {
  return typeof size === 'number' ? `${size}px` : size;
}

// The window component: one scroll container for header and body (native scroll, sticky header).
// It owns the scroll-driven state (rendered ranges, active cell), so scrolling renders the grid
// and never the block above it.
function Grid({
  api,
  blockId,
  classNames,
  clickable,
  config,
  headerHeight,
  isPending,
  leadingColumns,
  loading,
  regions,
  rowHeight,
  rowOffsets,
  rows,
  state,
  strategy,
  styles,
}) {
  const { rootRef, scrollerRef } = api;
  const viewport = useViewportSize(scrollerRef);
  const layout = useMemo(
    () => computeLayout({ table: api.table, leadingColumns, viewportWidth: viewport.width }),
    [
      config,
      leadingColumns,
      state.columnOrder,
      state.columnPinning,
      state.columnSizing,
      state.columnVisibility,
      viewport.width,
    ]
  );
  Object.assign(api, { headerHeight, layout, rowHeight, rowOffsets, rows });
  api.previewLayout = ({ widths }) =>
    applyLayoutVars({
      element: rootRef.current,
      layout: computeLayout({
        table: api.table,
        leadingColumns,
        viewportWidth: viewport.width,
        widths,
      }),
    });

  const { activeCell, range, scrollerTabIndex } = useGridFeatures({
    api,
    config,
    headerHeight,
    layout,
    rowHeight,
    rowOffsets,
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
  const dispatch = (eventType) => (event) => dispatchGridEvent({ api, event, eventType });

  let body;
  if (rows.length > 0) {
    body = (
      <Body
        activeCell={activeCell}
        api={api}
        centerCols={centerCols}
        layout={layout}
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
  } else if (loading) {
    body = <LoadingRows layout={layout} />;
  } else {
    body = <EmptyState text={config.emptyText} />;
  }

  return (
    <div
      className={cn('lf-table', classNames.element)}
      data-clickable={clickable ? '' : undefined}
      data-pending={isPending ? '' : undefined}
      id={blockId}
      onAuxClick={dispatch('auxclick')}
      onClick={dispatch('click')}
      onDoubleClick={dispatch('dblclick')}
      onFocus={dispatch('focus')}
      onKeyDown={dispatch('keydown')}
      onPointerDown={dispatch('pointerdown')}
      ref={rootRef}
      style={rootStyle}
    >
      {loading && rows.length > 0 ? <div className="lf-table-progress" /> : null}
      {renderRegion(regions.top)}
      <div
        aria-busy={loading ? true : undefined}
        aria-colcount={layout.cols.length}
        aria-multiselectable={config.rowSelection?.type === 'checkbox' ? true : undefined}
        aria-rowcount={rows.length + 1}
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
            state={state}
            sticky={config.stickyHeader}
            style={styles.header}
          />
          {rows.length > 0
            ? bodyOverlays.map((Overlay, i) => (
                <Overlay
                  api={api}
                  centerCols={centerCols}
                  headerHeight={headerHeight}
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
        </div>
      </div>
      {renderRegion(regions.bottom)}
    </div>
  );
}

export default Grid;
