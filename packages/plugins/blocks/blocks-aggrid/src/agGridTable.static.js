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

import { get, type } from '@lowdefy/helpers';

// Every AgGrid variant (theme and input alike) shares this one `grid` renderer,
// re-exported per block type name from `static.js` so the walker can look it up
// by `block.type`. This module stays free of ag-grid and React so the server
// can load the registry without a browser runtime; it emits plain report-IR
// object literals, never pdfmake or ExcelJS objects. The IR shape is a stable,
// versioned contract and the walker validates every returned node.

/** Build a table cell: `value` is the raw datum, `formatted` the display string. */
function cell(value, formatted) {
  return { value, ...(formatted !== undefined ? { formatted } : {}) };
}

// The header label ag-grid shows: `headerName` when set, else the `field`.
function headerText(col) {
  const label = col.headerName ?? col.field;
  return type.isNone(label) ? '' : String(label);
}

// Resolve a cell's raw value. A `valueGetter` (a `_function` operator closure)
// overrides the `field` lookup; otherwise read `field` from the row, honouring
// ag-grid's dot-path field notation (`get` splits on '.').
function resolveValue({ col, data }) {
  if (type.isFunction(col.valueGetter)) {
    return col.valueGetter({ data, colDef: col });
  }
  if (type.isNone(col.field)) return undefined;
  return get(data, col.field);
}

// Build one cell: the raw typed `value`, plus a `formatted` display string when
// a `valueFormatter` runs. The formatter is a `_function` closure evaluated by
// the headless engine; ag-grid calls it with `{ value, data, colDef }`. If it
// throws — commonly by touching a browser API absent on the server — log a
// warning and fall back to the raw value with no `formatted`.
function buildCell({ col, data, blockId, logger }) {
  const value = resolveValue({ col, data });
  if (!type.isFunction(col.valueFormatter)) return cell(value);
  try {
    const formatted = col.valueFormatter({ value, data, colDef: col });
    if (type.isNone(formatted)) return cell(value);
    return cell(value, String(formatted));
  } catch (error) {
    logger?.warn?.(
      { blockId, field: col.field, error },
      `AgGrid report renderer: valueFormatter for column '${
        col.field ?? headerText(col)
      }' in block '${blockId}' threw; falling back to the raw value.`
    );
    return cell(value);
  }
}

/**
 * Shared static renderer for every AgGrid block variant: a grid becomes a `grid`
 * node, which the report exports as a worksheet rather than printing into the
 * PDF. Visible `columnDefs` (respecting `hide: true`) map to header cells and
 * each `rowData` row to a row of cells.
 *
 * Imperative grid state is ignored — client-side filtering and sorting do not
 * apply (the report is a fidelity snapshot of the configured data), so rows
 * emit in `rowData` order.
 */
export const agGridTable = {
  toReport: ({ block, context }) => {
    const { properties, blockId } = block;
    const columnDefs = type.isArray(properties?.columnDefs) ? properties.columnDefs : [];
    const rowData = type.isArray(properties?.rowData) ? properties.rowData : [];
    const columns = columnDefs.filter((col) => type.isObject(col) && col.hide !== true);
    if (columns.length === 0) return null;
    const logger = context?.logger;
    const header = columns.map((col) => cell(headerText(col)));
    const rows = rowData.map((data) =>
      columns.map((col) => buildCell({ col, data, blockId, logger }))
    );
    return { kind: 'grid', header, rows };
  },
};
