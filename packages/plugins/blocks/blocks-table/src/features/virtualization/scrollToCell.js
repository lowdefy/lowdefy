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

// Scrolls the minimum needed to bring a cell into view below the sticky header and beside the
// pinned columns (`align: 'start' | 'center'` for rows scroll further).
function scrollToCell({ api, row, col, align }) {
  const scroller = api.scrollerRef.current;
  if (!scroller) return;
  const { headerHeight, layout, rowHeight } = api;
  if (row >= 0) {
    const bodyHeight = scroller.clientHeight - headerHeight;
    const rowTop = row * rowHeight;
    let top = scroller.scrollTop;
    if (align === 'start') {
      top = rowTop;
    } else if (align === 'center') {
      top = rowTop - (bodyHeight - rowHeight) / 2;
    } else if (rowTop < top) {
      top = rowTop;
    } else if (rowTop + rowHeight > top + bodyHeight) {
      top = rowTop + rowHeight - bodyHeight;
    }
    scroller.scrollTop = Math.max(0, top);
  }
  const target = layout?.cols[col];
  if (target?.region !== 'center') return;
  const viewLeft = scroller.scrollLeft;
  const centerViewport = scroller.clientWidth - layout.startWidth - layout.endWidth;
  if (target.centerStart < viewLeft) {
    scroller.scrollLeft = target.centerStart;
  } else if (target.centerStart + target.width > viewLeft + centerViewport) {
    scroller.scrollLeft = target.centerStart + target.width - centerViewport;
  }
}

export default scrollToCell;
