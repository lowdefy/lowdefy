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

function applyEllipsis(colDef, ellipsis) {
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
    next.cellRenderer = createEllipsisCell(ellipsis);
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

function buildCellRenderer({ cell, methods }) {
  const Renderer = getCellRenderer(cell?.type);
  if (!Renderer) return undefined;
  // ag-grid calls the renderer as a React function component when returned directly.
  return function CellRendererAdapter(params) {
    return Renderer({ ...params, cellConfig: cell, methods });
  };
}

function recProcessColDefs(columnDefs, methods) {
  return columnDefs.map((col) => {
    const newColDef = {};
    if (type.isArray(col.children)) {
      newColDef.children = recProcessColDefs(col.children, methods);
    }
    if (type.isObject(col.cell) && type.isString(col.cell.type)) {
      const renderer = buildCellRenderer({ cell: col.cell, methods });
      if (renderer) {
        newColDef.cellRenderer = renderer;
      }
    } else if (type.isFunction(col.cellRenderer)) {
      newColDef.cellRenderer = (params) => {
        return renderHtml({
          html: col.cellRenderer(params),
          methods,
        });
      };
    }
    const merged = {
      ...col,
      ...newColDef,
    };
    // `cell` is our config object — ag-grid would ignore it, but strip to keep colDef clean.
    delete merged.cell;
    delete merged.ellipsis;
    const aligned = applyAlignment(merged, col.cell);
    return applyEllipsis(aligned, col.ellipsis);
  });
}

function processColDefs(columnDefs = [], methods) {
  return recProcessColDefs(columnDefs, methods);
}

export default processColDefs;
