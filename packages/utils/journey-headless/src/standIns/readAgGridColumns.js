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

function isGroup(col) {
  return type.isArray(col.children);
}

// The base of a column's id: its own colId, else its own field. AG Grid reads them from the
// column's definition, never from defaultColDef or a column type.
function readBase(col) {
  return col.colId ?? col.field;
}

// The ids AG Grid gives the leaf columns of columnDefs, as a Map from each leaf's definition to
// its id: _buildColumnTree in ag-grid-community 36 on a first build, which a later build with the
// same definitions keeps. A column takes its base, or `<base>_<n>` with the first n not taken
// (buildKeyedColumn). A column with no base takes the next number from a counter, skipping every
// id taken and every base (buildAnonymousColumn); a group with no groupId takes its id from the
// same counter (getUniqueKey) before its children do. A group's groupId takes its id like a base.
// In a grid with groups, a column above the deepest level sits in padding groups, one per level
// it is short, numbered from a second counter that starts past the groups with no groupId and
// the columns with no base, which also skips what is taken.
function assignColumnIds(columnDefs) {
  const bases = new Set();
  const numbers = { next: 0 };
  const padding = { next: 0 };
  let treeDepth = 0;
  const measure = (defs, level) => {
    defs.forEach((col) => {
      treeDepth = Math.max(treeDepth, level);
      if (isGroup(col)) {
        if (type.isNone(col.groupId)) {
          padding.next += 1;
        }
        measure(col.children.filter(type.isObject), level + 1);
        return;
      }
      const base = readBase(col);
      if (type.isNone(base)) {
        padding.next += 1;
      } else {
        bases.add(base);
      }
    });
  };
  const taken = new Set();
  const takeNumber = (counter) => {
    let id;
    do {
      id = `${counter.next}`;
      counter.next += 1;
    } while (taken.has(id) || bases.has(id));
    taken.add(id);
    return id;
  };
  const takeKeyed = (base) => {
    let id = base;
    let count = 1;
    while (taken.has(id)) {
      id = `${base}_${count}`;
      count += 1;
    }
    taken.add(id);
    return id;
  };
  const ids = new Map();
  const takeColumn = (col) => {
    const base = readBase(col);
    ids.set(col, String(type.isNone(base) ? takeNumber(numbers) : takeKeyed(base)));
  };
  const padLevels = (level) => {
    for (let depth = level; depth < treeDepth; depth += 1) {
      takeNumber(padding);
    }
  };
  const build = (defs, level) => {
    const padded = level < treeDepth;
    if (padded && defs.length > 0 && !defs.some(isGroup)) {
      defs.forEach(takeColumn);
      padLevels(level);
      return;
    }
    defs.forEach((col) => {
      if (isGroup(col)) {
        if (type.isNone(col.groupId)) {
          takeNumber(numbers);
        } else {
          takeKeyed(col.groupId);
        }
        build(col.children.filter(type.isObject), level + 1);
        return;
      }
      takeColumn(col);
      if (padded) {
        padLevels(level);
      }
    });
  };
  const defs = (columnDefs ?? []).filter(type.isObject);
  measure(defs, 0);
  build(defs, 0);
  return ids;
}

function collectLeaves({ defs, group, properties, ids, leaves }) {
  (defs ?? []).forEach((col) => {
    if (!type.isObject(col)) {
      return;
    }
    if (isGroup(col)) {
      collectLeaves({ defs: col.children, group: col, properties, ids, leaves });
      return;
    }
    const colDef = mergeColDef({
      col,
      columnTypes: properties.columnTypes,
      defaultColDef: properties.defaultColDef,
    });
    leaves.push({
      id: ids.get(col),
      colDef,
      hidden: (colDef.hide ?? colDef.initialHide) === true || !isShownInGroup({ col, group }),
      pinned: readPinned(colDef),
    });
  });
  return leaves;
}

// An AgGrid block's columns as AG Grid lays them out from its properties: every leaf column, groups
// flattened, each { id, colDef, hidden, pinned }, id being the id AG Grid gives it (assignColumnIds),
// its cells' col-id. `shown` is the columns a person sees, in display order: pinned left, then unpinned, then
// pinned right, hidden ones left out.
function readAgGridColumns(properties) {
  const ids = assignColumnIds(properties.columnDefs);
  const all = collectLeaves({ defs: properties.columnDefs, properties, ids, leaves: [] });
  const shown = all
    .filter((column) => !column.hidden)
    .map((column, index) => ({ column, index }))
    .sort((a, b) => PIN_ORDER[a.column.pinned] - PIN_ORDER[b.column.pinned] || a.index - b.index)
    .map(({ column }) => column);
  return { all, shown };
}

export default readAgGridColumns;
