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

import { COLUMN_GAP } from '../geometry.js';
import columnWidth from './columnWidth.js';
import translateNode from './translateNode.js';
import unbreakableHeight, { GROUP_HEIGHT_LIMIT } from './unbreakableHeight.js';

function translateRow(node, ctx) {
  const { children, widths } = node;
  // pdfmake takes the gaps out of the row before it resolves the column widths
  // (layoutBuilder subtracts `(gaps.length - 1) * columnGap`, then percentages
  // are taken of what is left), so a child sized against the full row is drawn a
  // few points into the gutter. Size against what the column will actually get.
  // The count is of children, not of surviving columns, so a row with a skipped
  // image over-reserves one gap — narrower than it needs to be, never wider.
  const gutters = Math.max(children.length - 1, 0) * COLUMN_GAP;
  const rowWidth = Math.max(ctx.contentWidth - gutters, 0);
  // pdfmake columns break independently, so two side-by-side [heading, chart]
  // cells left both headings at the foot of one page and both charts on the
  // next; assembleContent's grouping never sees inside a row. A row holding an
  // unbreakable cell moves as one block, under the same page-share cap.
  const holdsUnbreakable = children.some((child) => unbreakableHeight(child) !== undefined);
  const unbreakable =
    holdsUnbreakable && unbreakableHeight(node) <= ctx.contentHeight * GROUP_HEIGHT_LIMIT;
  return {
    margin: [0, 0, 0, 8],
    columnGap: COLUMN_GAP,
    ...(unbreakable ? { unbreakable: true } : {}),
    // A child may translate to null (a skipped image); drop its column and keep
    // the remaining columns at their original widths.
    columns: children
      .map((child, index) => {
        const width = widths[index];
        // Narrow the context to the cell: a table or divider inside a row must
        // size to its column, not to the full page width. A content-sized or
        // filling column has no width until pdfmake lays the row out, so those
        // children keep the row's width as an upper bound.
        const cellWidth = type.isNumber(width) ? rowWidth * width : rowWidth;
        const translated = translateNode(child, { ...ctx, contentWidth: cellWidth });
        if (translated === null) return null;
        return { ...translated, width: columnWidth(width) };
      })
      .filter((column) => column !== null),
  };
}

export default translateRow;
