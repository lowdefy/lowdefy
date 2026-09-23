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

import { DEFAULT_CONTENT_WIDTH } from '../../geometry.js';
import { BLOCK_MARGIN } from './constants.js';
import tableRow from './tableRow.js';

// The first row is the header; columns share the width evenly as explicit
// points. Star columns would grow past the page margin around any long
// unbreakable token (a url, an id), so fixed widths wrap instead, the same rule
// toPdfMake applies to table nodes.
function tableBlock(node, state) {
  const rows = node.children ?? [];
  if (rows.length === 0) return [];
  const columnCount = rows.reduce((max, row) => Math.max(max, (row.children ?? []).length), 0);
  if (columnCount === 0) return [];
  const align = node.align ?? [];
  const [headerRow, ...bodyRows] = rows;
  // pdfmake's default cell padding is 4pt a side, so each column loses 8pt.
  const available = (state.contentWidth ?? DEFAULT_CONTENT_WIDTH) - columnCount * 8;
  return [
    {
      margin: BLOCK_MARGIN,
      table: {
        headerRows: 1,
        widths: Array(columnCount).fill(available / columnCount),
        body: [
          tableRow({ row: headerRow, isHeader: true, columnCount, align, state }),
          ...bodyRows.map((row) => tableRow({ row, isHeader: false, columnCount, align, state })),
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];
}

export default tableBlock;
