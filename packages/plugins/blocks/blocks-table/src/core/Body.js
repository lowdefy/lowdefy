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

import React, { useContext, useLayoutEffect, useRef } from 'react';

import RenderProbeContext from './RenderProbeContext.js';
import Row from './Row.js';
import rowRenderers from './rowRenderers.js';
import SkeletonRow from './SkeletonRow.js';

// Rows of the current window. `translated` (the default) renders the window rows in flow inside
// one container moved by a single translateY per range change; `positioned` gives each row its own
// absolute transform (TanStack Virtual's pattern), kept for the benchmark comparison.
//
// Items are TanStack rows, wrapped row items (`kind: 'row'`, with a tree depth or an expand
// state), other kinds rendered by the row renderer their feature registers (group headers,
// detail rows), or `undefined` for a row that is not loaded yet (a skeleton row). `rowOffsets`
// positions the items when some are not one row high; measured items (data rows with
// `measuredRows`, detail rows) take their content height and report it after each render.
function Body({
  activeCell,
  api,
  ariaRowOffset,
  centerCols,
  layout,
  measuredRows,
  measureRows,
  rowClassName,
  rowHeight,
  rowOffsets,
  rowStyle,
  rows,
  selectable,
  selection,
  range,
}) {
  const probe = useContext(RenderProbeContext);
  probe?.body();
  const windowRef = useRef(null);
  useLayoutEffect(() => {
    if (measureRows && windowRef.current) measureRows(windowRef.current.children);
  });
  const rowElements = [];
  const positioned = range.positioning === 'positioned' && rowOffsets === null;
  const leadIndex = layout.cols.find((col) => !col.special)?.index;
  for (let i = range.rowStart; i < range.rowEnd; i++) {
    const item = rows[i];
    const kind = item?.kind ?? 'row';
    const activeCol = activeCell.row === i ? activeCell.col : -1;
    const ariaRowIndex = i + ariaRowOffset;
    const offset = positioned ? i * rowHeight : undefined;
    if (item === undefined) {
      rowElements.push(
        <SkeletonRow
          ariaRowIndex={ariaRowIndex}
          centerCols={centerCols}
          className={rowClassName}
          displayIndex={i}
          endCols={layout.end}
          key={`__skeleton_${i}`}
          startCols={layout.start}
        />
      );
    } else if (kind !== 'row') {
      const ItemRow = rowRenderers[kind];
      rowElements.push(
        <ItemRow
          activeCol={activeCol}
          api={api}
          ariaRowIndex={ariaRowIndex}
          centerCols={centerCols}
          className={rowClassName}
          displayIndex={i}
          endCols={layout.end}
          item={item}
          key={`${kind}:${item.key}`}
          layout={layout}
          offset={offset}
          selectable={selectable}
          selection={selection}
          startCols={layout.start}
          style={rowStyle}
        />
      );
    } else {
      rowElements.push(
        <Row
          activeCol={activeCol}
          api={api}
          ariaRowIndex={ariaRowIndex}
          centerCols={centerCols}
          className={rowClassName}
          displayIndex={i}
          endCols={layout.end}
          item={item.kind ? item : undefined}
          key={item.id}
          leadIndex={leadIndex}
          measured={measuredRows}
          offset={offset}
          original={item.original}
          rowId={item.id}
          selectable={selectable}
          selected={selection[item.id] === true}
          startCols={layout.start}
          style={rowStyle}
        />
      );
    }
  }
  const height = rowOffsets ? rowOffsets[rows.length] : rows.length * rowHeight;
  const windowTop = rowOffsets ? rowOffsets[range.rowStart] : range.rowStart * rowHeight;
  return (
    <div className="lf-table-body" role="rowgroup" style={{ height }}>
      {positioned ? (
        rowElements
      ) : (
        <div
          className="lf-table-window"
          ref={windowRef}
          style={{ transform: `translateY(${windowTop}px)` }}
        >
          {rowElements}
        </div>
      )}
    </div>
  );
}

export default Body;
