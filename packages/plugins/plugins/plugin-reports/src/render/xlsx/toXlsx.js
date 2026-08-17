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
 * The one module that knows ExcelJS. Excel output is a projection of the same
 * IR the PDF uses: only `grid` nodes cross into a workbook, one worksheet per
 * grid, in document order. Everything else about the page — headings, prose,
 * charts, presentational tables, page-break policy, pdf options — is a
 * deliberate no-op for xlsx.
 *
 * The one deliberate difference from PDF: each cell writes its raw typed
 * `value` (ExcelJS stores real numbers, dates, and booleans natively), never
 * the `formatted` display string. A grid showing "12.5%" exports as `0.125`,
 * usable in formulas, rather than as text that merely looks right.
 *
 * Dates get one conversion on top of that: an ISO-8601 string becomes a real
 * date cell, because JSON requests deliver dates as strings and a text cell
 * cannot be filtered, sorted by month, or fed to a formula. Only the two
 * unambiguous ISO shapes convert — see `toExcelDate`.
 */

import { ConfigError } from '@lowdefy/errors';

// ExcelJS is CommonJS. Under Node's ESM interop a default import binds to
// `module.exports`, which carries `Workbook` directly.
import ExcelJS from 'exceljs';

// Excel forbids these characters in a worksheet name, and caps names at 31
// characters. Sheet-name hints arrive build-validated, but sanitize defensively
// anyway so a hand-edited artifact can never make ExcelJS throw mid-write.
const ILLEGAL_SHEET_CHARS = /[[\]:*?/\\]/g;
const MAX_SHEET_NAME = 31;
const DEFAULT_SHEET_NAME = 'Sheet';

// Strip the illegal characters, trim, fall back to a default when nothing is
// left, then cap at Excel's 31-character limit.
function sanitizeSheetName(name) {
  const cleaned = String(name ?? '')
    .replace(ILLEGAL_SHEET_CHARS, '')
    .trim();
  const base = cleaned.length > 0 ? cleaned : DEFAULT_SHEET_NAME;
  return base.slice(0, MAX_SHEET_NAME);
}

// De-duplicate a sanitized name with a numeric suffix — `Sales`, `Sales (2)` —
// keeping the result within the 31-character cap by trimming the base first.
function uniqueSheetName(name, used) {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  let counter = 2;
  let candidate;
  do {
    const suffix = ` (${counter})`;
    candidate = `${name.slice(0, MAX_SHEET_NAME - suffix.length)}${suffix}`;
    counter += 1;
  } while (used.has(candidate));
  used.add(candidate);
  return candidate;
}

// Collect `grid` nodes in document order, descending into the `row`/`stack`
// containers the walker nests them in. Filtering (`visible:`/`exclude`) has
// already run in the walker, so every grid reached here belongs in the output.
function collectGrids(nodes, grids = []) {
  for (const node of nodes ?? []) {
    if (!node || typeof node !== 'object') continue;
    if (node.kind === 'grid') {
      grids.push(node);
    } else if (node.kind === 'row' || node.kind === 'stack') {
      collectGrids(node.children, grids);
    }
  }
  return grids;
}

// --- Dates -------------------------------------------------------------------

// Only these two shapes become dates. Anything looser is a trap: JS reads
// '12/07/2026' as December 7th (or July 12th, depending on where you live) and
// the product code '1-2' as January 2001 — the spreadsheet-eats-your-data bug
// this refuses to reproduce. An unrecognised string stays text.
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?$/;

// Locale-neutral and sorts as it reads. ExcelJS otherwise leaves a date cell on
// Excel's built-in format 14 ('mm-dd-yy'), which is both US-centric and
// ambiguous.
const DATE_FORMAT = 'yyyy-mm-dd';
const DATETIME_FORMAT = 'yyyy-mm-dd hh:mm';

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

