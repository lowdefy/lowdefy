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

import isPrintableKey from './isPrintableKey.js';
import { ROW_CONTROLS_SPECIAL } from './rowControlsColumn.js';

function handleInputKeys({ event, api, rowElement, rowIndex, cell }) {
  const modified = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (modified && key === 'z') {
    event.preventDefault();
    api.actions.stepHistory({ direction: event.shiftKey ? 'redo' : 'undo' });
    return true;
  }
  if (event.ctrlKey && !event.metaKey && key === 'y') {
    event.preventDefault();
    api.actions.stepHistory({ direction: 'redo' });
    return true;
  }
  if (
    !modified &&
    api.editing.options.deleteRows &&
    (event.key === 'Delete' || event.key === 'Backspace')
  ) {
    event.preventDefault();
    const col = Number(cell.dataset.colIndex);
    if (api.actions.deleteRow({ rowId: rowElement.dataset.rowKey })) {
      api.keyboard?.moveTo({ row: rowIndex, col });
    }
    return true;
  }
  return false;
}

// Alt+Shift+ArrowUp/Down moves the focused row one place (`rowDrag`), the keyboard way to drag;
// focus stays on the moved row.
function handleMoveKeys({ event, api, rowElement, rowIndex, cell }) {
  if (!api.editing.options.rowDrag || !event.altKey || !event.shiftKey) return false;
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return false;
  event.preventDefault();
  const up = event.key === 'ArrowUp';
  const gap = up ? rowIndex - 1 : rowIndex + 2;
  const move = api.actions.moveRow({ rowId: rowElement.dataset.rowKey, gap });
  // The move's indices are in the whole list; the row moved one place in the display.
  if (move) {
    api.keyboard?.moveTo({
      row: up ? rowIndex - 1 : rowIndex + 1,
      col: Number(cell.dataset.colIndex),
    });
  }
  return true;
}

// Keys on a focused cell (not inside an open editor, whose own handler keeps its keys): Enter or
// F2 opens the editor, a printable key opens it seeded with that character (D8, D11). With
// `rowDrag`, Alt+Shift+Arrow moves the row. TableInput adds undo/redo and, with `deleteRows`,
// Delete on a focused row. Runs before the keyboard feature, so Enter on an editable cell edits
// instead of activating the row.
function handleEditKeyDown(event, api) {
  if (!api.editing?.enabled || !api.editing.layer) return false;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || !api.contains(cell) || event.target !== cell) return false;
  const rowElement = cell.closest('[data-row-index]');
  const rowIndex = Number(rowElement.dataset.rowIndex);
  if (rowIndex < 0) {
    // The row controls header has nothing to activate (and no column to sort).
    if (cell.dataset.special !== ROW_CONTROLS_SPECIAL) return false;
    return event.key === 'Enter' || event.key === ' ';
  }
  if (handleMoveKeys({ event, api, rowElement, rowIndex, cell })) return true;
  if (api.editing.input && handleInputKeys({ event, api, rowElement, rowIndex, cell })) {
    return true;
  }
  if (cell.dataset.special) return false;
  const rowId = rowElement.dataset.rowKey;
  const colKey = cell.dataset.colKey;
  if (event.key === 'Enter' || event.key === 'F2') {
    if (!api.actions.startEdit({ rowId, colKey })) return false;
    event.preventDefault();
    return true;
  }
  if (!isPrintableKey(event)) return false;
  if (event.key === ' ' && api.config.rowSelection) return false;
  if (!api.actions.startEdit({ rowId, colKey, seed: event.key })) return false;
  event.preventDefault();
  return true;
}

export default handleEditKeyDown;
