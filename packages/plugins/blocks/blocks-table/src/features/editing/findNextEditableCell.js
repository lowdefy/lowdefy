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

import isCellEditable from './isCellEditable.js';

// Tab / Shift+Tab from an editor: the next editable cell in display order, along the row and
// then on to the next row (the previous one for -1). Row-level `editable.when` is tested per
// row. Returns { rowIndex, colIndex, rowId, colKey } or null at the end of the table.
function findNextEditableCell({ rows, cols, specs, rowIndex, colIndex, direction }) {
  let r = rowIndex;
  let c = colIndex;
  const total = rows.length * cols.length;
  for (let step = 0; step < total; step++) {
    c += direction;
    if (c >= cols.length) {
      c = 0;
      r += 1;
    } else if (c < 0) {
      c = cols.length - 1;
      r -= 1;
    }
    if (r < 0 || r >= rows.length) return null;
    const col = cols[c];
    if (col.special) continue;
    const row = rows[r];
    const spec = specs.get(col.key);
    if (isCellEditable({ spec, row: row.original, value: col.accessor(row.original) })) {
      return { rowIndex: r, colIndex: c, rowId: row.id, colKey: col.key };
    }
  }
  return null;
}

export default findNextEditableCell;
