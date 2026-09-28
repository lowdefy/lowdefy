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
      description: "Options for the column's cell type.",
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
    children: {
      type: 'array',
      description: 'Child columns under a header group titled by `title`.',
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
  // rowLink navigates through an internal event running the Link action with `_event`; server
  // mode fetches through an internal event running the Request action.
  actions: ['Link', 'Request'],
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
          'What changed: `sort`, `columns`, `select`, `group` (the grouping levels), `aggregate` (group aggregates) or `expand` (a group, tree row or detail row collapsed or expanded).',
      },
    },
    onSelectionChange: {
      description:
        'Trigger when the row selection changes. In server mode the header checkbox selects every row the view matches as `{ all: true, except: [] }`; resolve it on the server with the same view.',
      event: {
        selected: 'The selected row keys, or `{ all: true, except }`.',
        rows: 'The selected row objects that are loaded.',
      },
    },
    onRowExpand: {
      description:
        "Trigger when a tree row or an expandable row is expanded or collapsed. With `tree.lazy`, load the row's children here and add them to `data`.",
      event: {
        row: 'The row object.',
        rowKey: 'The row key.',
        expanded: 'True when the row was expanded, false when it was collapsed.',
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
        fromIndex: 'The display index the row was at.',
        toIndex: 'The display index the row is at now.',
        beforeKey: 'The key of the row now before it, or null at the top.',
        afterKey: 'The key of the row now after it, or null at the bottom.',
        position: "With a positionField: the moved row's new position.",
        positions:
          'With a positionField: `{ [rowKey]: position }` of every row whose position changed.',
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
      'Download the current view as CSV: visible columns in order, rows in their current order. Accepts `{ filename, formatted }`; `formatted` (default true) exports displayed text. In server mode it fires `onExport { view }` instead.',
    refresh:
      'Server mode: clear the block cache and refetch the visible rows (they stay on screen until the new rows land).',
    applyTransaction:
      'Apply `{ add, update, remove, addIndex }` without replacing `data`: `update` rows are merged into the row with the same key, `remove` takes rows or row keys, `add` rows are appended (or inserted at `addIndex`). Only the touched rows re-render. In client mode the change holds until `data` changes; in server mode updates apply to the loaded rows, and adds or removes also refetch the visible rows. Returns `{ added, updated, removed }`.',
    scrollToRow:
      'Scroll a row into view. Accepts `{ rowKey, align }` with align `auto`, `start` or `center` (default).',
    clearSelection: 'Clear the row selection.',
    setGroup:
      'Group rows by these columns, outermost first. Accepts column keys or `[{ key }]` of groupable columns; an empty list removes the grouping.',
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
        type: ['array', 'object'],
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
              'Load children on demand: rows whose `hasChildrenField` is true show a chevron before their children are loaded, expanding a row fires `onRowExpand`, and the app adds the children to `data` (for example a request whose result is merged into the data with `parentField` set).',
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
      rowDrag: {
        type: ['boolean', 'object'],
        description:
          'Reorder rows by dragging a handle in a leading column, or with Alt+Shift+ArrowUp/Down on a focused row. Not available while the table is sorted (except ascending by the position field), filtered or grouped; the handle is disabled with a tooltip saying why. Table fires onRowMove; TableInput records the move in its value. `true`, or `{ positionField }` for fractional positions.',
        additionalProperties: false,
        properties: {
          positionField: {
            type: 'string',
            description:
              'Dot path of a numeric position field the rows are ordered by. A move gives only the moved row a new position: the midpoint of its new neighbours (a neighbour ∓ 1024 at the ends), renumbering the list in steps of 1024 only when there is no room left.',
          },
        },
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
