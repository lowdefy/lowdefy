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

// Integration point: this file will re-export `normalizeColumns` from
// `@lowdefy/blocks-antd/table/normalizeColumns.js` once the shared column core lands. Until then
// it is a minimal local implementation of the brief's contract (flat leaf columns plus header
// groups), so the table engine can be built and benchmarked against the final interface.

const NUMERIC_TYPES = new Set(['number', 'currency', 'percent', 'progress', 'rating']);

const DEFAULT_COLUMN = {
  sortable: true,
  filterable: true,
  resizable: true,
  groupable: false,
  editable: false,
};

function humanizeKey(key) {
  const spaced = String(key)
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function normalizeLeaf({ column, defaultColumn, path }) {
  const key = column.key ?? column.field;
  const field = column.field ?? column.key;
  const columnType = column.type ?? 'text';
  const merged = { ...DEFAULT_COLUMN, ...defaultColumn, ...column };
  return {
    key: String(key),
    field,
    title: column.title ?? humanizeKey(key),
    type: columnType,
    cell: column.cell ?? {},
    width: merged.width,
    minWidth: merged.minWidth,
    maxWidth: merged.maxWidth,
    flex: merged.flex,
    align: column.align ?? (NUMERIC_TYPES.has(columnType) ? 'end' : 'start'),
    pinned: column.pinned,
    hidden: column.hidden === true,
    sortable: merged.sortable !== false,
    filterable: merged.filterable !== false,
    resizable: merged.resizable !== false,
    groupable: merged.groupable === true,
    editable: merged.editable === true,
    ellipsis: merged.ellipsis,
    wrap: merged.wrap === true,
    aggregate: column.aggregate,
    options: column.options,
    tooltip: column.tooltip,
    headerTooltip: column.headerTooltip,
    rules: column.rules ?? [],
    validate: column.validate ?? [],
    path,
  };
}

function collect({ columns, defaultColumn, path, leaves, headerGroups }) {
  (columns ?? []).forEach((column) => {
    if (!type.isObject(column)) {
      throw new Error(`Table column must be an object. Received ${JSON.stringify(column)}.`);
    }
    if (type.isArray(column.children)) {
      const title = column.title ?? '';
      headerGroups.push({ title, path, depth: path.length });
      collect({
        columns: column.children,
        defaultColumn,
        path: [...path, title],
        leaves,
        headerGroups,
      });
      return;
    }
    if (type.isNone(column.key) && type.isNone(column.field)) {
      throw new Error(
        `Table column requires "key" or "field". Received ${JSON.stringify(column)}.`
      );
    }
    leaves.push(normalizeLeaf({ column, defaultColumn, path }));
  });
}

function normalizeColumns({ columns, defaultColumn }) {
  const leaves = [];
  const headerGroups = [];
  collect({ columns, defaultColumn: defaultColumn ?? {}, path: [], leaves, headerGroups });
  return { columns: leaves, headerGroups };
}

export default normalizeColumns;
