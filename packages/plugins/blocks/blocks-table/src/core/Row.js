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

import React, { memo, useContext } from 'react';

import Cell from './Cell.js';
import RenderProbeContext from './RenderProbeContext.js';

function renderCells({ api, cols, activeCol, original, selected }) {
  return cols.map((col) => (
    <Cell
      api={api}
      col={col}
      focused={activeCol === col.index}
      key={col.key}
      original={original}
      selected={selected}
    />
  ));
}

// Memoised by row key and row object: with data diffed by key, an update to one row of 100k
// re-renders that one row. Rows never receive their TanStack row object, whose identity changes
// whenever the row model rebuilds.
function Row({
  activeCol,
  api,
  centerCols,
  className,
  displayIndex,
  endCols,
  offset,
  original,
  rowId,
  selectable,
  selected,
  startCols,
  style,
}) {
  const probe = useContext(RenderProbeContext);
  probe?.row(rowId);
  const positioned = offset !== undefined;
  return (
    <div
      aria-rowindex={displayIndex + 2}
      aria-selected={selectable ? selected : undefined}
      className={className}
      data-positioned={positioned ? '' : undefined}
      data-row-index={displayIndex}
      data-row-key={rowId}
      role="row"
      style={positioned ? { ...style, transform: `translateY(${offset}px)` } : style}
    >
      {renderCells({ api, cols: startCols, activeCol, original, selected })}
      <div className="lf-table-center">
        {renderCells({ api, cols: centerCols, activeCol, original, selected })}
      </div>
      {renderCells({ api, cols: endCols, activeCol, original, selected })}
    </div>
  );
}

export default memo(Row);
