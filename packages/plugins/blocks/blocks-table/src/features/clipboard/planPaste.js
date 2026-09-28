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

import coerceCellValue from '../editing/coerceCellValue.js';
import isCellEditable from '../editing/isCellEditable.js';
import setRowField from '../editing/setRowField.js';
import validateCellValue from '../editing/validateCellValue.js';

// Maps a pasted TSV grid onto the table from the focused cell: row i of the grid lands on the
// i-th display row below it, column j on the j-th layout column to its right. Each target is
// resolved to its row key (never its display index), coerced to the column's type and
// validated. Cells that cannot take their text are skipped with the reason, never half-written.
// Returns { updates: [{ rowKey, field, value }], skipped: [{ rowKey, column, text, reason }] }.
function planPaste({ grid, rows, cols, specs, getKey, startRow, startCol }) {
  const updates = [];
  const skipped = [];
  grid.forEach((line, i) => {
    const row = rows[startRow + i];
    line.forEach((text, j) => {
      const col = cols[startCol + j];
      if (!row || !col || col.special) {
        skipped.push({
          rowKey: null,
          column: col?.key ?? null,
          text,
          reason: 'Outside the table.',
        });
        return;
      }
      const rowKey = getKey(row.original);
      const spec = specs.get(col.key);
      const previous = col.accessor(row.original);
      if (!isCellEditable({ spec, row: row.original, value: previous })) {
        skipped.push({ rowKey, column: col.key, text, reason: 'Not editable.' });
        return;
      }
      const coerced = coerceCellValue({ spec, text, previous });
      if (coerced.error) {
        skipped.push({ rowKey, column: col.key, text, reason: coerced.error });
        return;
      }
      const nextRow = setRowField({ row: row.original, field: spec.field, value: coerced.value });
      const message = validateCellValue({ spec, row: nextRow, value: coerced.value });
      if (message !== null) {
        skipped.push({ rowKey, column: col.key, text, reason: message });
        return;
      }
      updates.push({ rowKey, field: spec.field, value: coerced.value });
    });
  });
  return { updates, skipped };
}

export default planPaste;
