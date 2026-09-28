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
    description: 'Offer the column in filters.',
  },
  resizable: {
    type: 'boolean',
    description: 'Resize the column by dragging the right edge of its header.',
  },
  groupable: {
    type: 'boolean',
    description: 'Allow grouping rows by this column.',
  },
  editable: {
    type: 'boolean',
    description: 'Allow editing cells of this column (fires onCellEdit).',
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
        'Options for the cell type, the same keys as TableLight (and the AgGrid `cell` keys where they overlap), for example `format`, `currency`, `relative`, `pageId`/`urlQuery` (link), `template` (html), `buttons` and `showOn` (buttons), `items` (menu).',
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
    aggregate: {
      type: 'string',
      enum: Object.keys(AGGREGATE_LABELS),
      description:
        'A calculation shown in the summary footer, over all rows: sum, avg, min, max, count, countDistinct, countEmpty, countNotEmpty, percentEmpty, earliest or latest.',
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
      description: 'Cell validation: `[{ pass, message }]`.',
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
  category: 'input',
  valueType: 'object',
  icons: [],
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
        'Trigger when the table value changes through the table: a sort, a resize or reorder that ends, or a selection.',
      event: {
        value: 'The table value `{ view, selected, expanded }`.',
        cause: 'What changed: `sort`, `columns` or `select`.',
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
        'Trigger when a row is clicked, or activated with Enter. Clicks on buttons, links, menus and `data-event` elements in a cell, and clicks that end a text selection, do not trigger it. With `rowLink`, a plain click runs onRowClick instead of following the link.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        index: 'The index of the row in `data`.',
      },
    },
    onRowDoubleClick: {
      description: 'Trigger when a row is double clicked.',
      event: {
        row: 'The row data.',
        rowKey: 'The row key.',
        index: 'The index of the row in `data`.',
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
      'Download the current view as CSV: visible data columns in order, every row in its current order. Accepts `{ filename, formatted }`; `formatted` (default true) exports displayed text.',
    scrollToRow:
      'Scroll a row into view. Accepts `{ rowKey, align }` with align `auto`, `start` or `center` (default). With pagination, only rows on the current page.',
    clearSelection: 'Clear the row selection.',
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
        type: ['array', 'null'],
        description: 'The rows to show.',
        items: { type: 'object' },
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
          'Field that changes whenever a row changes (for example `updated_at`). When set, rows are compared by key and this field instead of by content.',
      },
      user: {
        type: 'object',
        description:
          'The user object for `$user` values in `rules`, `rowRules` and button `hidden`/`disabled` conditions, usually `{ _user: true }`. Blocks do not see the session, so conditions read `$user` from this property.',
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
            description: 'Filter condition.',
          },
          search: {
            type: ['string', 'null'],
            description: 'Search text.',
          },
          group: {
            type: 'array',
            description: 'Group by: `[{ key }]`.',
          },
          collapsedGroups: {
            type: 'array',
            description: 'Collapsed group keys.',
          },
          aggregates: {
            type: 'object',
            description: 'Aggregates by column key.',
          },
          density: {
            type: 'string',
            enum: ['compact', 'default', 'comfortable'],
            description:
              'Row density: compact 32px, default 40px, comfortable 52px rows. Defaults to `size`.',
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
      reorderable: {
        type: 'boolean',
        default: true,
        description: 'Reorder columns by dragging their headers.',
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'Keyboard navigation between cells. Grid roles stay on when off.',
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
        description: 'Rows per page when `pagination` is on.',
      },
      summary: {
        type: 'boolean',
        default: true,
        description:
          'Show the summary footer when a column declares an `aggregate`. `false` hides it.',
      },
    },
  },
};
