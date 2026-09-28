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

// Why rows cannot be reordered right now, or null when they can. A move is placed between the
// row's display neighbours, which are its neighbours in the saved order only while the table
// shows the data order: no grouping, no client filter, and no sort except ascending by the
// position field itself.
function getReorderBlock({ config, data, positionField, state, table }) {
  if ((state.grouping?.length ?? 0) > 0) return 'Rows cannot be reordered while grouped.';
  if (table.getRowModel().rows.length !== data.length) {
    return 'Clear the filter to reorder rows.';
  }
  const sorting = state.sorting ?? [];
  if (sorting.length === 0) return null;
  const positionColumn = positionField
    ? config.columns.find((column) => column.field === positionField)
    : null;
  const byPosition =
    Boolean(positionColumn) &&
    sorting.length === 1 &&
    sorting[0].id === positionColumn.key &&
    sorting[0].desc !== true;
  return byPosition ? null : 'Clear the sort to reorder rows.';
}

export default getReorderBlock;
