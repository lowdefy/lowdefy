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

import compileColumns from '@lowdefy/blocks-antd/table/compileColumns.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';
import { type } from '@lowdefy/helpers';

const PIN_ORDER = { start: 0, center: 1, end: 2 };

// The stand-in draws no cell or tooltip text, so an html cell's or a tooltip's template compiles
// to nothing, and the template compiler is never loaded.
function compileNoTemplate() {
  return () => '';
}

// Whether a column or group with `showWhen` shows, given whether the nearest collapsible group
// above it is collapsed (null when there is none).
function showsWhen({ showWhen, collapsed }) {
  if (collapsed === null || type.isNone(showWhen) || showWhen === 'always') {
    return true;
  }
  return showWhen === 'open' ? !collapsed : collapsed;
}

// The keys of the leaf columns a person sees: not hidden, and shown by every collapsible group
// above them in its starting state (`collapsed`).
function collectShownKeys({ nodes, collapsed, keys }) {
  nodes.forEach((node) => {
    if (!showsWhen({ showWhen: node.showWhen, collapsed })) {
      return;
    }
    if (node.group === true) {
      collectShownKeys({
        nodes: node.children,
        collapsed: node.collapsible === true ? node.collapsed === true : collapsed,
        keys,
      });
      return;
    }
    if (!node.hidden) {
      keys.add(node.key);
    }
  });
  return keys;
}

// A Table block's shown columns, in display order (pinned to the start, unpinned, pinned to the
// end), each { id, column }: id is the column key, as its cells' data-col-key, and column the
// column as blocks-table's useTableConfig compiles it, through blocks-antd's shared column core
// (normalizeColumns, compileColumns), so `{ when }` conditions and formula values are the Table's
// own.
function readTableColumns(properties) {
  const normalized = normalizeColumns({
    columns: properties.columns,
    defaultColumn: properties.defaultColumn,
  });
  const columns = compileColumns({
    columns: normalized.columns,
    columnsByKey: normalized.columnsByKey,
    user: properties.user ?? {},
    compileTemplate: compileNoTemplate,
  });
  const shownKeys = collectShownKeys({
    nodes: normalized.headerGroups,
    collapsed: null,
    keys: new Set(),
  });
  return columns
    .filter((column) => shownKeys.has(column.key))
    .map((column, index) => ({ column, index }))
    .sort(
      (a, b) =>
        PIN_ORDER[a.column.pinned ?? 'center'] - PIN_ORDER[b.column.pinned ?? 'center'] ||
        a.index - b.index
    )
    .map(({ column }) => ({ id: column.key, column }));
}

export default readTableColumns;
