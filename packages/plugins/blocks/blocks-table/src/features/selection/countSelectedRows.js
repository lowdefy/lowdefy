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

// Counts against the filtered rows, the set the header checkbox selects (TanStack's select-all
// toggles the pre-grouped rows, which come after filtering), so "all selected" means all the rows
// the filter shows.
function countSelectedRows({ api }) {
  const { rows, rowsById } = api.table.getFilteredRowModel();
  const selection = api.state.rowSelection;
  let selectedCount = 0;
  Object.keys(selection).forEach((id) => {
    if (selection[id] === true && rowsById[id]) selectedCount += 1;
  });
  return { selectedCount, total: rows.length };
}

export default countSelectedRows;
