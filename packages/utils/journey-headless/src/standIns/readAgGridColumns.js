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

import HeadlessStepError from '../HeadlessStepError.js';

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

// Whether a column or group with columnGroupShow `show` shows in its group: only while the group
// is open (`open`) or closed (`closed`). `expanded` is whether the group is open, or null when its
// columnGroupShow rules do not apply (no group, or a group that is not expandable).
function showsInGroup({ show, expanded }) {
  if (expanded === null) {
    return true;
  }
  if (show === 'open') {
    return expanded;
  }
  return show === 'closed' ? !expanded : true;
}

// AG Grid applies a group's columnGroupShow rules only when the group is expandable: its visible
// children (a padding group counting as its children) include one shown only while the group is
// open or closed, and something shows both while it is open and while it is closed
// (walkForExpandFlags in ag-grid-community 36).
function isExpandable(children) {
  let open = false;
  let closed = false;
  let changeable = false;
  children
    .filter((child) => child.visible)
    .forEach(({ show }) => {
      if (show === 'open' || show === 'closed') {
        changeable = true;
      }
      open = open || show !== 'closed';
      closed = closed || show !== 'open';
    });
  return open && closed && changeable;
}

// AG Grid makes a group of any entry whose children is truthy (`if (childDefs)` in
// _buildColumnTree), whatever its type.
function isGroup(col) {
  return Boolean(col.children);
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
    treeDepth = Math.max(treeDepth, level);
    defs.forEach((col) => {
      if (isGroup(col)) {
        if (type.isNone(col.groupId)) {
          padding.next += 1;
        }
        measure(col.children, level + 1);
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
    // AG Grid wraps a level's columns in one padding chain only when no entry has children at all;
    // `children: null` is a column, yet still gives each column a chain of its own.
    if (padded && defs.length > 0 && defs.every((col) => col.children === undefined)) {
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
        build(col.children, level + 1);
        return;
      }
      takeColumn(col);
      if (padded) {
        padLevels(level);
      }
    });
  };
  measure(columnDefs, 0);
  build(columnDefs, 0);
  return ids;
}

// The block's processColDefs spreads each entry into an object, so an entry that is not an object
// (a string, or false from an _if) reaches AG Grid as a column with no key. A null or undefined
// entry (an _if with else: null) makes processColDefs throw, so the grid does not render: the step
// fails. A group's children that are not an array reach AG Grid as they are, and it reads them by
// index: a string as one keyless column per character, anything else as no columns.
function toColumnObjects({ defs, path, description }) {
  return defs.map((col, index) => {
    if (type.isNone(col)) {
      throw new HeadlessStepError(
        `${description} has a ${col} column at ${path}.${index}, so the grid does not render.`,
        { actual: `a ${col} column at ${path}.${index}`, expected: `${description} rendered` }
      );
    }
    if (!type.isObject(col)) {
      return {};
    }
    if (!isGroup(col)) {
      return col;
    }
    const children = type.isArray(col.children)
      ? toColumnObjects({ defs: col.children, path: `${path}.${index}.children`, description })
      : Array.from(type.isString(col.children) ? col.children : [], () => ({}));
    return { ...col, children };
  });
}

// The deepest level of columnDefs, as _buildColumnTree measures it: each group adds a level, an
// empty one too.
function measureDepth(defs, level) {
  return defs.reduce(
    (depth, col) => (isGroup(col) ? Math.max(depth, measureDepth(col.children, level + 1)) : depth),
    level
  );
}

// The column tree AG Grid builds, each entry { show, visible } with a group's open state and
// children, or a leaf's column: show is its columnGroupShow, visible whether it or one of its
// leaves is not hidden. A group's definition is merged over defaultColGroupDef, and a leaf's over
// defaultColDef and its column types (its columnGroupShow too). A leaf above the deepest level
// sits in padding groups, whose definition is defaultColGroupDef, so its columnGroupShow
// (paddingShow) applies to the leaf as well.
function buildTree({ defs, level, depth, ids, properties }) {
  const defaultColGroupDef = type.isObject(properties.defaultColGroupDef)
    ? properties.defaultColGroupDef
    : {};
  return defs.map((col) => {
    if (isGroup(col)) {
      const groupDef = { ...defaultColGroupDef, ...col };
      const children = buildTree({ defs: col.children, level: level + 1, depth, ids, properties });
      return {
        show: groupDef.columnGroupShow,
        open: Boolean(groupDef.openByDefault),
        children,
        visible: children.some((child) => child.visible),
      };
    }
    const colDef = mergeColDef({
      col,
      columnTypes: properties.columnTypes,
      defaultColDef: properties.defaultColDef,
    });
    const hidden = (colDef.hide ?? colDef.initialHide) === true;
    return {
      show: colDef.columnGroupShow,
      paddingShow: level < depth ? defaultColGroupDef.columnGroupShow : undefined,
      visible: !hidden,
      leaf: { id: ids.get(col), colDef, hidden, pinned: readPinned(colDef) },
    };
  });
}

// Every leaf column, each hidden when its own hide says so or a group above it, at any level,
// hides it in its starting state: a group starts open only with openByDefault. `expanded` is the
// enclosing group's open state when its columnGroupShow rules apply, else null; `shown` is
// whether every group above shows the entries.
function collectLeaves({ nodes, expanded, shown, leaves }) {
  nodes.forEach((node) => {
    const shownHere =
      shown &&
      showsInGroup({ show: node.paddingShow, expanded }) &&
      showsInGroup({ show: node.show, expanded });
    if (!type.isUndefined(node.children)) {
      collectLeaves({
        nodes: node.children,
        expanded: isExpandable(node.children) ? node.open : null,
        shown: shownHere,
        leaves,
      });
      return;
    }
    leaves.push({ ...node.leaf, hidden: node.leaf.hidden || !shownHere });
  });
  return leaves;
}

// An AgGrid block's columns as AG Grid lays them out from its properties: every leaf column, groups
// flattened, each { id, colDef, hidden, pinned }, id being the id AG Grid gives it (assignColumnIds),
// its cells' col-id. `shown` is the columns a person sees, in display order: pinned left, then unpinned, then
// pinned right, hidden ones left out.
function readAgGridColumns(properties, { description = 'The grid' } = {}) {
  const columnDefs = toColumnObjects({
    defs: properties.columnDefs ?? [],
    path: 'columnDefs',
    description,
  });
  const ids = assignColumnIds(columnDefs);
  const tree = buildTree({
    defs: columnDefs,
    level: 0,
    depth: measureDepth(columnDefs, 0),
    ids,
    properties,
  });
  const all = collectLeaves({ nodes: tree, expanded: null, shown: true, leaves: [] });
  const shown = all
    .filter((column) => !column.hidden)
    .map((column, index) => ({ column, index }))
    .sort((a, b) => PIN_ORDER[a.column.pinned] - PIN_ORDER[b.column.pinned] || a.index - b.index)
    .map(({ column }) => column);
  return { all, shown };
}

export default readAgGridColumns;
