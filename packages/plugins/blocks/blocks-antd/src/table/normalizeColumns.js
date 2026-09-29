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

import AGGREGATE_LABELS from './aggregateLabels.js';
import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';
import humanizeKey from './humanizeKey.js';
import normalizeOptions from './normalizeOptions.js';

const DEFAULT_COLUMN = {
  sortable: true,
  filterable: true,
  resizable: true,
  groupable: false,
  editable: false,
};

// Action cells hold controls, not data, so the data features start off for
// them. A column can still turn one back on explicitly.
const ACTION_FLAG_DEFAULTS = {
  sortable: false,
  filterable: false,
  groupable: false,
  editable: false,
};

const END_ALIGNED_TYPES = new Set(['number', 'currency', 'percent']);

function getEllipsis(ellipsis) {
  if (ellipsis === true) return 1;
  if (type.isInt(ellipsis) && ellipsis > 0) return ellipsis;
  return undefined;
}

function getFlag({ name, column, defaults, isAction }) {
  if (!type.isNone(column[name])) return column[name];
  if (isAction && name in ACTION_FLAG_DEFAULTS) return ACTION_FLAG_DEFAULTS[name];
  return defaults[name];
}

function normalizeLeaf({ column, defaults, path }) {
  const key = column.key ?? column.field;
  if (!type.isString(key)) {
    throw new Error(
      `Table column requires a "key" or "field" string. Received ${JSON.stringify(column)}.`
    );
  }
  const cellType = column.type ?? defaults.type ?? 'text';
  if (type.isUndefined(CELL_TYPE_FAMILIES[cellType])) {
    throw new Error(
      `Table column "${key}" has unknown type "${cellType}". Use one of: ${Object.keys(
        CELL_TYPE_FAMILIES
      ).join(', ')}.`
    );
  }
  if (!type.isNone(column.aggregate) && type.isUndefined(AGGREGATE_LABELS[column.aggregate])) {
    throw new Error(
      `Table column "${key}" has unknown aggregate "${column.aggregate}". Use one of: ${Object.keys(
        AGGREGATE_LABELS
      ).join(', ')}.`
    );
  }
  const cell = column.cell ?? {};
  const isAction = CELL_TYPE_FAMILIES[cellType] === 'action';
  return {
    key,
    field: column.field ?? key,
    title: column.title ?? humanizeKey(key),
    type: cellType,
    cell,
    width: column.width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
    flex: column.flex,
    align: column.align ?? (END_ALIGNED_TYPES.has(cellType) ? 'end' : 'start'),
    pinned: column.pinned,
    hidden: column.hidden === true,
    sortable: getFlag({ name: 'sortable', column, defaults, isAction }),
    filterable: getFlag({ name: 'filterable', column, defaults, isAction }),
    resizable: getFlag({ name: 'resizable', column, defaults, isAction }),
    groupable: getFlag({ name: 'groupable', column, defaults, isAction }),
    editable: getFlag({ name: 'editable', column, defaults, isAction }),
    searchable: column.searchable === true,
    ellipsis: getEllipsis(column.ellipsis ?? defaults.ellipsis),
    wrap: (column.wrap ?? defaults.wrap) === true,
    aggregate: column.aggregate,
    options: normalizeOptions(column.options),
    tooltip: column.tooltip,
    headerTooltip: column.headerTooltip,
    rules: [...(column.rules ?? []), ...(cell.rules ?? [])],
    validate: column.validate ?? [],
    path,
  };
}

function walkColumns({ entries, path, groupPrefix, defaults, leaves, columnsByKey }) {
  return entries.map((entry, index) => {
    const column = type.isString(entry) ? { key: entry } : entry;
    if (!type.isObject(column)) {
      throw new Error(
        `Table column must be an object or a key string. Received ${JSON.stringify(entry)}.`
      );
    }
    if (type.isArray(column.children)) {
      const key = column.key ?? `${groupPrefix}${index}`;
      const title = column.title ?? humanizeKey(column.key);
      return {
        group: true,
        key,
        title,
        headerTooltip: column.headerTooltip,
        path,
        children: walkColumns({
          entries: column.children,
          path: [...path, title],
          groupPrefix: `${key}.`,
          defaults,
          leaves,
          columnsByKey,
        }),
      };
    }
    const leaf = normalizeLeaf({ column, defaults, path });
    if (!type.isUndefined(columnsByKey[leaf.key])) {
      throw new Error(
        `Duplicate table column key "${leaf.key}". Give each column its own "key" when two columns show the same field.`
      );
    }
    columnsByKey[leaf.key] = leaf;
    leaves.push(leaf);
    return leaf;
  });
}

// The column config as the table uses it. Returns the leaf columns in order
// (`columns`), the same leaves by key (`columnsByKey`), and the header tree
// (`headerGroups`): the top-level entries, where a group is
// `{ group: true, key, title, headerTooltip, path, children }` and a leaf is
// the same object as in `columns`.
function normalizeColumns({ columns, defaultColumn }) {
  if (!type.isNone(columns) && !type.isArray(columns)) {
    throw new Error(`Table columns must be an array. Received ${JSON.stringify(columns)}.`);
  }
  const defaults = { ...DEFAULT_COLUMN, ...(defaultColumn ?? {}) };
  const leaves = [];
  const columnsByKey = {};
  const headerGroups = walkColumns({
    entries: columns ?? [],
    path: [],
    groupPrefix: 'group:',
    defaults,
    leaves,
    columnsByKey,
  });
  return { columns: leaves, columnsByKey, headerGroups };
}

export default normalizeColumns;
