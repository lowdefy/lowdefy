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

import applyChangeUpdates from '../editing/applyChangeUpdates.js';
import parseTsv from './parseTsv.js';
import planPaste from './planPaste.js';

function describeSkipped(skipped) {
  return skipped.map((cell) => `${cell.column ?? '(no column)'}: ${cell.reason}`).join('\n');
}

// TableInput paste: TSV from the clipboard into the editable cells from the focused cell on, as
// one write (one setValue, one onChange with cause `paste`, one undo step). Cells whose text does
// not fit their column are skipped: they are listed in the event's `skipped` and in a notice
// under the table.
function createPasteCells(api) {
  return function pasteCells({ text, rowIndex, colIndex }) {
    const grid = parseTsv(text);
    if (grid.length === 0) return false;
    const { updates, skipped } = planPaste({
      grid,
      rows: api.rows,
      cols: api.layout.cols,
      specs: api.editing.specs,
      getKey: api.config.getKey,
      startRow: rowIndex,
      startCol: colIndex,
    });
    if (skipped.length > 0) {
      const count = skipped.length;
      api.editing.layer?.notify({
        text: `${count} pasted ${count === 1 ? 'cell was' : 'cells were'} skipped.`,
        details: describeSkipped(skipped),
      });
    }
    const changes = applyChangeUpdates({
      changes: api.editing.changes,
      updates,
      dataByKey: api.editing.getDataByKey(),
    });
    return api.actions.writeChanges({ changes, cause: 'paste', event: { skipped } });
  };
}

export default createPasteCells;
