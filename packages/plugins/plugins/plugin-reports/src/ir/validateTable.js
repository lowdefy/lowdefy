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

import { type } from '@lowdefy/helpers';

import invalidNode from './invalidNode.js';
import validateCell from './validateCell.js';

// Shared by `grid` and `table`: a header of at least one cell, and every row
// exactly as wide as the header. pdfmake requires equal row widths and an empty
// body row crashes it, so ragged or empty tables are refused here where the
// block that produced them can be named.
function validateTable(node) {
  const { kind } = node;
  if (!type.isArray(node.header) || node.header.length === 0) {
    throw invalidNode(kind, "'header' must be an array of at least one cell.");
  }
  node.header.forEach((headerCell) => validateCell(headerCell, kind));
  if (!type.isArray(node.rows)) {
    throw invalidNode(kind, "'rows' must be an array of rows.");
  }
  node.rows.forEach((dataRow, index) => {
    if (!type.isArray(dataRow) || dataRow.length !== node.header.length) {
      throw invalidNode(
        kind,
        `row ${index} must be an array of ${node.header.length} cell(s) to match the header.`
      );
    }
    dataRow.forEach((dataCell) => validateCell(dataCell, kind));
  });
}

export default validateTable;
