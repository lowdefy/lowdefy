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

import { HEADER_FILL } from '../styles.js';
import inlineNodes from './inlineNodes.js';
import textContent from './textContent.js';

// One GFM table row as pdfmake cells, padded so every row has the same cell
// count (pdfmake requires it).
function tableRow({ row, isHeader, columnCount, align, state }) {
  const headerStyle = isHeader ? { bold: true, fillColor: HEADER_FILL } : {};
  const cells = (row.children ?? []).map((cell, index) => {
    const items = inlineNodes(cell.children, {}, state);
    const alignment = align[index];
    return textContent(items.length === 0 ? [{ text: '' }] : items, {
      ...headerStyle,
      ...(alignment ? { alignment } : {}),
    });
  });
  while (cells.length < columnCount) {
    cells.push({ text: '', ...headerStyle });
  }
  return cells;
}

export default tableRow;
