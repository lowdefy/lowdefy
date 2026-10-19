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

import findRowAction from './findRowAction.js';

// Single-key row actions (Linear-style): a button or menu item with `key: 'a'` fires when `a` is
// pressed on its focused row. Only a bare key on the cell itself counts: a key typed into an
// editor or control inside the cell belongs to it, and modified keys are shortcuts.
function handleRowActionKey(event, api) {
  if (event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return false;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || cell !== event.target || !api.contains(cell)) return false;
  const rowElement = cell.closest('[data-row-key]');
  if (!rowElement) return false;
  const id = rowElement.dataset.rowKey;
  const tableRow = api.table.getCoreRowModel().rowsById[id];
  if (!tableRow) return false;
  const visible = api.config.columns.filter(
    (column) => api.state.columnVisibility[column.key] !== false
  );
  const action = findRowAction({
    columns: visible,
    key: event.key,
    row: tableRow.original,
    rowKey: api.config.getKey(tableRow.original),
  });
  if (action === null) return false;
  event.preventDefault();
  const result = api.methods.triggerEvent(action);
  api.actions.afterRowAction({ id, result });
  return true;
}

export default handleRowActionKey;
