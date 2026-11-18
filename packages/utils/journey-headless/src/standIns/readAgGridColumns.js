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

import { type } from '@lowdefy/helpers';

const PIN_ORDER = { left: 0, center: 1, right: 2 };

// AG Grid merges a column's definition over its column types and the grid's defaultColDef. The
// cell renderer comes from the column's own `cell` only: processColDefs reads it from each column,
// and AG Grid ignores a `cell` on defaultColDef or a column type.
function mergeColDef({ col, columnTypes, defaultColDef }) {
  const typeNames = type.isArray(col.type) ? col.type : [col.type];
  const types = typeNames
    .filter((name) => type.isString(name) && type.isObject(columnTypes?.[name]))
    .map((name) => columnTypes[name]);
  return { ...Object.assign({}, defaultColDef, ...types, col), cell: col.cell };
}

function readPinned(colDef) {
  const pinned = colDef.pinned ?? colDef.initialPinned;
  if (pinned === true || pinned === 'left') {
    return 'left';
  }
  return pinned === 'right' ? 'right' : 'center';
}

// A column in a group with columnGroupShow shows only while the group is open (`open`) or closed
// (`closed`); a group starts open only with openByDefault.
function isShownInGroup({ col, group }) {
  if (type.isNone(group) || type.isNone(col.columnGroupShow)) {
    return true;
  }
  const open = group.openByDefault === true;
  return col.columnGroupShow === 'open' ? open : !open;
}

function collectLeaves({ defs, group, properties, leaves }) {
  (defs ?? []).forEach((col) => {
    if (!type.isObject(col)) {
      return;
    }
    if (type.isArray(col.children)) {
      collectLeaves({ defs: col.children, group: col, properties, leaves });
      return;
    }
    const colDef = mergeColDef({
      col,
      columnTypes: properties.columnTypes,
      defaultColDef: properties.defaultColDef,
    });
    leaves.push({
      id: String(colDef.colId ?? colDef.field),
      colDef,
      hidden: (colDef.hide ?? colDef.initialHide) === true || !isShownInGroup({ col, group }),
      pinned: readPinned(colDef),
    });
  });
  return leaves;
}

// An AgGrid block's columns as AG Grid lays them out from its properties: every leaf column, groups
// flattened, each { id, colDef, hidden, pinned }, id being its colId, else its field, as its cells'
// col-id. `shown` is the columns a person sees, in display order: pinned left, then unpinned, then
// pinned right, hidden ones left out.
function readAgGridColumns(properties) {
  const all = collectLeaves({ defs: properties.columnDefs, properties, leaves: [] });
  const shown = all
    .filter((column) => !column.hidden)
    .map((column, index) => ({ column, index }))
    .sort((a, b) => PIN_ORDER[a.column.pinned] - PIN_ORDER[b.column.pinned] || a.index - b.index)
    .map(({ column }) => column);
  return { all, shown };
}

export default readAgGridColumns;
