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

// Rows of the current window. `translated` (the default) renders the window rows in flow inside
// one container moved by a single translateY per range change; `positioned` gives each row its own
// absolute transform (TanStack Virtual's pattern), kept for the benchmark comparison. With
// measured rows (`rowOffsets`), rows take their content height and report it after each render.
function Body({
  activeCell,
  api,
  ariaRowOffset,
  centerCols,
  layout,
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
  const positioned = range.positioning === 'positioned';
  const measured = rowOffsets !== null;
  for (let i = range.rowStart; i < range.rowEnd; i++) {
    const row = rows[i];
    rowElements.push(
      <Row
        activeCol={activeCell.row === i ? activeCell.col : -1}
        api={api}
        ariaRowIndex={i + ariaRowOffset}
        centerCols={centerCols}
        className={rowClassName}
        displayIndex={i}
        endCols={layout.end}
        key={row.id}
        measured={measured}
        original={row.original}
        rowId={row.id}
        selectable={selectable}
        selected={selection[row.id] === true}
        startCols={layout.start}
        offset={positioned ? i * rowHeight : undefined}
        style={rowStyle}
      />
    );
  }
  const height = measured ? rowOffsets[rows.length] : rows.length * rowHeight;
  const windowTop = measured ? rowOffsets[range.rowStart] : range.rowStart * rowHeight;
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
