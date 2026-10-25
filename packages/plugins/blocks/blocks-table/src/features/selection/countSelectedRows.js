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

import isRowSelectable from './isRowSelectable.js';

// Counts against the filtered rows that `rowSelection.selectable` allows, the set the header
// checkbox selects (TanStack's select-all toggles the pre-grouped rows, which come after
// filtering), so "all selected" means all the selectable rows the filter shows. In server mode filtering is manual, so these are the loaded rows; an
// `{ all: true, except }` selection is told apart by `selectionMode` (getSelectAllState).
function countSelectedRows({ api }) {
  const { rows } = api.table.getFilteredRowModel();
  const selection = api.state.rowSelection;
  let selectedCount = 0;
  let total = 0;
  rows.forEach((row) => {
    if (!isRowSelectable({ api, original: row.original })) return;
    total += 1;
    if (selection[row.id] === true) selectedCount += 1;
  });
  return { selectedCount, total };
}

export default countSelectedRows;
