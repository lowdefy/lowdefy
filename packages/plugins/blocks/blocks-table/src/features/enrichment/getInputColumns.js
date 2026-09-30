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

import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';

// The columns users type values into: `kind: input` and plain data columns (not computed, no
// run state, not buttons or menus). The new-row editor and the CSV import map to these.
function getInputColumns(columns) {
  return columns.filter(
    (column) =>
      (column.kind === 'input' || column.kind === undefined) &&
      column.stateField === undefined &&
      column.read === undefined &&
      CELL_TYPE_FAMILIES[column.type] !== 'action'
  );
}

export default getInputColumns;
