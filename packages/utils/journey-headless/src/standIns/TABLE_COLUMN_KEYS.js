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

// Every key of a blocks-table Table column (its meta's column schema), by whether it can make the
// Table load an optional feature the stand-in does not model. A test reads Table's meta and fails
// on a key not listed here, so a new column key is checked against blocks-table's feature rules
// before the stand-in takes it.
// - browserOnly: it can load enrichment or editing, which own clicks on their cells or edit them;
//   blocks-antd's columnNeedsEnrichment and columnNeedsEditing, which blocks-table's
//   needsEnrichment and needsEditing use, read it, and a Table they pass leaves its row steps to
//   the browser.
// - headless: it loads no such feature. The stand-in reads it as the component does (key, field,
//   type, cell, hidden, pinned, a group's collapsible state...), or it changes only how the table
//   looks, or it acts only with a browserOnly key (an enrichment kind's keys, validate). groupable
//   loads the group rows, which regroup only through `view.group`, a view in the block's value,
//   which leaves the step to the browser on its own.
const TABLE_COLUMN_KEYS = {
  browserOnly: ['editable', 'kind', 'status', 'userDefined'],
  headless: [
    'aggregate',
    'align',
    'autoRun',
    'cell',
    'children',
    'collapsed',
    'collapsible',
    'default',
    'ellipsis',
    'field',
    'filterable',
    'flex',
    'groupable',
    'headerTooltip',
    'hidden',
    'inputs',
    'key',
    'maxWidth',
    'minWidth',
    'options',
    'output',
    'path',
    'pinned',
    'prompt',
    'provider',
    'required',
    'resizable',
    'rules',
    'searchable',
    'showWhen',
    'sortable',
    'source',
    'template',
    'title',
    'tooltip',
    'type',
    'validate',
    'width',
    'wrap',
  ],
};

export default TABLE_COLUMN_KEYS;
