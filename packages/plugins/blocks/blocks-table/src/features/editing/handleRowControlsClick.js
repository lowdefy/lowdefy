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

import { ROW_CONTROLS_KEY } from './rowControlsColumn.js';

// Clicks in the row controls column are the controls': the delete button removes the row, and
// no click there selects the row or fires onRowClick (the end of a drag is a click too).
function handleRowControlsClick(event, api) {
  const cell = event.target.closest(`[data-lf-cell][data-col-key="${ROW_CONTROLS_KEY}"]`);
  if (!cell || !api.contains(cell)) return false;
  if (event.target.closest('[data-lf-row-delete]')) {
    const rowElement = cell.closest('[data-row-key]');
    if (rowElement) api.actions.deleteRow({ rowId: rowElement.dataset.rowKey });
  }
  return true;
}

export default handleRowControlsClick;
