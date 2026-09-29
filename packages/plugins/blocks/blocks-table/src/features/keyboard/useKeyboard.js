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

import { useLayoutEffect, useRef, useState } from 'react';

import findCellElement from './findCellElement.js';
import hasCells from './hasCells.js';
import isCellRendered from './isCellRendered.js';
import scrollToCell from '../virtualization/scrollToCell.js';

function clampCell({ cell, rowCount, colCount }) {
  return {
    row: Math.min(Math.max(cell.row, -1), rowCount - 1),
    col: Math.min(Math.max(cell.col, 0), Math.max(colCount - 1, 0)),
  };
}

function isFocusInTable(api) {
  const focused = document.activeElement;
  return focused === null || focused === document.body || api.rootRef.current.contains(focused);
}

// Roving tabindex over the grid (D11): exactly one cell (header row -1 included) is tabbable. The
// active cell may be scrolled out of the rendered window; then the scroller itself takes the tab
// stop and hands focus back to the cell (scrolled into view) when it receives it. The scroller
// also stands in while the active cell's row renders no cells (a skeleton row: the initial
// skeleton, an unloaded server row). A move onto such a row waits: focus stays where it is and
// lands on the cell once its real row renders, unless focus has left the table by then.
function useKeyboard(ctx) {
  const { api, layout, range, rows } = ctx;
  const [active, setActive] = useState(null);
  const pendingFocus = useRef(false);
  const waiting = useRef(false);
  const fallback = { row: rows.length ? 0 : -1, col: 0 };
  const activeCell = clampCell({
    cell: active ?? fallback,
    rowCount: rows.length,
    colCount: layout.cols.length,
  });

  api.keyboard = {
    activeCell,
    moveTo(cell) {
      const next = clampCell({ cell, rowCount: api.rows.length, colCount: api.layout.cols.length });
      pendingFocus.current = true;
      waiting.current = false;
      setActive(next);
      scrollToCell({ api, row: next.row, col: next.col });
    },
    setActive(cell) {
      setActive((previous) =>
        previous?.row === cell.row && previous?.col === cell.col ? previous : cell
      );
    },
  };

  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const element = findCellElement({ api, row: activeCell.row, col: activeCell.col });
    if (!element) {
      waiting.current = true;
      return;
    }
    pendingFocus.current = false;
    if (waiting.current && !isFocusInTable(api)) return;
    element.focus({ preventScroll: true });
  });

  const focusable =
    isCellRendered({ cell: activeCell, layout, range }) && hasCells({ api, row: activeCell.row });
  return { activeCell, scrollerTabIndex: focusable ? -1 : 0 };
}

export default useKeyboard;
