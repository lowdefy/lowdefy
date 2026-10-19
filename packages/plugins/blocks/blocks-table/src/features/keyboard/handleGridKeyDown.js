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

import getNextCell from './getNextCell.js';

function activate({ event, api, cell, row, rowElement }) {
  if (row === -1) {
    if (cell.dataset.special === 'select') return api.actions.toggleAllRowsSelected?.();
    return api.actions.toggleSort?.({ key: cell.dataset.colKey, multi: event.shiftKey });
  }
  return api.actions.activateRow?.({ id: rowElement.dataset.rowKey, event });
}

function handleGridKeyDown(event, api) {
  if (!api.config.keyboard) return false;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || !api.contains(cell)) return false;
  if (event.target !== cell) {
    // Keys typed into a control inside a cell belong to the control; Escape returns to the grid.
    if (event.key !== 'Escape') return false;
    cell.focus();
    return true;
  }
  const rowElement = cell.closest('[data-row-index]');
  const row = Number(rowElement.dataset.rowIndex);
  const col = Number(cell.dataset.colIndex);
  if (event.key === ' ') {
    if (row < 0 || !api.config.rowSelection) return false;
    event.preventDefault();
    api.actions.toggleRowSelected({ id: rowElement.dataset.rowKey });
    return true;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    activate({ event, api, cell, row, rowElement });
    return true;
  }
  const next = getNextCell({ event, api, row, col });
  if (!next) return false;
  event.preventDefault();
  api.keyboard.moveTo(next);
  return true;
}

export default handleGridKeyDown;
