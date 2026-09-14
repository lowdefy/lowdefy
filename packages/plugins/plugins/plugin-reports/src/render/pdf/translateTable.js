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

import cellText from './cellText.js';
import { HEADER_FILL } from './styles.js';

// Columns divide the available width evenly, as explicit points rather than
// pdfmake star columns: a star column is never narrower than its widest
// unbreakable token, so one long email or id grows the whole table past the page
// margin. Fixed widths wrap instead, which keeps every table on the page.
function translateTable(node, ctx) {
  const columnCount = node.header.length;
  const headerRow = node.header.map((cell) => ({
    text: cellText(cell),
    bold: true,
    fillColor: HEADER_FILL,
  }));
  const dataRows = node.rows.map((dataRow) => dataRow.map((cell) => ({ text: cellText(cell) })));
  // pdfmake's default cell padding is 4pt a side, so each column loses 8pt.
  const available = ctx.contentWidth - columnCount * 8;
  return {
    margin: [0, 0, 0, 8],
    table: {
      headerRows: 1,
      widths: Array(columnCount).fill(available / columnCount),
      body: [headerRow, ...dataRows],
    },
    layout: 'lightHorizontalLines',
  };
}

export default translateTable;
