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
 * IR the PDF uses: only `table` nodes cross into a workbook, one worksheet per
 * table, in document order. Everything else about the page — headings, prose,
 * charts, page-break policy, pdf options — is a deliberate no-op for xlsx.
 *
 * The one deliberate difference from PDF: each cell writes its raw typed
 * `value` (ExcelJS stores real numbers, dates, and booleans natively), never
 * the `formatted` display string. A grid showing "12.5%" exports as `0.125`,
 * usable in formulas, rather than as text that merely looks right. Excel-side
 * number formats (`numFmt`) can be layered on if a concrete need arrives.
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

// Collect `table` nodes in document order, descending into the `row`/`stack`
// containers the walker nests them in. Filtering (`visible:`/`exclude`) has
// already run in the walker, so every table reached here belongs in the output.
function collectTables(nodes, tables = []) {
  for (const node of nodes ?? []) {
    if (!node || typeof node !== 'object') continue;
    if (node.kind === 'table') {
      tables.push(node);
    } else if (node.kind === 'row' || node.kind === 'stack') {
      collectTables(node.children, tables);
    }
  }
  return tables;
}

// Map a row of IR cells to the raw typed values ExcelJS writes. `undefined`
// becomes `null` so a sparse row keeps its column alignment.
function rowValues(cells) {
  return (cells ?? []).map((c) => (c?.value === undefined ? null : c.value));
}

/**
 * Project the report IR into an xlsx workbook Buffer.
 *
 * One worksheet per `table` node, named from its `sheetName` (the walker
 * resolves the `report.sheetName` hint, else the source blockId, into this
 * field) — sanitized and de-duplicated. The header row is bold; data rows write
 * each cell's raw typed `value`.
 *
 * Zero tables is an error, never an empty workbook: an empty file delivered on a
 * schedule is a silent failure.
 *
 * @param {IRNode[]} nodes The walked IR node list.
 * @returns {Promise<Buffer>} The xlsx bytes.
 */
async function toXlsx(nodes) {
  const tables = collectTables(nodes);
  if (tables.length === 0) {
    throw new ConfigError('Report page has no tables to export as xlsx.');
  }

  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set();

  for (const table of tables) {
    const name = uniqueSheetName(sanitizeSheetName(table.sheetName), usedNames);
    const sheet = workbook.addWorksheet(name);

    const header = rowValues(table.header);
    if (header.length > 0) {
      const headerRow = sheet.addRow(header);
      headerRow.font = { bold: true };
    }
    for (const dataRow of table.rows ?? []) {
      sheet.addRow(rowValues(dataRow));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

export default toXlsx;
export { toXlsx };
