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

import AGGREGATE_LABELS from '../../table/aggregateLabels.js';
import CELL_TYPE_FAMILIES from '../../table/cellTypeFamilies.js';
import TABLE_ONLY_KEYS from './tableOnlyKeys.js';

// Table-only keys are matched by pattern rather than listed as properties, so
// they fail with a message that names Table without showing up as settings
// in the docs. The message completes "Block "TableLight" property "<key>" ...".
function tableOnly(keys) {
  return Object.fromEntries(
    Object.entries(keys).map(([key, feature]) => [
      `^${key}$`,
      { not: {}, errorMessage: `is not supported. Use Table for ${feature}` },
    ])
  );
}

const column = {
  type: ['object', 'string'],
  description: 'A column, or just its key.',
  additionalProperties: false,
  patternProperties: tableOnly(TABLE_ONLY_KEYS.columns),
  properties: {
    key: {
      type: 'string',
      description:
        'The column id, unique in the table. Defaults to `field`. Two columns showing the same field need their own keys.',
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
        'Options for the cell type, using the AgGrid `cell` keys where they overlap. number, currency, percent: `format`, `locale`, `currency`, `decimals`, `minDecimals`, `maxDecimals`, `notation`, `useGrouping`, `negative`, `prefix`, `suffix`, `signColor`, `positiveColor`, `negativeColor`, `zeroColor`, `color`, `thresholds`, `colors`. date, datetime: `format` (dayjs), `relative`. boolean: `trueLabel`, `falseLabel`, `trueColor`, `falseColor`, `trueIcon`, `falseIcon`. tag, tags, status: `colorMap`, `colorFrom`, `default`, `max` (tags). avatar: `nameField`, `srcField`, `idField`, `shape`, `link`. people: `nameField`, `srcField`, `idField` (paths in each person), `max`, `shape`. link: `pageId`, `href`, `urlQuery` (row paths), `newTab`, `home`, `back`, `input`, `labelField`. url: `label`, `labelField`, `newTab`. relation: `labelField`, `pageId`, `href`, `urlQuery` (paths in the related record, default `{ _id: _id }`), `newTab`. progress: `max`, `suffix`, `color`, `thresholds`, `colors`, `showValue`, `nullLabel`. rating: `max`, `color`. image: `width`, `height`, `shape`, `alt`, `altField`. html: `template` (nunjucks with `value` and `row`, autoescaped). buttons: `buttons`, `showOn`. menu: `items`, `icon`, `title`, `placement`.',
      docs: { displayType: 'yaml' },
    },
    width: { type: 'number', description: 'The column width in pixels.' },
    minWidth: { type: 'number', description: 'The smallest width in pixels.' },
    align: {
      type: 'string',
      enum: ['start', 'center', 'end'],
      description: 'Horizontal alignment. Defaults to `end` for number, currency and percent.',
    },
    pinned: {
      type: 'string',
      enum: ['start', 'end'],
      description: 'Keep the column in view while the table scrolls sideways.',
    },
    ellipsis: {
      type: ['integer', 'boolean'],
      description:
        'Clamp the text to this many lines (`true` is one) with an ellipsis; the full text shows on hover. Needs a `width` to take effect.',
      docs: { displayType: 'number' },
    },
    wrap: {
      type: 'boolean',
      default: false,
      description: 'Wrap long text. Text stays on one line by default.',
    },
    hidden: { type: 'boolean', default: false, description: 'Declare the column but hide it.' },
    sortable: {
      type: 'boolean',
      description: 'Sort by clicking the header. Defaults to `defaultColumn.sortable` (true).',
    },
    aggregate: {
      type: 'string',
      enum: Object.keys(AGGREGATE_LABELS),
      description:
        'A calculation shown in the summary row, over all rows: sum, avg, min, max, count, countDistinct, countEmpty, countNotEmpty, percentEmpty, earliest or latest.',
    },
    options: {
      type: ['array', 'object'],
      description:
        'Labels and colours for enum values, for tag, tags and status cells: a list of values or `{ value, label, color, icon }`, or a map from value to a label or `{ label, color, icon }`. Colours are antd presets, status names (success, warning, error, processing) or CSS colours. Enums sort in option order.',
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
        'Conditional formatting: `[{ when, color, className, style }]`. Every rule whose `when` condition holds applies, in order. `color` takes status names (success, warning, error, info) or CSS colours.',
      items: { type: 'object' },
      docs: { displayType: 'yaml' },
    },
    children: {
      type: 'array',
      description: 'Columns grouped under this header. A group needs a `title`.',
      items: { type: ['object', 'string'] },
      docs: { displayType: 'yaml' },
    },
  },
};

