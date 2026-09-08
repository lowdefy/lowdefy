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

import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import { getCellRenderer } from './cellRenderers/index.js';
import createEllipsisCell from './cellRenderers/EllipsisCell.js';

function applyEllipsis(colDef, ellipsis, makeEllipsisRenderer) {
  if (!type.isInt(ellipsis) || ellipsis < 1) return colDef;
  const clampClass = `lf-ellipsis-${Math.min(ellipsis, 6)}`;
  const existingClass = colDef.cellClass;
  const nextClass = type.isString(existingClass)
    ? `${existingClass} ${clampClass}`
    : type.isArray(existingClass)
      ? [...existingClass, clampClass]
      : clampClass;
  const next = {
    ...colDef,
    wrapText: colDef.wrapText ?? true,
    autoHeight: colDef.autoHeight ?? true,
    cellClass: nextClass,
  };
  // Install a wrapping renderer that owns the clamp DOM — reliable against
  // ag-grid's internal cell wrappers. Skip if a cellRenderer is already set
  // (user or built-in cell.type takes precedence and can opt in via CSS).
  if (!colDef.cellRenderer) {
    next.cellRenderer = makeEllipsisRenderer();
  }
  return next;
}

const JUSTIFY_MAP = { left: 'flex-start', center: 'center', right: 'flex-end' };
const HEADER_ALIGN_CLASS = {
  left: 'ag-left-aligned-header',
  center: 'ag-center-aligned-header',
  right: 'ag-right-aligned-header',
};

function applyAlignment(colDef, cell) {
  if (!type.isObject(cell)) return colDef;
  const align = cell.align ?? (cell.type === 'number' ? 'right' : undefined);
  if (!align || !JUSTIFY_MAP[align]) return colDef;
  const cellStyle = { ...(type.isObject(colDef.cellStyle) ? colDef.cellStyle : {}) };
  if (type.isNone(cellStyle.justifyContent)) cellStyle.justifyContent = JUSTIFY_MAP[align];
  const headerClass = type.isString(colDef.headerClass)
    ? `${colDef.headerClass} ${HEADER_ALIGN_CLASS[align]}`
    : type.isArray(colDef.headerClass)
      ? [...colDef.headerClass, HEADER_ALIGN_CLASS[align]]
      : HEADER_ALIGN_CLASS[align];
  return { ...colDef, cellStyle, headerClass };
}

// A cellRenderer is a React element type, so a new function is a different
// component: CellCtrl.refreshCellRenderer bails when `cellRendererClass !==
// componentClass`, and the React cell comp re-keys. Building the renderers fresh on
// every render therefore unmounted every cell whenever anything re-rendered the
// block, destroying whatever a cell was holding — an open popup, a focused input, a
// half-typed value in the selector / textInput / paragraphInput cells.
//
// So the adapter installed on the colDef is created once per column and kept, and
// the closure it calls is replaced in place. ag-grid keeps the cell; the cell
// renders the current config.
function stableRenderer(entry, slot, render) {
  let stable = entry[slot];
  if (!stable) {
    const box = { render };
    // ag-grid calls the renderer as a React function component when returned directly.
    function CellRendererAdapter(params) {
      return box.render(params);
    }
    stable = { box, Adapter: CellRendererAdapter };
    entry[slot] = stable;
  }
  stable.box.render = render;
  return stable.Adapter;
}

// Keyed by colId or field so an adapter survives a column reorder, falling back to
// position for columns that declare neither. A key already taken in this pass gets a
// suffix, so two columns sharing a field do not share an adapter.
function colKey(col, index, prefix, seen) {
  const id = type.isString(col.colId)
    ? col.colId
    : type.isString(col.field)
      ? col.field
      : `${index}`;
  const base = `${prefix}${id}`;
  let key = base;
  let n = 1;
  while (seen.has(key)) {
    key = `${base}#${n}`;
    n += 1;
  }
  seen.add(key);
  return key;
}

function recProcessColDefs(columnDefs, methods, components, cache, seen, prefix) {
  return columnDefs.map((col, index) => {
    const key = colKey(col, index, prefix, seen);
    const entry = cache.get(key) ?? {};
    cache.set(key, entry);
    const newColDef = {};
    if (type.isArray(col.children)) {
      newColDef.children = recProcessColDefs(
        col.children,
        methods,
        components,
        cache,
        seen,
        `${key}/`
      );
    }
    if (type.isObject(col.cell) && type.isString(col.cell.type)) {
      const Renderer = getCellRenderer(col.cell.type);
      if (Renderer) {
        const cell = col.cell;
        newColDef.cellRenderer = stableRenderer(entry, 'cell', (params) =>
          Renderer({ ...params, cellConfig: cell, methods, components })
        );
      }
    } else if (type.isFunction(col.cellRenderer)) {
      const cellRenderer = col.cellRenderer;
      newColDef.cellRenderer = stableRenderer(entry, 'cell', (params) =>
        renderHtml({ html: cellRenderer(params), methods })
      );
    }
    const merged = {
      ...col,
      ...newColDef,
    };
    // `cell` is our config object — ag-grid would ignore it, but strip to keep colDef clean.
    delete merged.cell;
    delete merged.ellipsis;
    const aligned = applyAlignment(merged, col.cell);
    return applyEllipsis(aligned, col.ellipsis, () =>
      stableRenderer(entry, 'ellipsis', createEllipsisCell(col.ellipsis))
    );
  });
}

function processColDefs(columnDefs = [], methods, components, cache = new Map()) {
  const seen = new Set();
  const processed = recProcessColDefs(columnDefs, methods, components, cache, seen, '');
  // Drop columns that are no longer defined, so a grid whose columns come and go does
  // not accumulate adapters. A column that returns gets a fresh one, which is correct
  // — its cells were unmounted with it.
  for (const key of cache.keys()) {
    if (!seen.has(key)) cache.delete(key);
  }
  return processed;
}

export default processColDefs;
