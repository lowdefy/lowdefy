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
 * The closed, versioned document intermediate representation (IR).
 *
 * Block `./static` renderers emit these nodes; only `@lowdefy/plugin-reports`
 * translates them to pdfmake or ExcelJS. The node set is closed: there is no
 * extension hook and no custom kinds. A renderer that needs something new must
 * add a kind here (bumping IR_VERSION). `validateNode` rejects any node the
 * translators could not render, so a renderer bug surfaces as a skipped block
 * with a message naming the rule rather than as a crash inside pdfmake.
 */

import { cell } from '@lowdefy/block-utils/report';

import validateNode from './validateNode.js';
import validateNodes from './validateNodes.js';

/**
 * IR node-set version. Bump when the closed node set changes so callers that
 * cache or serialise IR can detect a mismatch.
 */
export const IR_VERSION = 2;

/** Every kind the IR permits. Renderers cannot invent kinds outside this set. */
export const NODE_KINDS = Object.freeze([
  'heading',
  'text',
  'markdown',
  'svg',
  'image',
  'grid',
  'table',
  'stat',
  'row',
  'stack',
  'divider',
  'spacer',
]);

// --- Constructors -----------------------------------------------------------
// Each returns { kind, ...props }. Optional props are omitted when absent so
// nodes stay minimal and predictable.

/** A section heading. `level` (1–4) selects the heading size downstream. */
export function heading({ text, level }) {
  return { kind: 'heading', text, level };
}

/**
 * A prose paragraph. `tint` is an optional hint (e.g. an Alert severity) that a
 * renderer may map to a colour; plain text leaves it unset.
 */
export function text({ text, tint } = {}) {
  return { kind: 'text', text, ...(tint !== undefined ? { tint } : {}) };
}

/**
 * A markdown string, translated centrally by the plugin (remark). Renderers emit
 * the evaluated markdown source, never a pre-parsed tree.
 */
export function markdown({ markdown }) {
  return { kind: 'markdown', markdown };
}

/** A self-contained SVG string sized to `width`/`height` (points). */
export function svg({ svg, width, height }) {
  return { kind: 'svg', svg, width, height };
}

/**
 * An image referenced by `src`, resolved later by the central image resolver.
 * `width`/`height` (points) are optional.
 */
export function image({ src, width, height }) {
  return {
    kind: 'image',
    src,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };
}

/**
 * A data grid — the tabular output of a grid block. `header` is the header row
 * (an array of cells); `rows` is an array of data rows, each an array of cells.
 * `sheetName` is the xlsx worksheet name, attached by the walker.
 *
 * A grid is worksheet data, not document content: it goes to the xlsx workbook
 * and never into the PDF. Report data sets run to hundreds of rows and a dozen
 * columns — a shape a paginated document cannot show usefully, and one the
 * reader wants to sort and filter anyway. Tabular content that *is* meant to be
 * read in the document — a markdown table, a table in an Html block, a
 * label/value summary — is a `table`.
 */
export function grid({ header, rows, sheetName }) {
  return {
    kind: 'grid',
    header,
    rows,
    ...(sheetName !== undefined ? { sheetName } : {}),
  };
}

/**
 * A presentational table, rendered in the document: a label/value summary, or
 * any small table a block lays out for reading rather than for analysis. Same
 * shape as a `grid` minus the worksheet role — see `grid` for the split.
 */
export function table({ header, rows }) {
  return {
    kind: 'table',
    header,
    rows,
  };
}

/** A single statistic: a `label` and its (already formatted) display `value`. */
export function stat({ label, value }) {
  return { kind: 'stat', label, value };
}

/**
 * A horizontal group. `children` are laid out side by side; `widths` is parallel
 * to `children` and each entry is one of:
 *
 *   - a number in (0, 1] — that fraction of the row (a grid `span/24`)
 *   - `'auto'` — the child's content width (a flex child that does not grow)
 *   - `'fill'` — an equal share of whatever width the other children leave
 */
export function row({ children, widths }) {
  return { kind: 'row', children, widths };
}

/** A vertical group of `children`. */
export function stack({ children }) {
  return { kind: 'stack', children };
}

/** A horizontal rule. */
export function divider() {
  return { kind: 'divider' };
}

/** An empty horizontal gap of `width` fraction (span/24), used for offsets. */
export function spacer({ width }) {
  return { kind: 'spacer', width };
}

// `cell` is the shared block-utils helper, re-exported so the plugin and the
// block renderers build cells from one definition.
export { cell, validateNode, validateNodes };
