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

import AGGREGATE_LABELS from '@lowdefy/blocks-antd/table/aggregateLabels.js';
import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';
import COLUMN_KINDS from '@lowdefy/blocks-antd/table/columnKinds.js';

// Every property TableLight accepts is valid here with the same meaning (TableLight is a strict
// subset of Table, design D16), so changing `type: TableLight` to `type: Table` keeps a block
// working. The column keys shared with TableLight use its descriptions.

const columnFlags = {
  sortable: {
    type: 'boolean',
    description:
      'Sort by clicking the header (Shift+click adds to a multi-sort). Defaults to `defaultColumn.sortable` (true).',
  },
  filterable: {
    type: 'boolean',
    description:
      'Offer the column in filters: the header menu "Filter…" item and the filter builder.',
  },
  resizable: {
    type: 'boolean',
    description: 'Resize the column by dragging the right edge of its header.',
  },
  groupable: {
    type: 'boolean',
    description:
      'Allow grouping rows by this column (view `group`, the `setGroup` method, the header menu). Default false.',
  },
  editable: {
    type: ['boolean', 'object'],
    description:
      'Edit cells of this column: `true`, or `{ when: Condition }` to allow it per row. The editor comes from the type: text, email, phone and url edit as text; number, currency and percent as a number; date and datetime with a date picker; boolean with a switch; tag and status select from `options`; tags select several; rating with stars. Enter, F2, double-click or typing opens it; Enter, Tab or leaving commits; Esc cancels. Table fires onCellEdit; TableInput writes its value.',
    properties: {
      when: {
        type: 'object',
        description:
          'Condition tested against the row (and the cell value, for leaves without `key`) that decides whether the cell is editable.',
      },
    },
  },
};

const textLayout = {
  ellipsis: {
    type: ['integer', 'boolean'],
    description:
      'Clamp the text to this many lines (`true` is one) with an ellipsis; the full text shows on hover. More than one line makes rows as tall as their content.',
    docs: { displayType: 'number' },
  },
  wrap: {
    type: 'boolean',
    default: false,
    description:
      'Wrap long text; rows grow to fit (measured row heights, which turn column virtualisation off). Text stays on one line by default.',
  },
};

const widthProperties = {
  width: {
    type: 'number',
    description: 'Column width in pixels. Default 160.',
  },
  minWidth: {
    type: 'number',
    description: 'Minimum width in pixels when resizing. Default 48.',
  },
  maxWidth: {
    type: 'number',
    description: 'Maximum width in pixels when resizing.',
  },
};

const pinned = {
  type: 'string',
  enum: ['start', 'end'],
  description: 'Pin the column to the start or end, where it stays visible while scrolling.',
};

