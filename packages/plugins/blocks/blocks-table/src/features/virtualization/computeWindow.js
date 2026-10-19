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

import firstIndexAbove from './firstIndexAbove.js';

// Centre columns rendered beyond each edge of the viewport (MUI's column buffer).
const COLUMN_OVERSCAN_PX = 150;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fixedRowRange({ rowCount, rowHeight, top, bottom }) {
  const rowStart = clamp(Math.floor(top / rowHeight), 0, rowCount);
  const rowEnd = clamp(Math.ceil(bottom / rowHeight), rowStart, rowCount);
  return { rowStart, rowEnd };
}

// With `rowOffsets` (each item's top, and the total height last): the first item whose bottom is
// below `top`, up to the first item whose top is below `bottom`.
function offsetRowRange({ rowOffsets: offsets, rowCount, top, bottom }) {
  const rowStart = clamp(
    firstIndexAbove({ offsets: offsets.subarray(1), value: top }),
    0,
    rowCount
  );
  const rowEnd = clamp(
    firstIndexAbove({ offsets: offsets.subarray(0, rowCount), value: bottom }),
    rowStart,
    rowCount
  );
  return { rowStart, rowEnd };
}

// The rendered row and centre-column ranges for a scroll position. Row overscan is measured in
// pixels and leans in the scroll direction: one body height ahead, a quarter behind (D10.3).
// `rowOffsets` (see useRowOffsets) replaces the fixed row height when items differ in height.
function computeWindow({
  direction,
  headerHeight,
  layout,
  rowCount,
  rowHeight,
  rowOffsets,
  scrollLeft,
  scrollTop,
  viewportHeight,
  viewportWidth,
  virtualColumns,
  virtualRows,
}) {
  let rowStart = 0;
  let rowEnd = rowCount;
  if (virtualRows) {
    const bodyHeight = Math.max(rowHeight, viewportHeight - headerHeight);
    const lead = bodyHeight;
    const trail = Math.round(bodyHeight / 4);
    let before = trail;
    let after = trail;
    if (direction < 0) before = lead;
    if (direction > 0) after = lead;
    const bounds = { rowCount, top: scrollTop - before, bottom: scrollTop + bodyHeight + after };
    ({ rowStart, rowEnd } = rowOffsets
      ? offsetRowRange({ rowOffsets, ...bounds })
      : fixedRowRange({ rowHeight, ...bounds }));
  }
  let colStart = 0;
  let colEnd = layout.center.length;
  if (virtualColumns && colEnd > 0) {
    const centerViewport = Math.max(0, viewportWidth - layout.startWidth - layout.endWidth);
    colStart = firstIndexAbove({
      offsets: layout.centerEnds,
      value: scrollLeft - COLUMN_OVERSCAN_PX,
    });
    colEnd = Math.max(
      colStart,
      firstIndexAbove({
        offsets: layout.centerStarts,
        value: scrollLeft + centerViewport + COLUMN_OVERSCAN_PX,
      })
    );
  }
  return { colEnd, colStart, rowEnd, rowStart };
}

export default computeWindow;
