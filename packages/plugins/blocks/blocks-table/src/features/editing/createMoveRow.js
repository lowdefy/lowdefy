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

import applyMoveToChanges from './applyMoveToChanges.js';
import computeRowMove from './computeRowMove.js';
import getDataGap from './getDataGap.js';
import findRow from '../../core/findRow.js';

// A row move from a drag drop or Alt+Shift+Arrow, on the rows in display order. Moves are only
// offered while the display order is the data order (or the position order), so the move's
// neighbours are the row's neighbours in the saved order. The move is computed over every data
// row (`api.dataRows`), not only the current page, so its indices, neighbours, key order and
// positions hold for the whole list. TableInput records the move in its changeset; Table saves it
// through onRowMove. Returns the move, or null when nothing moved.
function createMoveRow(api) {
  return function moveRow({ rowId, gap }) {
    const { editing } = api;
    if (!editing.options.rowDrag || editing.reorderBlock.get()) return null;
    const row = findRow({ table: api.table, id: rowId });
    if (!row) return null;
    const move = computeRowMove({
      rows: api.dataRows.map((dataRow) => dataRow.original),
      getKey: api.config.getKey,
      positionField: editing.options.positionField,
      rowKey: rowId,
      gap: getDataGap({ api, gap }),
    });
    if (!move) return null;
    api.actions.cancelEdit({ refocus: false });
    if (editing.input) {
      const changes = applyMoveToChanges({
        changes: editing.changes,
        move,
        positionField: editing.options.positionField,
        dataByKey: editing.getDataByKey(),
      });
      api.actions.writeChanges({ changes, cause: 'move', rowKey: move.rowKey });
    } else {
      api.actions.saveRowMove({ move, row: row.original });
    }
    return move;
  };
}

export default createMoveRow;