const column = {
  type: ['object', 'string'],
  additionalProperties: false,
  description: 'A column, or just its key. `key` (or `field`) is required.',
  properties: {
    key: {
      type: 'string',
      description:
        'The column id, unique in the table and used in the view. Defaults to `field`. Two columns showing the same field need their own keys.',
    },
    field: {
      type: 'string',
      description: 'The dot path of the value in each row. Defaults to `key`.',
    },
    title: {
      type: 'string',
      description: 'The header - supports html. Defaults to the key in sentence case.',
    },
    type: {
      type: 'string',
      enum: Object.keys(CELL_TYPE_FAMILIES),
      default: 'text',
      description:
        'The cell type. It sets how the value renders, sorts and aggregates and the default alignment.',
    },
    cell: {
      type: 'object',
      description:
        'Options for the cell type, the same keys as TableLight (and the AgGrid `cell` keys where they overlap), for example `format`, `currency`, `relative`, `pageId`/`urlQuery` (link), `template` (html), `buttons` and `showOn` (buttons), `items` (menu). Row buttons (`buttons`) and menu items (`items`) also accept `key`, a single key that fires the item when its row is focused, for example `key: a` (no editor open, no modifier).',
      docs: { displayType: 'yaml' },
    },
    ...widthProperties,
    flex: {
      type: 'number',
      description: 'Grow into spare table width, by this weight.',
    },
    align: {
      type: 'string',
      enum: ['start', 'center', 'end'],
      description: 'Horizontal alignment. Defaults to `end` for number, currency and percent.',
    },
    pinned,
    ...textLayout,
    hidden: {
      type: 'boolean',
      default: false,
      description: 'Declare the column but hide it.',
    },
    ...columnFlags,
    searchable: {
      type: 'boolean',
      description:
        'Include the column in `view.search`. When any column sets it, search reads only those columns; otherwise it reads every visible column.',
    },
    aggregate: {
      type: 'string',
      enum: Object.keys(AGGREGATE_LABELS),
      description:
        'Default aggregate for this column, shown in group headers and the summary footer (over all filtered rows): sum, avg, min, max, count, countDistinct, countEmpty, countNotEmpty, percentEmpty, earliest or latest. The view `aggregates` overrides it, and can set aggregates for columns without one.',
    },
    options: {
      type: ['array', 'object'],
      description:
        'Labels and colours for enum values, for tag, tags and status cells: a list of values or `{ value, label, color, icon }`, or a map from value to a label or `{ label, color, icon }`. Enums sort in option order.',
      docs: { displayType: 'yaml' },
    },
    tooltip: {
      type: ['string', 'object'],
      description:
        'A plain-text hover tooltip: a nunjucks template string (with `value` and `row`), `{ template }` or `{ field }` (a row path).',
      docs: { displayType: 'yaml' },
    },
    headerTooltip: {
      type: 'string',
      description: 'A tooltip on the header - supports html.',
    },
    rules: {
      type: 'array',
      description:
        'Conditional formatting: `[{ when, color, className, style }]`. Every rule whose `when` condition holds applies, in order.',
      items: { type: 'object' },
      docs: { displayType: 'yaml' },
    },
    validate: {
      type: 'array',
      description:
        'Edit validation, checked before an edit commits: `[{ pass: Condition, message }]`. A failing check keeps the editor open with the message. TableInput also marks the cells of changed and added rows that fail inline.',
      items: {
        type: 'object',
        required: ['pass'],
        properties: {
          pass: {
            type: 'object',
            description:
              'Condition the edited value must pass. Leaves without `key` test the cell value; leaves with `key` read the edited row.',
          },
          message: { type: 'string', description: 'Message shown when the check fails.' },
        },
      },
    },
    required: {
      type: 'boolean',
      description: 'An edit may not leave the cell empty (validated like `validate`).',
    },
    default: {
      description: 'TableInput: the value of this column in a row added with "+ Add row".',
    },
    kind: {
      type: 'string',
      enum: Object.keys(COLUMN_KINDS),
      description:
        'Enrichment tables: what computes the column. `input`: typed by users. `formula`: a `template` over the row, in the browser. `enrichment`: a `provider` call per row, on the server. `ai`: a `prompt` per row, on the server. `extract`: a `path` into another column\'s raw result, in the browser. Enrichment and ai columns read their value from `_enrich.{key}.value` (unless `field` is set) and their run state from `_enrich.{key}`, and render it: queued, running, the value, an error (message on hover), "No result", or the value dimmed when their inputs changed since they ran (stale).',
    },
    userDefined: {
      type: 'boolean',
      description:
        'A column users added at runtime (stored by the app). Its header menu has Rename, Edit, Duplicate, Insert left / right and Delete, which fire onColumnUpdate, onColumnAdd and onColumnDelete. If its config is invalid it renders as an error column ("Invalid column: " and the reason in its cells, Edit column and Delete column in its menu) instead of breaking the table.',
    },
    template: {
      type: 'string',
      description:
        "`kind: formula`: the value's template, `{{ column }}` placeholders (a column key or a row field path) filled in as plain text, in the browser (`{{ email }}` is the email column's value, also for enrichment, ai and extract columns). Only placeholders: tags, comments and expressions (`{{ name | upper }}`) are refused, since a template engine would run what users write as code.",
    },
    provider: {
      type: 'string',
      description:
        "`kind: enrichment`: the id of the provider (from `providers`) the column calls. `kind: ai`: the AI provider, `ai` (the app's `enrich_ai` endpoint) by default.",
    },
    inputs: {
      type: 'object',
      description:
        "`kind: enrichment` or `ai`: the inputs, each `{ column: {column key}, required? }` (that column's value in the row; an enrichment or ai column's only once its cell is done) or `{ value: {literal} }`. An ai column lists the columns its prompt references here (the add-column picker keeps them in step). A cell is stale when its resolved inputs differ from the ones it ran with.",
      docs: { displayType: 'yaml' },
    },
    output: {
      type: ['string', 'object'],
      description:
        "`kind: enrichment`: the path of the value in the provider's result (`value` defaults to the whole result). `kind: ai`: `{ type, options? }`, the answer's type (also the column type): `text`, `number`, `boolean`, `tag` or `tags`; `options`, the answers allowed, only for `tag` and `tags`.",
      docs: { displayType: 'yaml' },
    },
    autoRun: {
      type: 'boolean',
      description:
        "`kind: enrichment` or `ai`: run a row's cell by itself when an input column's cell completes (MongoDBEnrichmentComplete queues it).",
    },
    prompt: {
      type: 'string',
      description:
        "`kind: ai`: the prompt, with `{{ input }}` placeholders (`{{ company }}`) the server fills in from the column's `inputs` as plain text (list every referenced column there). Only placeholders: tags, comments and expressions are refused. Changing the prompt does not make cells stale; run the column again to use it.",
    },
    source: {
      type: 'string',
      description: '`kind: extract`: the key of the enrichment or ai column to read from.',
    },
    path: {
      type: 'string',
      description:
        "`kind: extract`: the dot path in the source column's raw result (`people.0.email`); empty for the whole result. The column reads `_enrich.{source}.raw.{path}`.",
    },
    status: {
      type: 'object',
      description:
        "Show a run state in this column's cells from `{ field }`, a path to an object like `_enrich.{key}` (`status`, `value`, `error`, `inputHash`, ...). Enrichment and ai columns have it by default.",
      properties: {
        field: { type: 'string', description: 'The dot path of the run state object.' },
      },
    },
    children: {
      type: 'array',
      description:
        'Columns grouped under this header. A group needs a `title`; groups render as header rows above the column headers.',
      items: { type: ['object', 'string'] },
      docs: { displayType: 'yaml' },
    },
  },
};

