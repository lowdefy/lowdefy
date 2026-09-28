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

import useScrollWindow from './useScrollWindow.js';
import useTanstackRowWindow from './useTanstackRowWindow.js';

const AUTO_ROW_THRESHOLD = 200;
const AUTO_COLUMN_THRESHOLD = 20;

// `virtual: auto` (D15) virtualises rows above 200 and columns above 20 or when the table is wider
// than twice the viewport; below that the extra range logic costs more than it saves.
function useVirtualization(ctx) {
  const { config, headerHeight, layout, rowHeight, rows, scrollerRef, strategy, viewport } = ctx;
  const auto = config.virtual === 'auto';
  const virtualRows = config.virtual === true || (auto && rows.length > AUTO_ROW_THRESHOLD);
  const virtualColumns =
    config.virtual === true ||
    (auto &&
      (layout.center.length > AUTO_COLUMN_THRESHOLD || layout.totalWidth > 2 * viewport.width));
  const scrollWindow = useScrollWindow({
    scrollerRef,
    params: { headerHeight, layout, rowCount: rows.length, rowHeight, virtualColumns, virtualRows },
  });
  // The scroll window is state recomputed in a layout effect, so in the render where the row
  // count drops (a filter, shorter data) it still spans the previous rows. Clamp it to the rows
  // this render has; the effect then settles the window for the new count before paint.
  const rowEnd = Math.min(scrollWindow.rowEnd, rows.length);
  const rowStart = Math.min(scrollWindow.rowStart, rowEnd);
  const positioned = strategy === 'positioned' && virtualRows;
  const tanstackRows = useTanstackRowWindow({
    enabled: positioned,
    headerHeight,
    rowCount: rows.length,
    rowHeight,
    scrollerRef,
  });
  if (positioned && tanstackRows) {
    return { range: { ...scrollWindow, ...tanstackRows, positioning: 'positioned' } };
  }
  return { range: { ...scrollWindow, rowStart, rowEnd, positioning: 'translated' } };
}

export default useVirtualization;
