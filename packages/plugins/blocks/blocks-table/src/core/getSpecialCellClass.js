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

// The class of a special column's cells, in the header and in every row, so a header control
// (the select-all checkbox) lines up with the rows' (the row checkboxes): the column's own
// `cellClassName`, or `lf-table-select` (centred, no padding).
function getSpecialCellClass(col) {
  return `lf-table-gridcell ${col.cellClassName ?? 'lf-table-select'}`;
}

export default getSpecialCellClass;
