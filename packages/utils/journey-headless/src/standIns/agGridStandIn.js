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

import { get, serializer, type } from '@lowdefy/helpers';

import createGridStandIn from './createGridStandIn.js';
import describeBlock from './describeBlock.js';
import findAgGridFeature from './findAgGridFeature.js';
import fireEvent from './fireEvent.js';
import listAgGridControls from './listAgGridControls.js';
import readAgGridColumns from './readAgGridColumns.js';

// What blocks-aggrid's display grids (AgGrid.js, one component behind AgGridAlpine, AgGridBalham,
// AgGridMaterial and AgGridLowdefy) do for a row or a cell control, headless.

// Cells whose content the stand-in does not model: inputs and links act on their own.
const BROWSER_CELL_TYPES = new Set([
  'link',
  'multipleSelector',
  'paragraphInput',
  'selector',
  'textInput',
]);

// An avatar cell with a link draws its name as a link (AvatarCell's GridLink).
function isAvatarLink(cell) {
  return cell.type === 'avatar' && type.isObject(cell.link);
}

// The component's getRowId: the field `rowId` names (a plain key, not a path), else id, else _id;
// a row with none gets a generated key (assignRowId), which is null here.
function readRowKey({ row, rowId }) {
  if (rowId && row[rowId] !== undefined) {
    return row[rowId];
  }
  if (row.id !== undefined) {
    return row.id;
  }
  if (row._id !== undefined) {
    return row._id;
  }
  return null;
}

// The rows the component holds: its copy of rowData, which a switch writes into, kept until the
// block's rowData changes (the component replaces its rows when the new rowData differs, as JSON).
function holdRows({ rowData, state }) {
  const source = JSON.stringify(rowData);
  if (state.source !== source) {
    state.source = source;
    state.rows = serializer.copy(rowData);
  }
  return state.rows;
}

function columnBrowserOnly({ block, column }) {
  const { colDef } = column;
  let what = null;
  if (type.isObject(colDef.cell) && BROWSER_CELL_TYPES.has(colDef.cell.type)) {
    what = `a ${colDef.cell.type} cell`;
  } else if (type.isObject(colDef.cell) && isAvatarLink(colDef.cell)) {
    what = 'an avatar cell with a link';
  } else if (!type.isObject(colDef.cell) && !type.isNone(colDef.cellRenderer)) {
    what = 'a custom cellRenderer';
  } else if (!type.isNone(colDef.valueGetter)) {
    what = 'a valueGetter';
  } else if (!type.isNone(colDef.editable) && colDef.editable !== false) {
    what = 'cell editing (editable)';
  }
  if (what === null) {
    return null;
  }
  return `Column "${column.id}" of ${describeBlock(block)} has ${what}, which the headless stand-in does not model: the step runs in a browser.`;
}

// onCellClick then onRowClick, each only when the block defines it, in the component's shapes.
// rowIndex is the row's index in the data, which is AG Grid's displayed index with no sort,
// filter or pagination; nothing is selected.
function clickCell({ actor, block, column, entry }) {
  const { events } = block.Events;
  const { colDef } = column;
  const { row, index } = entry;
  if (Object.hasOwn(events, 'onCellClick')) {
    fireEvent({
      actor,
      block,
      name: 'onCellClick',
      event: {
        cell: {
          column: colDef.field,
          value: type.isString(colDef.field) ? get(row, colDef.field) : undefined,
        },
        colId: column.id,
        row,
        rowIndex: index,
        selected: [],
      },
    });
  }
  if (Object.hasOwn(events, 'onRowClick')) {
    fireEvent({ actor, block, name: 'onRowClick', event: { row, rowIndex: index, selected: [] } });
  }
}

function readGrid({ actor, block, state }) {
  const properties = block.eval.properties ?? {};
  const columns = readAgGridColumns(properties, { description: describeBlock(block) });
  const feature = findAgGridFeature({ columns: columns.all, properties, state });
  const rows = holdRows({ rowData: properties.rowData ?? [], state });
  return {
    browserOnly:
      feature === null
        ? null
        : `${describeBlock(block)} uses ${feature}, so the rows a person sees can differ from its rowData: the step runs in a browser.`,
    rows: rows.map((row, index) => ({
      row,
      key: readRowKey({ row, rowId: properties.rowId }),
      index,
    })),
    columns: columns.shown,
    columnBrowserOnly: ({ column }) => columnBrowserOnly({ block, column }),
    listControls: ({ column, entry }) => listAgGridControls({ actor, block, column, entry }),
    clickCell: ({ column, entry }) => clickCell({ actor, block, column, entry }),
  };
}

// A filter a method sets (setFilterModel, setQuickFilter) hides rows the stand-in cannot tell,
// so every row step on the grid after it is the browser's.
function registerMethods({ block, state }) {
  block.registerMethod('setFilterModel', () => {
    state.filteredBy = 'a filter set by setFilterModel';
  });
  block.registerMethod('setQuickFilter', () => {
    state.filteredBy = 'a quick filter set by setQuickFilter';
  });
}

export default {
  ...createGridStandIn({ fix: 'give rows an `id` or set `rowId`', readGrid }),
  registerMethods,
};
