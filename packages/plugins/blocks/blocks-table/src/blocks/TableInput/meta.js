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

// Table's properties, events and methods apply as they are. The value differs: TableInput's is
// a changeset over `data`, not the table's UI state (its view and selection stay internal), and
// edits and moves go into it instead of firing onCellEdit / onRowMove.
const {
  onCellEdit, // eslint-disable-line no-unused-vars
  onChange, // eslint-disable-line no-unused-vars
  onRowMove, // eslint-disable-line no-unused-vars
  ...tableEvents
} = tableMeta.events;

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
    ...tableEvents,
  },
  methods: {
    ...tableMeta.methods,
    resetChanges:
      'Drop every change and the undo history: the value becomes `{ updated: {}, added: [], removed: [] }` and the table shows `data` as it is. Call it after the changes were saved and `data` refetched.',
  },
  properties: {
    ...tableMeta.properties,
    properties: {
      ...tableMeta.properties.properties,
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
