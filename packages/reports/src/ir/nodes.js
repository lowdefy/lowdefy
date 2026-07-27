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
 * Block `./static` renderers emit these nodes; only `@lowdefy/reports`
 * translates them to pdfmake or ExcelJS. The node set is closed: there is no
 * extension hook and no custom kinds. A renderer that needs something new must
 * add a kind here (bumping IR_VERSION) — the design's "one correct way"
 * contract. `validateNode` throws a ConfigError naming any unknown kind so
 * plugin authors find out in dev.
 */

import { ConfigError } from '@lowdefy/errors';

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

const KIND_SET = new Set(NODE_KINDS);

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
 * A markdown string, translated centrally by `@lowdefy/reports` (remark).
 * Renderers emit the evaluated markdown source, never a pre-parsed tree.
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
 * A single table cell. `value` is the raw typed datum (number, date, string,
 * boolean, or null); `formatted` is the display string when a formatter ran.
 * PDF renders `formatted ?? value`; xlsx writes the typed `value`.
 */
export function cell(value, formatted) {
  return { value, ...(formatted !== undefined ? { formatted } : {}) };
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
 * A horizontal group. `children` are laid out side by side; `widths` holds the
 * width fraction (span/24) for each child, parallel to `children`.
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

// --- Validation -------------------------------------------------------------

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateCell(cellNode, kind) {
  if (!isObject(cellNode) || !Object.prototype.hasOwnProperty.call(cellNode, 'value')) {
    throw new ConfigError(
      `Invalid report IR '${kind}' cell: expected an object with a 'value' property.`
    );
  }
  if (cellNode.formatted !== undefined && typeof cellNode.formatted !== 'string') {
    throw new ConfigError(
      `Invalid report IR '${kind}' cell: 'formatted' must be a string when present.`
    );
  }
}

/**
 * Validate an IR node (recursively). Throws a ConfigError naming the offending
 * kind on any unknown kind, and validates table cell shape and container
 * children. Returns the node so callers can validate-and-pass in one step.
 */
export function validateNode(node) {
  if (!isObject(node) || typeof node.kind !== 'string') {
    throw new ConfigError('Invalid report IR node: expected an object with a string kind.');
  }
  const { kind } = node;
  if (!KIND_SET.has(kind)) {
    throw new ConfigError(`Unknown report IR node kind '${kind}'.`);
  }
  if (kind === 'grid' || kind === 'table') {
    for (const headerCell of node.header ?? []) {
      validateCell(headerCell, kind);
    }
    for (const dataRow of node.rows ?? []) {
      for (const dataCell of dataRow ?? []) {
        validateCell(dataCell, kind);
      }
    }
  }
  if (kind === 'row' || kind === 'stack') {
    for (const child of node.children ?? []) {
      validateNode(child);
    }
  }
  return node;
}

/** Validate a list of IR nodes, returning it unchanged. */
export function validateNodes(nodes) {
  for (const node of nodes) {
    validateNode(node);
  }
  return nodes;
}
