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

import React, { memo } from 'react';
import { cn } from '@lowdefy/block-utils';
import SkeletonCell from '@lowdefy/blocks-antd/table/SkeletonCell.js';

// Special columns skeleton as the control they hold: a checkbox square for selection.
const SPECIAL_COLUMNS = {
  select: { key: '__select', type: 'boolean', align: 'center' },
};

function getSkeletonColumn(col) {
  if (col.special) return SPECIAL_COLUMNS[col.special] ?? null;
  return col.column;
}

// A row that is not loaded yet: the row's box with a skeleton per cell, shaped by the column type
// (SkeletonCell), so a loading table or a fast server-mode scroll shows the table's structure
// instead of blank space. Widths are seeded by the display index and column key, so a row keeps
// its shapes across renders. Used for the initial skeleton, server mode's unloaded rows, a server
// group's rows before its first block lands and a lazy tree row's children while they load.
// A skeleton row has no row key and nothing to act on, so its cells are not keyboard targets: no
// `data-lf-cell` and no tabindex. The keyboard's active cell waits on its row until the real row
// renders there (features/keyboard/useKeyboard.js).
function SkeletonRow({
  ariaRowIndex,
  centerCols,
  className,
  depthIndent,
  displayIndex,
  endCols,
  startCols,
}) {
  const leadKey = [...startCols, ...centerCols].find((col) => !col.special)?.key;
  const renderCells = (cols) =>
    cols.map((col) => {
      const column = getSkeletonColumn(col);
      return (
        <div
          className="lf-table-gridcell"
          data-col-index={col.index}
          data-pinned={col.region === 'center' ? undefined : col.region}
          data-pinned-edge={col.pinnedEdge ? '' : undefined}
          key={col.key}
          role="gridcell"
          style={col.style}
        >
          {depthIndent && col.key === leadKey ? (
            <span className="lf-table-skeleton-indent" style={{ width: depthIndent }} />
          ) : null}
          {column ? <SkeletonCell column={column} rowIndex={displayIndex} /> : null}
        </div>
      );
    });
  return (
    <div
      aria-busy="true"
      aria-rowindex={ariaRowIndex}
      className={cn(className, 'lf-table-skeleton-row')}
      data-row-index={displayIndex}
      data-skeleton=""
      role="row"
    >
      {renderCells(startCols)}
      <div className="lf-table-center">{renderCells(centerCols)}</div>
      {renderCells(endCols)}
    </div>
  );
}

export default memo(SkeletonRow);
