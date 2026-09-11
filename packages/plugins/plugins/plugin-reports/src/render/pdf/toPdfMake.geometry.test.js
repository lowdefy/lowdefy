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

/**
 * Does pdfmake still lay a row out where we think it does?
 *
 * `translateRow` sizes a row's children against `contentWidth` minus the
 * gutters, because pdfmake subtracts `(gaps.length - 1) * columnGap` from the
 * row before it resolves percentage widths. That ordering is an internal detail
 * of pdfmake's layout builder, not a documented contract — and the unit test
 * beside this one ("a table inside a row sizes to its column, gutters removed",
 * toPdfMake.test.js) only proves our translator emits the widths we intended.
 * It would pass unchanged if pdfmake stopped subtracting the gutters, while
 * every multi-column report silently gained a few points of overflow.
 *
 * So this file asserts pdfmake's own output: it runs the real render path and
 * reads the positions the layout builder computed. If a pdfmake upgrade moves
 * that arithmetic, this fails and names the reason, instead of the change
 * reaching users as columns creeping past the right margin.
 *
 * It lives apart from toPdfMake.test.js because it patches a pdfmake prototype
 * to capture the laid-out pages, which is process-global state.
 */

import LayoutBuilderModule from 'pdfmake/js/LayoutBuilder.js';

import { row, text } from '../../ir/nodes.js';
import { contentWidthOf, renderPdfBuffer } from './toPdfMake.js';

// Mirrors COLUMN_GAP in toPdfMake.js. Deliberately restated rather than
// exported: this test is a check on the arithmetic, so it should fail if the
// gap changes without the expectations being revisited.
const COLUMN_GAP = 8;

const LayoutBuilder = LayoutBuilderModule.default ?? LayoutBuilderModule;

/**
 * Render `nodes` through the production path and return the first page as the
 * layout builder positioned it.
 */
async function layoutFirstPage(nodes, report = {}) {
  const original = LayoutBuilder.prototype.layoutDocument;
  let pages;
  LayoutBuilder.prototype.layoutDocument = function captureLayout(...args) {
    pages = original.apply(this, args);
    return pages;
  };
  try {
    await renderPdfBuffer(nodes, report);
  } finally {
    LayoutBuilder.prototype.layoutDocument = original;
  }
  return pages[0];
}

/** The x position of the line drawing `content`, as laid out. */
function lineX(page, content) {
  const line = page.items.find(
    (item) =>
      item.type === 'line' &&
      (item.item.inlines ?? []).map((inline) => inline.text).join('') === content
  );
  if (!line) throw new Error(`No laid-out line found for "${content}".`);
  return line.item.x;
}

test('pdfmake resolves row percentages after removing the gutters', async () => {
  const page = await layoutFirstPage([
    row({ children: [text({ text: 'Left' }), text({ text: 'Right' })], widths: [0.5, 0.5] }),
  ]);

  const contentWidth = contentWidthOf({});
  const { left: leftMargin } = page.pageMargins;
  // Two columns, one gutter between them.
  const columnWidth = (contentWidth - COLUMN_GAP) / 2;

  // The first column opens at the left margin, the second one gutter later.
  expect(lineX(page, 'Left')).toBeCloseTo(leftMargin, 2);
  expect(lineX(page, 'Right')).toBeCloseTo(leftMargin + columnWidth + COLUMN_GAP, 2);

  // The consequence that matters: the row ends exactly on the right margin. Were
  // the percentages taken of the full content width instead, the second column
  // would run COLUMN_GAP points past it.
  expect(lineX(page, 'Right') + columnWidth).toBeCloseTo(leftMargin + contentWidth, 2);
});

test('a three-column row still ends on the right margin', async () => {
  const page = await layoutFirstPage([
    row({
      children: [text({ text: 'One' }), text({ text: 'Two' }), text({ text: 'Three' })],
      widths: [1 / 3, 1 / 3, 1 / 3],
    }),
  ]);

  const contentWidth = contentWidthOf({});
  const { left: leftMargin } = page.pageMargins;
  // Three columns leave two gutters — the case where an off-by-one gap count
  // would show up as double the drift.
  const columnWidth = (contentWidth - 2 * COLUMN_GAP) / 3;

  expect(lineX(page, 'One')).toBeCloseTo(leftMargin, 2);
  expect(lineX(page, 'Two')).toBeCloseTo(leftMargin + columnWidth + COLUMN_GAP, 2);
  expect(lineX(page, 'Three')).toBeCloseTo(leftMargin + 2 * (columnWidth + COLUMN_GAP), 2);
  expect(lineX(page, 'Three') + columnWidth).toBeCloseTo(leftMargin + contentWidth, 2);
});
