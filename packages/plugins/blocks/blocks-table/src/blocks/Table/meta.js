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

const columnFlags = {
  sortable: {
    type: 'boolean',
    description: 'Sort by clicking the header (Shift+click adds to a multi-sort).',
  },
  filterable: {
    type: 'boolean',
    description: 'Offer the column in filters.',
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
    type: 'boolean',
    description: 'Allow editing cells of this column (fires onCellEdit).',
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
  ellipsis: {
    type: 'integer',
    description: 'Clamp cell text to this many lines.',
  },
  wrap: {
    type: 'boolean',
    description: 'Wrap cell text instead of truncating it.',
  },
};

const pinned = {
  type: 'string',
  enum: ['start', 'end'],
  description: 'Pin the column to the start or end, where it stays visible while scrolling.',
};

const column = {
  type: 'object',
  additionalProperties: false,
  description: 'A column. `key` (or `field`) is required.',
  properties: {
    key: {
      type: 'string',
      description: 'Stable column id used in the view. Defaults to `field`.',
    },
    field: {
      type: 'string',
      description: 'Dot path to the value in the row. Defaults to `key`.',
    },
    title: {
      type: 'string',
      description: 'Header title (HTML allowed). Defaults to the humanised key.',
    },
    type: {
      type: 'string',
      description: 'Cell type, for example text, number, date, tag, link. Default text.',
    },
    cell: {
      type: 'object',
      description:
        "Options for the column's cell type. Row buttons (`buttons`) and menu items (`items`) accept `key`, a single key that fires the item when its row is focused, for example `key: a` (no editor open, no modifier).",
    },
    ...widthProperties,
    flex: {
      type: 'number',
      description: 'Grow into spare table width, by this weight.',
    },
    align: {
      type: 'string',
      enum: ['start', 'center', 'end'],
      description: 'Cell alignment. Defaults from the type (numbers align end).',
    },
    pinned,
    hidden: {
      type: 'boolean',
      description: 'Declared but hidden by default.',
    },
    ...columnFlags,
    aggregate: {
      type: 'string',
      enum: [
        'sum',
        'avg',
        'min',
        'max',
        'count',
        'countDistinct',
        'countEmpty',
        'countNotEmpty',
        'percentEmpty',
        'earliest',
        'latest',
      ],
      description:
        'Default aggregate for this column, shown in group headers (and the summary footer). The view `aggregates` overrides it.',
    },
    options: {
      type: ['array', 'object'],
      description: 'Labels and colours for enum values: a list or a map of value to label.',
    },
    tooltip: {
      type: ['object', 'string'],
      description: 'Cell tooltip: a string, `{ field }` or `{ template }`.',
    },
    headerTooltip: {
      type: 'string',
      description: 'Header tooltip.',
    },
    rules: {
      type: 'array',
      description: 'Conditional formatting: `[{ when, color, className, style }]`.',
    },
    validate: {
      type: 'array',
      description: 'Cell validation: `[{ pass, message }]`.',
    },
    children: {
      type: 'array',
      description: 'Child columns under a header group titled by `title`.',
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
    toolbarStart: 'Blocks at the start of the toolbar, for example a "New deal" button.',
    toolbarEnd: 'Blocks at the end of the toolbar.',
    bulkActions: 'Blocks in the bulk action bar, shown while rows are selected.',
    empty: 'Blocks shown instead of the empty state when there are no rows.',
  },
  // rowLink navigates through an internal event running the Link action with `_event`.
  actions: ['Link'],
  operators: ['_event'],
  cssKeys: {
    element: 'The table root element.',
    header: 'The header row group.',
    row: 'Every body row.',
  },
  events: {
    onChange: {
      description:
        'Trigger when the table value changes through the table: a sort, a resize or reorder that ends, or a selection.',
      event: {
        value: 'The table value `{ view, selected, expanded }`.',
        cause:
          'What changed: `sort`, `columns`, `select`, `group` (the grouping levels), `expand` (a group collapsed or expanded), `filter`, `search`, `density`, or `view` (a saved view loaded, discarded to, or selected).',
      },
    },
    onSelectionChange: {
      description: 'Trigger when the row selection changes.',
      event: {
        selected: 'The selected row keys, or `{ all: true, except }`.',
        rows: 'The selected row objects that are loaded.',
      },
    },
    onRowClick: {
      description:
        'Trigger when a row is clicked (not a control inside it, and not the end of a text selection), or activated with Enter.',
      event: {
        row: 'The row object.',
        rowKey: 'The row key.',
        index: 'The index of the row in `data`.',
      },
    },
    onRowDoubleClick: {
      description: 'Trigger when a row is double clicked.',
      event: {
        row: 'The row object.',
        rowKey: 'The row key.',
        index: 'The index of the row in `data`.',
      },
    },
    onCellClick: {
      description: 'Trigger when a cell is clicked (not a control inside it).',
      event: {
        row: 'The row object.',
        rowKey: 'The row key.',
        column: 'The column `{ key, field }`.',
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
    onCellLink: {
      description: 'Trigger when a link cell is clicked.',
      event: {
        link: 'The resolved link.',
        row: 'The row object.',
        value: 'The cell value.',
      },
    },
  },
  methods: {
    exportCsv:
      'Download the current view as CSV: visible columns in order, rows in their current order. Accepts `{ filename, formatted }`; `formatted` (default true) exports displayed text.',
    scrollToRow:
      'Scroll a row into view. Accepts `{ rowKey, align }` with align `auto`, `start` or `center` (default).',
    clearSelection: 'Clear the row selection.',
    setGroup:
      'Group rows by these columns, outermost first. Accepts column keys or `[{ key }]` of groupable columns; an empty list removes the grouping.',
    selectAllMatching:
      'Select every row the view matches, as `{ all: true, except: [] }` (checkbox selection only).',
    expandAllGroups: 'Expand every group.',
    collapseAllGroups: 'Collapse every group at every level.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: 'array',
        description: 'The columns, in default order.',
        items: column,
      },
      defaultColumn: {
        type: 'object',
        additionalProperties: false,
        description: 'Defaults applied to every column.',
        properties: {
          ...columnFlags,
          ...widthProperties,
        },
      },
      data: {
        type: 'array',
        description: 'The rows.',
        items: { type: 'object' },
      },
      rowKey: {
        type: 'string',
        description:
          'Dot path to the unique row key. Defaults to `_id`, then `id`. Rows without a key are keyed per object and lose their identity when data is refetched.',
      },
      rowVersionField: {
        type: 'string',
        description:
          'Field that changes whenever a row changes (for example `updated_at`). When set, rows are compared by key and this field instead of by content.',
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
            description: 'Filter condition.',
          },
          search: {
            type: ['string', 'null'],
            description: 'Search text.',
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
            description: 'Row density: compact 32px, default 40px, comfortable 52px rows.',
          },
          wrap: {
            type: 'boolean',
            description: 'Wrap cell text.',
          },
          pageSize: {
            type: 'number',
            description: 'Rows per page when pagination is on.',
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
            description: 'Keep selected keys of rows that leave `data`.',
          },
        },
      },
      rowLink: {
        type: 'object',
        additionalProperties: false,
        description:
          'Make rows links: a click navigates, Cmd/Ctrl or middle click opens a new tab. Values in `urlQuery` are row paths.',
        properties: {
          pageId: { type: 'string', description: 'Page to link to.' },
          urlQuery: {
            type: 'object',
            description: 'URL query; each value is a dot path into the row.',
          },
          href: { type: 'string', description: 'External URL to link to.' },
          newTab: { type: 'boolean', description: 'Always open in a new tab.' },
          input: { type: 'object', description: 'Input for the linked page.' },
        },
      },
      height: {
        type: ['number', 'string'],
        description:
          'Table height (px number or CSS size). Without it the table grows with its rows up to `maxHeight`.',
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
      reorderable: {
        type: 'boolean',
        default: true,
        description: 'Reorder columns by dragging their headers.',
      },
      keyboard: {
        type: ['boolean', 'object'],
        default: true,
        description:
          'Keyboard navigation between cells. Grid roles stay on when off. An object turns it on with options.',
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
          density: toolbarItem('A compact / default / comfortable density toggle.'),
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
            id: { type: ['string', 'number'], description: 'Unique view id.' },
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
        type: ['string', 'number', 'null'],
        description:
          'The id of the active saved view. Defaults to the first view. Changing it selects that view.',
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
        description: 'Text shown when there are no rows.',
      },
      loading: {
        type: 'boolean',
        default: false,
        description: 'Show the loading state: skeleton rows without data, a progress bar with it.',
      },
    },
  },
};