/** A date carrying no time of day reads better without a 00:00 on the end. */
const isUtcMidnight = (date) =>
  date.getUTCHours() === 0 &&
  date.getUTCMinutes() === 0 &&
  date.getUTCSeconds() === 0 &&
  date.getUTCMilliseconds() === 0;

/**
 * A cell value as a real Excel date, or undefined to leave it as it is.
 *
 * ExcelJS writes UTC-based serials, so a UTC instant lands on the same calendar
 * date in Excel with no timezone compensation. A datetime that names no zone is
 * read as UTC rather than as server-local time: the report has no timezone
 * context, and the cell should show the clock time the source string states.
 */
function toExcelDate(value) {
  if (value instanceof Date) {
    return isValidDate(value) ? { date: value, dateOnly: isUtcMidnight(value) } : undefined;
  }
  if (typeof value !== 'string') return undefined;

  if (ISO_DATE_ONLY.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    // JS rolls '2026-02-31' forward to March 3rd, so only keep a date that says
    // what it was given.
    if (!isValidDate(date) || !date.toISOString().startsWith(value)) return undefined;
    return { date, dateOnly: true };
  }

  if (ISO_DATETIME.test(value)) {
    const zoned = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
    const date = new Date(zoned ? value : `${value.replace(' ', 'T')}Z`);
    return isValidDate(date) ? { date, dateOnly: false } : undefined;
  }

  return undefined;
}

// A header names a column, so it stays text even when it reads like a date — the
// columns of a monthly pivot are '2026-01-01', '2026-02-01', … and converting
// them gave the header row date serials and number formats, leaving the sheet
// with no readable labels to filter or sort by.
function headerValues(cells) {
  return (cells ?? []).map((c) => (c?.value === undefined ? null : c.value));
}

/**
 * A data row as the values ExcelJS writes and the number format each cell needs:
 * raw and typed, with an ISO date becoming a real date cell. `undefined` becomes
 * `null` so a sparse row keeps its column alignment. One pass over the row, since
 * date parsing is the expensive part and a grid runs to hundreds of rows.
 */
function dataRowCells(cells) {
  const values = [];
  const formats = [];
  for (const cell of cells ?? []) {
    if (cell?.value === undefined) {
      values.push(null);
      formats.push(undefined);
      continue;
    }
    const converted = toExcelDate(cell.value);
    values.push(converted?.date ?? cell.value);
    if (!converted) {
      formats.push(undefined);
    } else {
      formats.push(converted.dateOnly ? DATE_FORMAT : DATETIME_FORMAT);
    }
  }
  return { values, formats };
}

/**
 * Project the report IR into an xlsx workbook Buffer.
 *
 * One worksheet per `grid` node, named from its `sheetName` (the walker resolves
 * the `report.sheetName` hint, else the source blockId, into this field) —
 * sanitized and de-duplicated. The header row is bold text; data rows write each
 * cell's raw typed `value`.
 *
 * Zero grids is an error, never an empty workbook: an empty file delivered on a
 * schedule is a silent failure.
 *
 * @param {IRNode[]} nodes The walked IR node list.
 * @returns {Promise<Buffer>} The xlsx bytes.
 */
async function toXlsx(nodes) {
  const grids = collectGrids(nodes);
  if (grids.length === 0) {
    throw new ConfigError('Report page has no grids to export as xlsx.');
  }

  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set();

  for (const grid of grids) {
    const name = uniqueSheetName(sanitizeSheetName(grid.sheetName), usedNames);
    const sheet = workbook.addWorksheet(name);

    const header = headerValues(grid.header);
    if (header.length > 0) {
      const headerRow = sheet.addRow(header);
      headerRow.font = { bold: true };
    }
    for (const dataRow of grid.rows ?? []) {
      const { values, formats } = dataRowCells(dataRow);
      const row = sheet.addRow(values);
      formats.forEach((numFmt, index) => {
        if (numFmt) row.getCell(index + 1).numFmt = numFmt;
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

export default toXlsx;
export { toXlsx };
