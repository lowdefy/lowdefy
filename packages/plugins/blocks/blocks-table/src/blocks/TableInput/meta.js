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

import tableMeta from '../Table/meta.js';

// Table's properties, events and methods apply as they are, but for the enrichment table
// features. The value differs: TableInput's is a changeset over `data`, not the table's UI
// state (its view and selection stay internal), and edits and moves go into it instead of
// firing onCellEdit / onRowMove.
//
// Enrichment tables (design E6) run cells on the server over stored rows, and add rows and
// columns through the app; TableInput edits `data` into a changeset, so it takes none of that:
// no providers, add-column picker, CSV import, run events or run states, and no enrichment,
// ai, extract or user-defined columns. Formula columns (the column core computes them) and
// "+ Add row" (its own, into the changeset) apply. The keys that turn the rest on fail with a
// message naming Table, as TableLight's Table-only keys do, and stay out of the docs. The
// message completes "Block "TableInput" property "<key>" ...".
const TABLE_ONLY_KEYS = {
  properties: {
    providers: 'enrichment columns',
    addColumn: 'adding columns',
    importCsv: 'CSV import',
    inputFieldPrefix: 'adding columns',
  },
  columns: {
    provider: 'enrichment columns',
    inputs: 'enrichment columns',
    output: 'enrichment columns',
    autoRun: 'enrichment columns',
    prompt: 'AI columns',
    source: 'extract columns',
    path: 'extract columns',
    status: 'cell run states',
    userDefined: 'user-defined columns',
  },
};
const TABLE_INPUT_KINDS = ['input', 'formula'];

function tableOnly(keys) {
  return Object.fromEntries(
    Object.keys(keys).map((key) => [
      `^${key}$`,
      { not: {}, errorMessage: `is not supported. Use Table for ${keys[key]}` },
    ])
  );
}

function omitKeys(object, keys) {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
}

const tableColumn = tableMeta.properties.properties.columns.items;
const column = {
  ...tableColumn,
  patternProperties: tableOnly(TABLE_ONLY_KEYS.columns),
  properties: {
    ...omitKeys(tableColumn.properties, Object.keys(TABLE_ONLY_KEYS.columns)),
    kind: {
      type: 'string',
      enum: TABLE_INPUT_KINDS,
      description:
        '`input`: typed by users (the default). `formula`: a `template` over the row, computed in the browser and not editable. The enrichment kinds (`enrichment`, `ai`, `extract`) are Table only.',
    },
  },
};

const {
  onCellEdit, // eslint-disable-line no-unused-vars
  onChange, // eslint-disable-line no-unused-vars
  onRowMove, // eslint-disable-line no-unused-vars
  ...tableEvents
} = tableMeta.events;
const ENRICHMENT_EVENTS = [
  'onColumnAdd',
  'onColumnUpdate',
  'onColumnDelete',
  'onColumnRun',
  'onRowRun',
  'onCellRun',
  'onRowAdd',
  'onImport',
];
const ENRICHMENT_METHODS = ['openColumnPicker', 'openCellDetails', 'openImport'];

// TableInput is an input, not an input-container: it renders no slots (no toolbar, bulk action
// or empty slot blocks), so it does not take Table's.
const { slots, ...inputMeta } = tableMeta; // eslint-disable-line no-unused-vars

export default {
  ...inputMeta,
  category: 'input',
  valueType: 'object',
  // No changes yet. The value is only ever what changed, never the rows (see onChange `value`).
  initValue: { updated: {}, added: [], removed: [] },
  events: {
    onChange: {
      description:
        'Trigger when the changes change through the table: a cell edit, an added, deleted or moved row, a paste, or an undo or redo.',
      event: {
        value:
          'The block value: the changes made in the table since `data`, `{ updated, added, removed, moved?, order? }`. `updated` is `{ [rowKey]: { [field]: value } }` with only the changed fields, keyed by the column `field` dot path (a MongoDB $set); a field edited back to its original value leaves it. `added` is `[{ rowKey, ...row }]`, `rowKey` a generated temporary key (a `default` on the key column is ignored, so added rows never share a key). `removed` is `[rowKey]` of data rows deleted (deleting an added row just drops it from `added`). With `rowDrag.positionField`, `moved` is `{ [rowKey]: position }` of moved data rows; with `rowDrag` and no positionField, `order` is the full row key order after a move. No changes is `{ updated: {}, added: [], removed: [] }`.',
        cause: 'What changed: `edit`, `add`, `delete`, `move`, `paste`, `undo` or `redo`.',
        rowKey: 'The key of the row that changed, for `edit`, `add`, `delete` and `move`.',
        skipped:
          'For `paste`: the cells that were not pasted, `[{ rowKey, column, text, reason }]`.',
      },
    },
    ...omitKeys(tableEvents, ENRICHMENT_EVENTS),
  },
  methods: {
    ...omitKeys(tableMeta.methods, ENRICHMENT_METHODS),
    resetChanges:
      'Drop every change and the undo history: the value becomes `{ updated: {}, added: [], removed: [] }` and the table shows `data` as it is. Call it after the changes were saved and `data` refetched.',
  },
  properties: {
    ...tableMeta.properties,
    patternProperties: tableOnly(TABLE_ONLY_KEYS.properties),
    properties: {
      ...omitKeys(tableMeta.properties.properties, Object.keys(TABLE_ONLY_KEYS.properties)),
      columns: {
        ...tableMeta.properties.properties.columns,
        items: column,
      },
      data: {
        type: 'array',
        description:
          'The rows to edit. They are never written: the changes are the block value, shown over the rows.',
        items: { type: 'object' },
      },
      rowKey: {
        type: 'string',
        description:
          'Dot path to the unique row key. Defaults to `_id`, then `id`. Changes are recorded by key, so rows need a key. A row added in the table shows its temporary key in this field (default `_id` when the data uses it, else `id`).',
      },
      addRow: {
        type: 'boolean',
        default: false,
        description:
          'Show a "+ Add row" row under the table. A new row gets each column `default` (and, with `rowDrag.positionField`, a position after the last row), and opens its first editable cell.',
      },
      addRowText: {
        type: 'string',
        default: 'Add row',
        description: 'Text of the add-row row.',
      },
      deleteRows: {
        type: 'boolean',
        default: false,
        description: 'Delete the focused row with the Delete or Backspace key.',
      },
      rowActions: {
        type: 'object',
        additionalProperties: false,
        description: 'Row controls shown in a leading column.',
        properties: {
          delete: {
            type: 'boolean',
            default: false,
            description: 'A delete button on every row.',
          },
        },
      },
    },
  },
};
