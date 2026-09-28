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

import getExportValue from '../../core/getExportValue.js';
import serializeTsv from './serializeTsv.js';
import isDataItem from '../../core/isDataItem.js';

function cellText({ col, row }) {
  return getExportValue({
    column: col.column,
    value: col.accessor(row.original),
    row: row.original,
    formatted: true,
  });
}

// What Ctrl/Cmd+C copies (D11, D12): the selected rows when there is a selection (visible data
// columns in view order, rows in display order), otherwise the focused cell. Always the displayed
// text, as TSV, so it pastes into a spreadsheet cell for cell.
function getCopyText({ api, rowId, colKey }) {
  const cols = api.layout.cols.filter((col) => !col.special);
  const selection = api.state.rowSelection ?? {};
  const selected = api.config.rowSelection
    ? api.rows.filter((row) => isDataItem(row) && selection[row.id])
    : [];
  if (selected.length > 0) {
    return serializeTsv(selected.map((row) => cols.map((col) => cellText({ col, row }))));
  }
  const col = api.layout.byKey.get(colKey);
  if (!col || col.special) return null;
  if (rowId === null) return serializeTsv([[col.column.title]]);
  const row = api.table.getRow(rowId, true);
  if (!row) return null;
  return serializeTsv([[cellText({ col, row })]]);
}

export default getCopyText;
