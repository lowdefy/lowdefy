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
import getExportValue from '@lowdefy/blocks-antd/table/getExportValue.js';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import toCsvField from './toCsvField.js';

// The current client view: visible data columns in their displayed order (start-pinned, centre,
// end-pinned) and the data rows in their current (sorted, grouped) order, every page and the
// rows of collapsed groups included (`api.dataRows`). Values come from the shared column core
// (`formatted` gives the text the cell shows). Header titles lose their HTML; action columns
// (buttons, menu) hold no data and are left out.
function buildCsv({ api, formatted }) {
  const cols = api.layout.cols.filter(
    (col) => !col.special && CELL_TYPE_FAMILIES[col.column.type] !== 'action'
  );
  const lines = [cols.map((col) => toCsvField(htmlToText(col.column.title))).join(',')];
  api.dataRows.forEach((row) => {
    lines.push(
      cols
        .map((col) =>
          toCsvField(
            getExportValue({
              column: col.column,
              value: col.accessor(row.original),
              row: row.original,
              formatted,
            })
          )
        )
        .join(',')
    );
  });
  return lines.join('\r\n');
}

export default buildCsv;
