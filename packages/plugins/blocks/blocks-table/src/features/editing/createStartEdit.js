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
import findRow from '../../core/findRow.js';

const SEEDED_KINDS = new Set(['text', 'number', 'select', 'multiSelect']);

let sessionCounter = 0;

// Opens the one editor (tier-1 lazy mount) on a cell addressed by row id and column key. A cell
// already editing elsewhere commits first; when that commit fails validation, its editor stays
// and the new one does not open. Returns whether the editor opened.
function createStartEdit(api) {
  return function startEdit({ rowId, colKey, seed }) {
    const { layer, specs } = api.editing;
    if (!layer) return false;
    const current = layer.getSession();
    if (current) {
      if (current.rowId === rowId && current.colKey === colKey) return true;
      if (!api.actions.commitEdit({})) return false;
    }
    const row = findRow({ table: api.table, id: rowId });
    const col = api.layout.byKey.get(colKey);
    if (!row || !col || col.special) return false;
    const spec = specs.get(colKey);
    if (!isCellEditable({ spec, row: row.original, value: col.accessor(row.original) })) {
      return false;
    }
    sessionCounter += 1;
    layer.setSession({
      colKey,
      error: null,
      id: sessionCounter,
      rowId,
      seed: SEEDED_KINDS.has(spec.kind) ? seed : undefined,
    });
    return true;
  };
}

export default createStartEdit;