const toolbarItem = (description) => ({ type: 'boolean', default: false, description });

const viewColumn = {
  type: 'object',
  additionalProperties: false,
  required: ['key'],
  properties: {
    key: { type: 'string' },
    width: { type: 'number' },
    pinned,
    hidden: { type: 'boolean' },
  },
};

export default {
  // An input with slots: its value is the table state, and `toolbarStart`, `toolbarEnd`,
  // `bulkActions` and `empty` hold blocks.
  category: 'input-container',
  valueType: 'object',
  icons: [
    'chevron-down',
    'chevron-up',
    'close',
    'download',
    'filter',
    'list',
    'more',
    'search',
    'sort',
    'view',
  ],
  slots: {
    toolbarStart:
      'Blocks at the start of the toolbar, for example a "New deal" button. Blocks sit side by side at their content width (8px gap, wrapping); the slot\'s `gap`, `align` and `justify` and a block\'s `layout.flex` still apply.',
    toolbarEnd: 'Blocks at the end of the toolbar, side by side like `toolbarStart`.',
    bulkActions:
      'Blocks in the bulk action bar, shown while rows are selected, side by side at the end of the bar like `toolbarStart`.',
    empty: 'Blocks shown instead of the empty state when there are no rows.',
  },
  // Server mode fetches through an internal event running the Request action.
  actions: ['Request'],
  cssKeys: {
    element: 'The table root element.',
    header: 'The header row group.',
    row: 'Every body row.',
  },
  // Cell buttons and menu items declare their own eventName, so the event names this block fires
  // are authored in its properties.
  dynamicEvents: true,
  events: {
    onChange: {
      description:
        'Trigger when the table value changes through the table: a sort, a filter or search, a column change (resize, reorder, pin, hide, column manager), or a selection.',
      event: {
        value: 'The table value `{ view, selected, expanded }`.',
        cause:
          'What changed: `sort`, `filter`, `search`, `columns`, `select`, `group` (the grouping levels), `aggregate` (group aggregates), `expand` (a group, tree row or detail row collapsed or expanded), `density`, `wrap` (the toolbar Wrap toggle), or `view` (a saved view loaded, discarded to, or selected).',
      },
    },
    onSelectionChange: {
      description:
        'Trigger when the row selection changes. "Select all matching" in the bulk bar (and, in server mode, the header checkbox) selects every row the view matches as `{ all: true, except, filter, search }`: every row matching that filter and search except the `except` keys, so a request can resolve it from the value alone. Changing the filter or search clears such a selection.',
      event: {
        selected: 'The selected row keys, or `{ all: true, except, filter, search }`.',
        rows: 'The selected row objects that are loaded.',
      },
    },
    onRowExpand: {
      description:
        "Trigger when a tree row or an expandable row is expanded or collapsed. With `tree.lazy`, load the row's children here when `needsChildren` is true (skip the load action otherwise) and add them to `data`.",
      event: {
        row: 'The row object.',
        rowKey: 'The row key.',
        expanded: 'True when the row was expanded, false when it was collapsed.',
        needsChildren:
          'True when a `tree.lazy` row is expanded and none of its children are in `data` yet, so they need loading. False for every other expand and collapse.',
      },
    },
    onExport: {
      description:
        'Server mode: trigger when `exportCsv` is called. The browser only holds the loaded blocks, so produce the file from the view, for example with a request and a download action.',
      event: {
        view: 'The table view (columns, sort, filter, search, group, ...).',
        filename: 'The filename passed to exportCsv.',
        formatted: 'The formatted flag passed to exportCsv.',
      },
    },
    onRowClick: {
      description:
        'Trigger when a row is clicked, or activated with Enter. Clicks on buttons, links, menus and `data-event` elements in a cell, and clicks that end a text selection, do not trigger it. With `rowLink`, a plain click runs onRowClick instead of following the link.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        index:
          'The index of the row in `data` (with `childrenField`, in the depth-first list of every row). In server mode, its index in the rows the request matches (inside a group, in the group). `null` for a row that is not in `data`: added with `applyTransaction`, or added in a TableInput.',
      },
    },
    onRowDoubleClick: {
      description: 'Trigger when a row is double clicked.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        index:
          'The index of the row in `data` (with `childrenField`, in the depth-first list of every row). In server mode, its index in the rows the request matches (inside a group, in the group). `null` for a row that is not in `data`: added with `applyTransaction`, or added in a TableInput.',
      },
    },
    onCellClick: {
      description:
        'Trigger actions when a cell is clicked. Clicks on controls in the cell do not trigger it.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        column: 'The column: { key, field }.',
        value: 'The cell value.',
      },
    },
    onViewSelect: {
      description: 'Trigger when a saved view tab is selected, after its view loads.',
      event: {
        id: 'The id of the selected view.',
      },
    },
    onViewSave: {
      description:
        'Trigger when the user saves the current view: Save (with the active view `id`) or Save as (no `id`, a new view). The app stores views; update `views` (and `activeView`) with the result.',
      event: {
        view: 'The current view.',
        id: 'The id of the view to overwrite. Missing for Save as.',
        title: 'The view title.',
        shared: 'Whether the view is shared.',
      },
    },
    onViewDelete: {
      description: 'Trigger when the user deletes a saved view from its tab menu.',
      event: {
        id: 'The id of the view to delete.',
      },
    },
    onCellEdit: {
      description:
        'Trigger when an edited cell commits. The cell shows the new value with a saving indicator while the event runs. When the actions fail (a Request error or a Throw), the cell reverts and shows the error message. After success the new value shows until the row changes in `data`. Without this event, edits only show in the table.',
      event: {
        row: 'The row object before the edit.',
        rowKey: 'The row key.',
        column: 'The column `{ key, field }`.',
        value: 'The new value.',
        previous: 'The value before the edit.',
      },
    },
    onRowMove: {
      description:
        'Trigger when a row is dropped at a new place (`rowDrag`): a drag of its handle, or Alt+Shift+ArrowUp/Down. The rows reorder at once with a saving indicator on the handle while the event runs; when the actions fail the order reverts and the handle shows the error message. After success the new order shows until `data` changes. With `rowDrag.positionField`, save `position` on the moved row (`positions` holds every row whose position changed: normally just this one, all rows when the list had to be renumbered). Without it, save the order from `beforeKey` / `afterKey`.',
      event: {
        row: 'The moved row object.',
        rowKey: 'The moved row key.',
        fromIndex: 'The index the row was at in the displayed rows, across every page.',
        toIndex: 'The index the row is at now in the displayed rows, across every page.',
        beforeKey: 'The key of the row now before it, or null at the top.',
        afterKey: 'The key of the row now after it, or null at the bottom.',
        position: "With a positionField: the moved row's new position.",
        positions:
          'With a positionField: `{ [rowKey]: position }` of every row whose position changed.',
      },
    },
    onColumnAdd: {
      description:
        'Trigger when a column is added: the add-column picker (`addColumn`), Duplicate or Insert left / right in a user-defined column\'s header menu, or "Add as column" in the cell details panel. The picker stays open, pending, while the event runs, and shows the error when the actions fail. Store the column and add it to `columns`.',
      event: {
        column:
          "The column config, with a generated unique `key`, `userDefined: true` and the kind's keys (`template`; `provider`, `inputs`, `output`, `autoRun`; `prompt`, `output`, `autoRun`; `source`, `path`).",
        position:
          'Where it goes: `{ before: key }` or `{ after: key }` (Insert left / right, Duplicate, Add as column), or null for the end.',
      },
    },
    onColumnUpdate: {
      description:
        'Trigger when a user-defined column is renamed (inline in its header) or edited (the picker). The rename or picker shows it pending while the event runs and the error when it fails.',
      event: {
        column: 'The new column config (same key).',
        previous: 'The column config before the change.',
      },
    },
    onColumnDelete: {
      description:
        'Trigger when a user-defined column is deleted from its header menu, after the confirmation. The dialog stays open, pending, while the event runs.',
      event: {
        column: 'The deleted column config.',
      },
    },
    onColumnRun: {
      description:
        'Trigger to run an enrichment or ai column: Run in its header menu (all rows, empty cells, errors or stale cells) or "Run selected" in the bulk bar. Enqueue the cells, for example with MongoDBEnrichmentEnqueue; their states then show in the cells.',
      event: {
        column: 'The column config.',
        mode: '`all`, `empty`, `errors` or `stale`.',
        selection:
          'The rows to run: the selection value when rows are selected (row keys, or `{ all: true, except, filter, search }`), otherwise `{ all: true, except: [], filter, search }` of the current view.',
      },
    },
    onRowRun: {
      description:
        "Trigger when a row's run button is clicked (the trailing column, shown on hover): run every enrichment and ai column of the row.",
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        columns: 'The keys of the enrichment and ai columns.',
      },
    },
    onCellRun: {
      description:
        'Trigger when one cell is rerun: Rerun in the cell details panel, or the rerun button of a stale cell.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        column: 'The column config of the enrichment or ai column.',
      },
    },
    onRowAdd: {
      description:
        'Trigger when a row is added with "+ New row" (`addRow`). The row shows at the end of the table, marked saving, while the event runs; after it the row comes from `data` (add it there, for example by refetching). When the actions fail, the row goes and the editor shows the error with the values kept.',
      event: {
        values:
          'The typed values, set at each column `field` path (`{ name, company: { domain } }`), empty fields left out.',
      },
    },
    onImport: {
      description:
        'Trigger for each batch of rows a CSV import sends (`importCsv`), 500 rows at a time, each awaited before the next; a failed batch stops the import and shows its error. Insert the rows, for example with MongoDBInsertMany, and create `newColumns` once.',
      event: {
        rows: 'The batch of rows, values set at each mapped column `field` and coerced to its type.',
        newColumns:
          'With the first batch only: the text input columns to create for CSV headers mapped to "New text column" (`{ key, title, type: text, kind: input, field, editable, userDefined }`, `field` under `inputFieldPrefix`); an empty list after. The rows carry their values at that `field`.',
        batchIndex: 'The index of this batch, from 0.',
        batchCount: 'The number of batches.',
        total: 'The number of rows in the import.',
      },
    },
    onCellLink: {
      description:
        'Triggered when a link, avatar link or relation cell is clicked. The link navigates by itself; this event is for anything else to do.',
      event: {
        link: 'The resolved link: { pageId, href, urlQuery, newTab, ... }.',
        row: 'The row data.',
        value: 'The cell value (the related record for relation cells).',
      },
    },
    onCellButton: {
      description:
        'Documentation reference - the event fired is the `eventName` of each button in a `buttons` cell. Define any number of named events on the block, such as `onEdit`.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        value: 'The cell value.',
        button: 'The clicked button: { eventName, title }.',
        buttonIndex: 'The index of the button in `cell.buttons`.',
      },
    },
    onCellMenuItem: {
      description:
        'Documentation reference - the event fired is the `eventName` of each item in a `menu` cell.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        value: 'The cell value.',
        item: 'The clicked item: { eventName, title }.',
        itemIndex: 'The index of the item in `cell.items`.',
      },
    },
  },
  methods: {
    exportCsv:
      'Download the current view as CSV: visible data columns in order, every row in its current order (every page, rows of collapsed groups included). Accepts `{ filename, formatted }`; `formatted` (default true) exports displayed text. In server mode it fires `onExport { view }` instead.',
    refresh:
      'Server mode: clear the block cache and refetch the visible rows (they stay on screen until the new rows land).',
    applyTransaction:
      "Apply `{ add, update, remove, addIndex, merge }` without replacing `data`: `update` rows are merged into the row with the same key (top-level fields replaced; with `merge: deep` nested objects merge too, so a pushed `{ _id, _enrich: { email: {...} } }` keeps the row's other fields and `_enrich` entries), `remove` takes rows or row keys, `add` rows are appended (or inserted at `addIndex`). Only the touched rows re-render. In client mode the change holds until `data` changes; in server mode updates apply to the loaded rows, and adds or removes also refetch the visible rows. Returns `{ added, updated, removed }`.",
    scrollToRow:
      'Scroll a row into view. Accepts `{ rowKey, align }` with align `auto`, `start` or `center` (default). With pagination, only rows on the current page.',
    clearSelection: 'Clear the row selection.',
    setGroup:
      'Group rows by these columns, outermost first. Accepts column keys or `[{ key }]` of groupable columns; an empty list removes the grouping.',
    selectAllMatching:
      "Select every row the view matches, as `{ all: true, except: [], filter, search }` with the view's filter and search (checkbox selection only). Rows that arrive later and match are selected too; a filter or search change clears the selection.",
    expandAllGroups: 'Expand every group (client data; server groups open one at a time).',
    collapseAllGroups: 'Collapse every group at every level.',
    setFilter:
      'Set `view.filter` to a condition (`{ and | or: [...] }` groups of `{ key, op, value }` leaves), or clear it with null.',
    clearFilters: 'Remove every filter condition. The search stays; clear it with `setSearch`.',
    setSearch:
      'Set `view.search`: rows match when every word appears in the searched columns. An empty string or null clears it.',
    openColumnPicker:
      'Open the add-column picker. Accepts `{ position, kind, provider }` (`position`: `{ before | after: key }`), or `{ key }` to edit that column.',
    openCellDetails:
      'Open the details panel of an enrichment, ai or extract cell. Accepts `{ rowKey, key }` (the column key).',
    openImport: 'Open the CSV import dialog (`importCsv: true`).',
    openColumnManager:
      'Open the column manager: show, hide, reorder and pin columns, or reset them to the default view.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: ['array', 'null'],
        description: 'The columns, in default order.',
        items: column,
        docs: { displayType: 'yaml' },
      },
      defaultColumn: {
        type: 'object',
        additionalProperties: false,
        description: 'Defaults applied to every column.',
        properties: {
          sortable: { ...columnFlags.sortable, default: true },
          filterable: { ...columnFlags.filterable, default: true },
          resizable: { ...columnFlags.resizable, default: true },
          groupable: { ...columnFlags.groupable, default: false },
          editable: { ...columnFlags.editable, default: false },
          ...widthProperties,
          ...textLayout,
        },
      },
      data: {
        type: ['array', 'object', 'null'],
        description:
          'The rows, or `{ mode: server, request, blockSize }` to load rows from a request in blocks as the table scrolls. In server mode the table fires the request with the event `{ startRow, endRow, view: { sort, filter, search, group, aggregates }, groupPath, selected }` (read it in the request `payload` with `_event`) and expects `{ rows, total, groups?, aggregates? }`, the contract of `MongoDBTableQuery`. Sorting, filtering and grouping then run on the server. Rows need a `rowKey`.',
        items: { type: 'object' },
        additionalProperties: false,
        required: ['mode', 'request'],
        properties: {
          mode: {
            type: 'string',
            enum: ['server'],
            description: 'Load rows from `request`.',
          },
          request: {
            type: 'string',
            description: 'Id of the request on the page that returns `{ rows, total }`.',
          },
          blockSize: {
            type: 'integer',
            default: 200,
            description: 'Rows per request. Blocks load as they scroll into view.',
          },
          maxBlocks: {
            type: 'integer',
            default: 20,
            description:
              'Blocks kept in the cache; the least recently used are dropped (and refetched when they come back into view).',
          },
        },
        docs: { displayType: 'yaml' },
      },
      rowKey: {
        type: 'string',
        description:
          'The row field that identifies each row. Defaults to `_id`, then `id`. Rows with neither get a key per row object, which does not survive a refetch.',
      },
      rowVersionField: {
        type: 'string',
        description:
          'Dot path to a field that changes whenever a row changes (for example `updated.timestamp`). When set, rows are compared by key and this field instead of by content; a row without it is compared by content.',
      },
      user: {
        type: 'object',
        description:
          'The user object for `$user` values in filters, `rules`, `rowRules` and button `hidden`/`disabled` conditions, usually `{ _user: true }`. Blocks do not see the session, so conditions read `$user` from this property.',
        docs: { displayType: 'yaml' },
      },
      defaultView: {
        type: 'object',
        additionalProperties: false,
        description:
          'The initial and reset view. Parts missing from the table value fall back to this, then to the column defaults.',
        properties: {
          columns: {
            type: 'array',
            description: 'Column order, widths, pinning and visibility.',
            items: viewColumn,
          },
          sort: {
            type: 'array',
            description: 'Sort order: `[{ key, desc }]`.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['key'],
              properties: {
                key: { type: 'string' },
                desc: { type: 'boolean' },
              },
            },
          },
          filter: {
            type: ['object', 'null'],
            description:
              'Filter condition: `{ and: [...] }` / `{ or: [...] }` groups of `{ key, op, value }` leaves. Operators depend on the column type; `{ $user: path }` values read the `user` property.',
          },
          search: {
            type: ['string', 'null'],
            description:
              'Search text: rows match when every word appears (case-insensitive) in the display text of the searched columns.',
          },
          group: {
            type: 'array',
            description:
              'Group rows by these columns, outermost first: `[{ key }]`. Only columns with `groupable: true` group; groups follow the sort on their column, else option order, else first appearance, and empty values group as "(Empty)" last.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['key'],
              properties: {
                key: { type: 'string' },
              },
            },
          },
          collapsedGroups: {
            type: 'array',
            description:
              'Keys of collapsed groups: the JSON of the group value path, for example `["lead"]` or `["EMEA","Ada"]` (empty values are `null`).',
            items: { type: 'string' },
          },
          aggregates: {
            type: 'object',
            description:
              "Aggregates by column key, for example `{ amount: sum, deals: count }`, over the columns' own `aggregate`. `null` turns a column default off. Group headers show them under their columns.",
          },
          density: {
            type: 'string',
            enum: ['compact', 'default', 'comfortable'],
            description:
              'Row density: compact 32px, default 40px, comfortable 52px rows. Defaults to `size`.',
          },
          wrap: {
            type: 'boolean',
            description:
              'Wrap the text of text-like columns (text, email, phone, url, link, html, relation) that set no `wrap` or `ellipsis` of their own; rows grow to their content. The toolbar density control has a Wrap toggle.',
          },
          pageSize: {
            type: 'integer',
            description:
              'Rows per page when pagination is on. Defaults to the `pageSize` property.',
          },
        },
      },
      rowSelection: {
        type: 'object',
        additionalProperties: false,
        description:
          'Turn on row selection. The selection is the `selected` part of the table value.',
        properties: {
          type: {
            type: 'string',
            enum: ['checkbox', 'radio'],
            default: 'checkbox',
            description: 'Multiple (checkbox) or single (radio) selection.',
          },
          preserve: {
            type: 'boolean',
            default: false,
            description: 'Keep selected keys of rows that leave `data`. Always on in server mode.',
          },
          cascade: {
            type: 'boolean',
            default: false,
            description:
              'In a tree, selecting or clearing a row also selects or clears all its descendants.',
          },
        },
      },
      tree: {
        type: 'object',
        additionalProperties: false,
        description:
          'Show rows as a tree (client data only): rows are indented under their parent with an expand chevron in the first column, Right and Left expand and collapse, sorting sorts within each level and a filter keeps the ancestors of matching rows. The expanded row keys are the `expanded` part of the table value. Give exactly one of `childrenField` or `parentField`.',
        properties: {
          childrenField: {
            type: 'string',
            description: "Dot path to each row's child rows (nested data).",
          },
          parentField: {
            type: 'string',
            description:
              "Dot path to the row key of each row's parent (flat data). Rows whose parent is not in `data` are roots.",
          },
          lazy: {
            type: 'boolean',
            default: false,
            description:
              'Load children on demand: rows whose `hasChildrenField` is true show a chevron before their children are loaded, expanding a row fires `onRowExpand` with `needsChildren: true` until its children are in `data`, and the app adds them (for example a request whose result is merged into the data with `parentField` set).',
          },
          hasChildrenField: {
            type: 'string',
            default: 'hasChildren',
            description:
              'With `lazy`, the field that marks rows with children that are not loaded yet.',
          },
          indent: {
            type: 'number',
            default: 20,
            description: 'Indent per level in pixels.',
          },
        },
      },
      expandable: {
        type: 'object',
        additionalProperties: false,
        description:
          'Expandable rows: a chevron in the first column opens a detail row below the row, as high as its content. The expanded row keys are the `expanded` part of the table value.',
        properties: {
          template: {
            type: 'string',
            description:
              'Nunjucks HTML for the detail row, rendered with `row` and `rowKey`. Output is escaped: use `| safe` to insert HTML from a field. The HTML is sanitised.',
          },
          rowExpandable: {
            type: 'object',
            additionalProperties: false,
            description: 'Which rows can expand.',
            properties: {
              when: {
                type: 'object',
                description:
                  'A condition (`{ key, op, value }`, or `and` / `or` lists) tested against the row.',
              },
            },
          },
        },
      },
      rowLink: {
        type: 'object',
        additionalProperties: false,
        description:
          'Make rows links. A plain click navigates, Cmd/Ctrl or middle click opens a new tab, and Enter on a focused row follows it. Values in `urlQuery` are row paths.',
        properties: {
          pageId: { type: 'string', description: 'The page to open.' },
          href: { type: 'string', description: 'A URL to open instead of a page.' },
          urlQuery: {
            type: 'object',
            description: 'Query parameters; each value is a path in the row, like `{ _id: _id }`.',
            docs: { displayType: 'yaml' },
          },
          input: {
            type: 'object',
            description: 'Input for the page.',
            docs: { displayType: 'yaml' },
          },
          newTab: { type: 'boolean', description: 'Always open in a new tab.' },
        },
      },
      rowRules: {
        type: 'array',
        items: { type: 'object' },
        description:
          'Conditional row formatting: `[{ when, className, style, color }]`, where `when` conditions name columns by `key`.',
        docs: { displayType: 'yaml' },
      },
      size: {
        type: 'string',
        enum: ['compact', 'default', 'comfortable'],
        default: 'default',
        description:
          'Row density: compact 32px, default 40px, comfortable 52px rows. The view starts at this density (`view.density` overrides it).',
      },
      bordered: {
        type: 'boolean',
        default: false,
        description: 'Draw borders between cells.',
      },
      height: {
        type: ['number', 'string'],
        description:
          'A fixed table height (px number or CSS size); the rows scroll under a sticky header and the summary row stays in view. Without it the table grows with its rows up to `maxHeight`.',
        docs: { displayType: 'number' },
      },
      maxHeight: {
        type: ['number', 'string'],
        default: 600,
        description: 'Maximum height when `height` is not set.',
      },
      rowHeight: {
        type: 'number',
        description: 'Row height in pixels. Overrides the density height.',
      },
      virtual: {
        enum: ['auto', true, false],
        default: 'auto',
        description:
          'Virtualise rows and columns. `auto` virtualises rows above 200 and columns above 20 or when the table is wider than twice its viewport.',
      },
      stickyHeader: {
        type: 'boolean',
        default: true,
        description: 'Keep the header visible while the table scrolls.',
      },
      rowDrag: {
        type: ['boolean', 'object'],
        description:
          'Reorder rows by dragging a handle in a leading column, or with Alt+Shift+ArrowUp/Down on a focused row. Not available while the table is sorted (except ascending by the position field), filtered or grouped, in a tree or in server mode; the handle is disabled with a tooltip saying why. Table fires onRowMove; TableInput records the move in its value. `true`, or `{ positionField }` for fractional positions.',
        additionalProperties: false,
        properties: {
          positionField: {
            type: 'string',
            description:
              'Dot path of a numeric position field the rows are ordered by. A move gives only the moved row a new position: the midpoint of its new neighbours (a neighbour ∓ 1024 at the ends), renumbering the list in steps of 1024 only when there is no room left.',
          },
        },
      },
      headerMenu: {
        type: 'boolean',
        default: true,
        description:
          'Show the column menu button in each header (on hover or focus): sort, filter, pin, freeze, autosize, hide and the column manager.',
      },
      reorderable: {
        type: 'boolean',
        default: true,
        description: 'Reorder columns by dragging their headers.',
      },
      keyboard: {
        type: ['boolean', 'object'],
        default: true,
        description:
          'Keyboard navigation between cells. Grid roles stay on when off, and so do Ctrl/Cmd+C copy and the keys of a focused group header. An object turns it on with options.',
        additionalProperties: false,
        properties: {
          next: {
            type: 'boolean',
            default: false,
            description:
              'After a row button, menu item or single-key action completes, move focus to the next row (queue and triage lists).',
          },
        },
      },
      toolbar: {
        type: ['boolean', 'object'],
        default: false,
        description:
          'The toolbar above the table. `true` turns on every item; an object turns on the listed items.',
        additionalProperties: false,
        properties: {
          views: toolbarItem('Saved view tabs (needs `views`), with the unsaved changes strip.'),
          search: toolbarItem(
            'A search box that writes `view.search` (Cmd/Ctrl+F focuses it while the table has focus).'
          ),
          quickFilters: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Column keys to show as quick filter chips. Columns with `options` get a checkbox list (an `in` condition); others open the column filter.',
          },
          filter: toolbarItem('A Filter button that edits the whole `view.filter`.'),
          sort: toolbarItem('A Sort button to add, remove, reorder and flip sort levels.'),
          group: toolbarItem('A Group button to pick and order group levels (groupable columns).'),
          columns: toolbarItem('A Columns button that opens the column manager.'),
          density: toolbarItem(
            'A compact / default / comfortable density toggle, with a Wrap toggle for `view.wrap`.'
          ),
          export: toolbarItem('An Export button that downloads the view as CSV.'),
        },
      },
      views: {
        type: ['array', 'null'],
        description:
          'Saved views, from any source (often a request). Selecting a tab loads its view; changes show an unsaved changes strip with Save, Save as and Discard.',
        items: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: ['string', 'number', 'object'],
              description:
                'Unique view id: a string, number, or an ObjectId from a MongoDB request (`{ _oid }`, keyed by its hex). Events carry it as given.',
            },
            title: { type: 'string', description: 'Tab title. Defaults to the id.' },
            view: { type: 'object', description: 'The saved view (any part of a view).' },
            shared: { type: 'boolean', description: 'Whether the view is shared.' },
            locked: {
              type: 'boolean',
              description: 'Hide Save and Delete, so the view is only changed on purpose.',
            },
            count: { type: 'number', description: 'A count shown on the tab (queue tabs).' },
          },
        },
      },
      activeView: {
        type: ['string', 'number', 'object', 'null'],
        description:
          'The id of the active saved view (an ObjectId id matches by its hex). Defaults to the first view. Changing it selects that view.',
      },
      persist: {
        type: 'object',
        additionalProperties: false,
        required: ['key'],
        description:
          "Keep the user's view between visits. Off by default. The selection is never persisted.",
        properties: {
          key: {
            type: 'string',
            description: 'Storage key (localStorage) or query parameter name (url).',
          },
          storage: {
            type: 'string',
            enum: ['local', 'url'],
            default: 'local',
            description:
              '`local` keeps the view in localStorage (none in a private window or with blocked storage); `url` writes a compact encoding to the query string, replacing history.',
          },
        },
      },
      emptyText: {
        type: 'string',
        default: 'No data',
        description: 'What to show when there are no rows - supports html.',
      },
      loading: {
        type: 'boolean',
        default: false,
        description: 'Show the loading state: skeleton rows without data, a progress bar with it.',
      },
      pagination: {
        type: 'boolean',
        default: false,
        description:
          'Show the rows in pages of `pageSize` with a pager below the table. Off by default, unlike TableLight: the Table scrolls any number of rows virtually. `true` means what it means on TableLight: pages, with the pager always shown.',
      },
      pageSize: {
        type: 'integer',
        default: 50,
        description: 'Rows per page when `pagination` is on (`view.pageSize` overrides it).',
      },
      providers: {
        type: 'array',
        description:
          "The enrichment providers columns can call (`kind: enrichment`), the catalogue the add-column picker offers. Each maps, on the server, to the app's `enrich_{id}` endpoint, so a column only calls what the app exposes.",
        items: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'The provider id, the column `provider`.' },
            title: { type: 'string', description: 'The name in the picker.' },
            description: { type: 'string', description: 'A line under the name in the picker.' },
            icon: { description: 'An icon for the provider.' },
            inputs: {
              type: 'array',
              description:
                'The inputs, `[{ key, title, type, required }]`, mapped to columns or literals in the picker.',
              items: { type: 'object' },
            },
            outputs: {
              type: 'array',
              description:
                'Paths in the result a column can show, `[{ path, title, type }]`; the picker sets the column type from it.',
              items: { type: 'object' },
            },
            cost: { type: 'number', description: 'The cost of one call, for the app to show.' },
          },
        },
        docs: { displayType: 'yaml' },
      },
      addColumn: {
        type: ['boolean', 'object'],
        description:
          'Show a "+" at the end of the header that opens the add-column picker (onColumnAdd). `true` offers every kind; `{ kinds: [...] }` only those (`input`, `formula`, `enrichment`, `ai`, `extract`).',
        properties: {
          kinds: {
            type: 'array',
            items: { type: 'string', enum: Object.keys(COLUMN_KINDS) },
            description: 'The column kinds the picker offers.',
          },
        },
      },
      addRow: {
        type: 'boolean',
        default: false,
        description:
          'Show a "+ New row" row under the table that opens an inline editor for the input columns; Enter adds the row through onRowAdd.',
      },
      addRowText: {
        type: 'string',
        default: 'New row',
        description: 'Text of the new-row row.',
      },
      inputFieldPrefix: {
        type: 'string',
        description:
          'Where user-defined input columns added in the picker or by a CSV import keep their values: under this path, then the column key (with `values`, a `notes` column stores at `values.notes`, so a column can never name another field of the row). The column is sent with that `field`, and onRowAdd / onImport values sit at it. Without it, at the key.',
      },
      importCsv: {
        type: 'boolean',
        default: false,
        description:
          'Show an Import button in the toolbar: a CSV file is parsed in the browser, its headers mapped to input columns (or new text columns), and the rows sent through onImport in batches of 500.',
      },
      summary: {
        type: 'boolean',
        default: true,
        description:
          'Show the summary footer when any aggregate is in effect: a column `aggregate`, or one the view sets in `view.aggregates`. `false` hides it.',
      },
    },
  },
};