export default {
  category: 'display',
  icons: ['more-vertical'],
  valueType: null,
  cssKeys: {
    element: 'The TableLight element.',
  },
  // Cell buttons and menu items declare their own eventName, so the event
  // names this block fires are authored in its properties.
  dynamicEvents: true,
  events: {
    onRowClick: {
      description:
        'Trigger actions when a row is clicked. Clicks on buttons, links, menus and `data-event` elements in a cell, and clicks that end a text selection, do not trigger it. With `rowLink`, a plain click runs onRowClick instead of following the link.',
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
  properties: {
    type: 'object',
    additionalProperties: false,
    patternProperties: tableOnly(TABLE_ONLY_KEYS.properties),
    properties: {
      data: {
        type: ['array', 'null'],
        items: { type: 'object' },
        description: 'The rows to show.',
        errorMessage: {
          type: 'must be an array of rows. Use Table for server mode (data.mode: server)',
        },
        docs: { displayType: 'yaml' },
      },
      rowKey: {
        type: 'string',
        description:
          'The row field that identifies each row. Defaults to `_id`, then `id`. Rows with neither get a key per row object, which does not survive a refetch.',
      },
      columns: {
        type: ['array', 'null'],
        items: column,
        description: 'The columns, in order.',
        docs: { displayType: 'yaml' },
      },
      defaultColumn: {
        type: 'object',
        description: 'Defaults applied to every column.',
        additionalProperties: false,
        patternProperties: tableOnly(TABLE_ONLY_KEYS.columns),
        properties: {
          sortable: {
            type: 'boolean',
            default: true,
            description: 'Sort by clicking a header.',
          },
          wrap: {
            type: 'boolean',
            default: false,
            description: 'Wrap long text.',
          },
          ellipsis: {
            type: 'integer',
            description: 'Clamp text to this many lines.',
          },
        },
      },
      user: {
        type: 'object',
        description:
          'The user object for `$user` values in `rules`, `rowRules` and button `hidden`/`disabled` conditions, usually `{ _user: true }`. Blocks do not see the session, so conditions read `$user` from this property.',
        docs: { displayType: 'yaml' },
      },
      rowLink: {
        type: 'object',
        description:
          'Make rows links. A plain click navigates, Cmd/Ctrl or middle click opens a new tab. Values in `urlQuery` are row paths.',
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
        description: 'Row density.',
      },
      bordered: {
        type: 'boolean',
        default: false,
        description: 'Draw borders around cells.',
      },
      height: {
        type: ['number', 'string'],
        description:
          'A fixed body height; the rows scroll under a sticky header and the summary row stays in view.',
        docs: { displayType: 'number' },
      },
      emptyText: {
        type: 'string',
        description: 'What to show when there are no rows - supports html.',
      },
      loading: {
        type: 'boolean',
        default: false,
        description: 'Show a loading spinner over the table.',
      },
      pagination: {
        type: 'boolean',
        description:
          'Pages are shown only when there are more rows than `pageSize`. `false` shows every row on one page; `true` always shows the pager.',
      },
      pageSize: {
        type: 'integer',
        default: 50,
        description: 'Rows per page.',
      },
      summary: {
        type: 'boolean',
        default: true,
        description:
          'Show the summary row when a column declares an `aggregate`. `false` hides it.',
      },
    },
  },
};
