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

import findNextEditableCell from './findNextEditableCell.js';
import focusCell from './focusCell.js';
import fromEditorDraft from './fromEditorDraft.js';
import setRowField from './setRowField.js';
import validateCellValue from './validateCellValue.js';
import valuesEqual from './valuesEqual.js';
import scrollToCell from '../virtualization/scrollToCell.js';

function openNext({ api, next }) {
  scrollToCell({ api, row: next.rowIndex, col: next.colIndex });
  api.keyboard?.setActive({ row: next.rowIndex, col: next.colIndex });
  api.actions.startEdit({ rowId: next.rowId, colKey: next.colKey });
}

// Commits the open editor (Enter, Tab, blur, or a pick in a select, date, switch or rating).
// The draft is validated first: a failing `required` / `validate` keeps the editor open with the
// message and returns false. An unchanged value closes the editor without an event. Otherwise the
// editor closes and the value goes to the block: TableInput writes its rows, Table saves through
// onCellEdit. `move` (Tab: 1, Shift+Tab: -1) opens the next editable cell, found in display
// order before the write, so a re-sort caused by the edit does not change where Tab goes.
function createCommitEdit(api) {
  return function commitEdit({ move } = {}) {
    const { editing } = api;
    const session = editing.layer?.getSession();
    if (!session) return true;
    const row = api.table.getRow(session.rowId, true);
    const col = api.layout.byKey.get(session.colKey);
    if (!row || !col) {
      editing.layer.setSession(null);
      return true;
    }
    const spec = editing.specs.get(session.colKey);
    const previous = col.accessor(row.original);
    const draft = editing.layer.getDraft(session.id);
    const value = draft.has ? fromEditorDraft({ spec, draft: draft.value, previous }) : previous;
    const changed = !valuesEqual(value, previous);
    if (changed) {
      const nextRow = setRowField({ row: row.original, field: spec.field, value });
      const message = validateCellValue({ spec, row: nextRow, value });
      if (message !== null) {
        editing.layer.updateSession({ error: message });
        return false;
      }
    }
    const next = move
      ? findNextEditableCell({
          rows: api.rows,
          cols: api.layout.cols,
          specs: editing.specs,
          rowIndex: api.rows.findIndex((candidate) => candidate.id === session.rowId),
          colIndex: col.index,
          direction: move,
        })
      : null;
    editing.layer.setSession(null);
    if (changed) {
      const rowKey = api.config.getKey(row.original);
      if (editing.input) {
        api.actions.writeCell({ rowKey, field: spec.field, value });
      } else {
        api.actions.saveCellEdit({ row: row.original, rowKey, spec, value, previous });
      }
    }
    if (next) {
      openNext({ api, next });
    } else {
      focusCell({ api, rowId: session.rowId, colKey: session.colKey });
    }
    return true;
  };
}

export default createCommitEdit;
