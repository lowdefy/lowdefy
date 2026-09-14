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

// The one place the report page geometry lives. The walker sizes columns
// against it, the PDF translator lays pages out with it, and the two must agree
// or a chart rendered at a column width overflows the column pdfmake gives it.
// Sizes are PostScript points. Margins are fixed rather than configurable until
// a concrete need for per-report margins exists.

export const PAGE_SIZES = {
  a4: { name: 'A4', width: 595.28, height: 841.89 },
  letter: { name: 'LETTER', width: 612, height: 792 },
};

// [left, top, right, bottom]. Top and bottom leave room for the header and
// footer bands.
export const PAGE_MARGINS = [40, 60, 40, 50];

// The gutter between the columns of a `row`. pdfmake takes the gutters out of
// the row's width before resolving column widths, so anything sized against a
// column has to subtract them too.
export const COLUMN_GAP = 8;

// A4 portrait content width: the fallback when a caller passes no geometry.
export const DEFAULT_CONTENT_WIDTH = PAGE_SIZES.a4.width - PAGE_MARGINS[0] - PAGE_MARGINS[2];

export function pageSizeOf(report = {}) {
  return PAGE_SIZES[String(report.size ?? 'A4').toLowerCase()] ?? PAGE_SIZES.a4;
}

export function orientationOf(report = {}) {
  return report.orientation === 'landscape' ? 'landscape' : 'portrait';
}

// Content width in points for a report's page geometry: the page width for the
// chosen size and orientation minus the left and right margins.
export function contentWidthOf(report = {}) {
  const size = pageSizeOf(report);
  const pageWidth = orientationOf(report) === 'landscape' ? size.height : size.width;
  return pageWidth - PAGE_MARGINS[0] - PAGE_MARGINS[2];
}

// Content height in points, the page height minus the header and footer bands.
export function contentHeightOf(report = {}) {
  const size = pageSizeOf(report);
  const pageHeight = orientationOf(report) === 'landscape' ? size.width : size.height;
  return pageHeight - PAGE_MARGINS[1] - PAGE_MARGINS[3];
}

// The width each of `count` columns in a row can draw into once pdfmake has
// removed the gutters between them. Fraction columns take their share of it,
// flex columns an equal share.
export function columnWidthOf({ availableWidth, count, fraction }) {
  const gutters = Math.max(count - 1, 0) * COLUMN_GAP;
  const rowWidth = Math.max(availableWidth - gutters, 0);
  if (fraction === undefined) return rowWidth / Math.max(count, 1);
  return rowWidth * fraction;
}
