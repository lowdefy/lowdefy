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

import { MUTED } from './styles.js';

// A grid is worksheet data, so the document names it and its size instead of
// printing it (see the `grid` node in ir/nodes.js). Without this line a section
// heading would introduce nothing at all, which reads as a broken report.
function translateGrid(node, ctx) {
  const rowCount = node.rows.length;
  const label = node.sheetName ? `'${node.sheetName}'` : 'This table';
  if (type.isFunction(ctx.logger?.debug)) {
    ctx.logger.debug(
      { sheetName: node.sheetName, rows: rowCount },
      `Report grid ${label} (${rowCount} rows) is exported to xlsx, not rendered in the PDF.`
    );
  }
  const noun = rowCount === 1 ? 'row' : 'rows';
  return {
    text: `${label} — ${rowCount} ${noun}, included in the Excel export.`,
    italics: true,
    color: MUTED,
    margin: [0, 0, 0, 8],
  };
}

export default translateGrid;
