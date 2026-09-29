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

import removeChangeRow from './removeChangeRow.js';

// Deletes a TableInput row (the row controls' delete button, or Delete on a focused row with
// `deleteRows`). An editor open on that row closes without committing.
function createDeleteRow(api) {
  return function deleteRow({ rowId }) {
    const row = api.table.getRow(rowId, true);
    if (!row) return false;
    const rowKey = api.config.getKey(row.original);
    if (api.editing.layer?.getSession()?.rowId === rowId) {
      api.actions.cancelEdit({ refocus: false });
    }
    const changes = removeChangeRow({ changes: api.editing.changes, rowKey });
    return api.actions.writeChanges({ changes, cause: 'delete', rowKey });
  };
}

export default createDeleteRow;
