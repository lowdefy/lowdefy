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

import isMeasuredColumn from './isMeasuredColumn.js';
import useRowOffsets from './useRowOffsets.js';
import useScrollWindow from './useScrollWindow.js';

const AUTO_ROW_THRESHOLD = 200;
const AUTO_COLUMN_THRESHOLD = 20;

// `virtual: auto` (D15) virtualises rows above 200 and columns above 20 or when the table is wider
// than twice the viewport; below that the extra range logic costs more than it saves. Measured
// rows (wrapped or multi-line columns) turn column virtualisation off, as a row's height depends
// on every cell in it. Items of other heights (measured rows, detail rows) are placed by
// `rowOffsets` (useRowOffsets), which also rules out the bench's positioned strategy
// (positionedRowsFeature). The rows are placed by one translated window.
function useVirtualization(ctx) {
  const { api, config, headerHeight, layout, rowHeight, rowHeights, rows, scrollerRef, viewport } =
    ctx;
  const measuredColumns = layout.cols.some(isMeasuredColumn);
  const auto = config.virtual === 'auto';
  const virtualRows = config.virtual === true || (auto && rows.length > AUTO_ROW_THRESHOLD);
  const virtualColumns =
    !measuredColumns &&
    (config.virtual === true ||
      (auto &&
        (layout.center.length > AUTO_COLUMN_THRESHOLD || layout.totalWidth > 2 * viewport.width)));
  const { measureRows, rowOffsets } = useRowOffsets({
    api,
    layout,
    measuredColumns,
    rowHeight,
    rowHeights,
    rows,
    scrollerRef,
  });
  const scrollWindow = useScrollWindow({
    scrollerRef,
    params: {
      headerHeight,
      layout,
      rowCount: rows.length,
      rowHeight,
      rowOffsets,
      virtualColumns,
      virtualRows,
    },
  });
  return {
    measuredColumns,
    measureRows,
    range: { ...scrollWindow, positioning: 'translated' },
    rowOffsets,
    virtualRows,
  };
}

export default useVirtualization;
