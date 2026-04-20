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

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The AgGridMaterial element.',
  },
  events: {
    onCellClick: {
      description: 'Trigger event when a cell is clicked.',
      event: {
        cell: 'The clicked cell with column and value.',
        colId: 'The column id.',
        row: 'The row data.',
        rowIndex: 'The row index.',
        selected: 'All selected rows.',
      },
    },
    onFilterChanged: {
      description: 'Trigger event when the filter changes.',
      event: { rows: 'The displayed rows after filtering.', filter: 'The filter model.' },
    },
    onRowClick: {
      description: 'Trigger event when a row is clicked.',
      event: { row: 'The row data.', selected: 'All selected rows.', rowIndex: 'The row index.' },
    },
    onRowSelected: {
      description: 'Trigger event when a row is selected.',
      event: { row: 'The row data.', rowIndex: 'The row index.', selected: 'All selected rows.' },
    },
    onSelectionChanged: {
      description: 'Triggered when the selected rows are changed.',
      event: { selected: 'All selected rows.' },
    },
    onSortChanged: {
      description: 'Trigger event when the sort changes.',
      event: { rows: 'The displayed rows after sorting.', sort: 'The sort column state.' },
    },
    onCellLink: {
      description:
        'Triggered when a built-in `cell.type: link` (or avatar with `link`) cell is clicked. Wire to a `Link` action with `params: { _event: link }` to navigate.',
      event: {
        link: 'The resolved link config (pageId/href/urlQuery/back/home/newTab).',
        row: 'The row data.',
        value: 'The cell value.',
      },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      height: {
        type: ['number', 'string'],
        default: 'auto',
        description: 'Specify table height explicitly, in pixel.',
      },
      rowData: {
        type: 'array',
        description: 'The list of data to display on the table.',
      },
      rowId: {
        type: 'string',
        description:
          'The data field to use in `getRowId` which results in Row Selection being maintained across Row Data changes (assuming the Row exists in both sets). See Ag Grid docs for more details (https://www.ag-grid.com/react-data-grid/data-update-row-data/).',
      },
      enableBrowserTooltips: {
        type: 'boolean',
        default: false,
        description:
          "Set to `true` to use the browser native `title` attribute tooltips instead of AG Grid's styled tooltip component.",
      },
      tooltipShowDelay: {
        type: 'number',
        default: 2000,
        description:
          'The delay in milliseconds before a tooltip is shown. Not applied when `enableBrowserTooltips` is `true`.',
      },
      tooltipHideDelay: {
        type: 'number',
        default: 10000,
        description:
          'The delay in milliseconds before a tooltip is hidden. Not applied when `enableBrowserTooltips` is `true`.',
      },
      defaultColDef: {
        type: 'object',
        description:
          'Column properties which get applied to all columns. See all (https://www.ag-grid.com/javascript-data-grid/column-properties/).',
      },
      columnDefs: {
        type: 'array',
        description: 'A list of properties for each column.',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description:
                "The field of the row object to get the cell's data from. Deep references into a row object is supported via dot notation, i.e 'address.firstLine'.",
            },
            headerName: {
              type: 'string',
              description:
                'The name to render in the column header. If not specified and field is specified, the field name will be used as the header name.',
            },
            filter: {
              type: 'boolean',
              default: false,
              description:
                'Filter component to use for this column. Set to true to use the default filter.',
            },
            sortable: {
              type: 'boolean',
              default: false,
              description: 'Set to true to allow sorting on this column.',
            },
            resizable: {
              type: 'boolean',
              default: false,
              description: 'Set to true to allow this column should be resized.',
            },
            width: {
              type: 'number',
              description: 'Initial width in pixels for the cell.',
            },
            cellStyle: {
              type: 'number',
              description:
                'An object of css values returning an object of css values for a particular cell.',
            },
            cellRenderer: {
              type: 'object',
              description:
                "Provide your own cell Renderer function (using the `_function` operator) for this column's cells.",
            },
            valueFormatter: {
              type: ['object', 'string'],
              description:
                'A function (using the `_function` operator) or expression to format a value, should return a string. Not used for CSV export or copy to clipboard, only for UI cell rendering.',
            },
            tooltipField: {
              type: 'string',
              description:
                "The field of the row object to read the tooltip value from. When set, hovering a cell shows a tooltip with that value using the grid's default tooltip component.",
            },
            tooltipValueGetter: {
              type: 'object',
              description:
                'Provide a function (using the `_function` operator) that returns the tooltip value for a cell. Overrides `tooltipField`.',
            },
            tooltipComponent: {
              type: 'object',
              description:
                'Provide a custom tooltip component. See AG Grid tooltip component docs (https://www.ag-grid.com/react-data-grid/component-tooltip/).',
            },
            ellipsis: {
              type: 'number',
              description:
                'Line-clamp count for long text. Automatically enables `wrapText` and `autoHeight` and applies the `.lf-ellipsis-N` class (1–6).',
            },
            cell: {
              type: 'object',
              description:
                'Built-in cell renderer. Takes precedence over `cellRenderer` when `type` is set. Field-valued keys (e.g. `nameField`, `srcField`, `urlQuery.*`) are row-data paths.',
              properties: {
                type: {
                  type: 'string',
                  enum: ['tag', 'avatar', 'link', 'date', 'boolean', 'progress', 'number'],
                  description: 'The built-in renderer to use.',
                },
                colorMap: {
                  type: 'object',
                  description:
                    'Tag: map of cell value → color (antd tag color name or hex). Used when `cell.type: tag`.',
                },
                colorFrom: {
                  type: 'string',
                  description:
                    'Tag: row-data path to a color value. Takes precedence over `colorMap`.',
                },
                default: {
                  type: 'string',
                  description: 'Tag: fallback color for values not in `colorMap`.',
                },
                nameField: {
                  type: 'string',
                  description: 'Avatar: row-data path for the name label.',
                },
                srcField: {
                  type: 'string',
                  description: 'Avatar: row-data path for the image src (optional).',
                },
                idField: {
                  type: 'string',
                  description: 'Avatar: row-data path for an id used to seed initials colour.',
                },
                shape: {
                  type: 'string',
                  enum: ['circle', 'square'],
                  description: 'Avatar shape. Defaults to `circle`.',
                },
                link: {
                  type: 'object',
                  description:
                    'Avatar/Link: navigation config. Emits `onCellLink` on click. `pageId`/`href`/`back`/`home`/`newTab` are literal; `urlQuery` values are row-data paths.',
                },
                pageId: { type: 'string', description: 'Link: target page id (literal).' },
                href: { type: 'string', description: 'Link: literal href (overrides `pageId`).' },
                back: { type: 'boolean', description: 'Link: navigate back.' },
                home: { type: 'boolean', description: 'Link: navigate home.' },
                newTab: { type: 'boolean', description: 'Link: open in a new tab.' },
                urlQuery: {
                  type: 'object',
                  description: 'Link: query params. Each value is a row-data path.',
                },
                labelField: {
                  type: 'string',
                  description:
                    'Link: row-data path for the visible label (falls back to cell value).',
                },
                format: {
                  type: 'string',
                  description: 'Date: dayjs format string. Default `YYYY-MM-DD HH:mm`.',
                },
                relative: {
                  type: 'boolean',
                  description: 'Date: render as relative time (e.g. "3 hours ago").',
                },
                trueLabel: { type: 'string', description: 'Boolean: label when truthy.' },
                falseLabel: { type: 'string', description: 'Boolean: label when falsy.' },
                trueColor: { type: 'string', description: 'Boolean: CSS colour when truthy.' },
                falseColor: { type: 'string', description: 'Boolean: CSS colour when falsy.' },
                thresholds: {
                  type: 'array',
                  description:
                    'Progress: threshold values (ascending). Each threshold defines where the next colour starts.',
                  items: { type: 'number' },
                },
                colors: {
                  type: 'array',
                  description: 'Progress: colour per bucket (length = thresholds.length + 1).',
                  items: { type: 'string' },
                },
                suffix: {
                  type: 'string',
                  description:
                    'Number/Progress: literal suffix appended after the formatted value. Default `%` for progress.',
                },
                nullLabel: {
                  type: 'string',
                  description: 'Progress: label when value is null. Default `None`.',
                },
                format: {
                  type: 'string',
                  description:
                    'Number: `number` (default), `currency`, `percent`, or `compact` (K/M/B). Date: dayjs format string (default `YYYY-MM-DD HH:mm`).',
                },
                locale: {
                  type: 'string',
                  description:
                    'Number: BCP 47 locale for `Intl.NumberFormat` (e.g. `en-US`, `de-DE`). Defaults to browser.',
                },
                currency: {
                  type: 'string',
                  description:
                    'Number: ISO 4217 currency code when `format: currency`. Default `USD`.',
                },
                currencyDisplay: {
                  type: 'string',
                  enum: ['symbol', 'narrowSymbol', 'code', 'name'],
                  description: 'Number: currency display style when `format: currency`.',
                },
                decimals: {
                  type: 'number',
                  description:
                    'Number: fixed number of fraction digits (sets both `minimumFractionDigits` and `maximumFractionDigits`).',
                },
                minDecimals: {
                  type: 'number',
                  description: 'Number: `Intl.NumberFormat` `minimumFractionDigits`.',
                },
                maxDecimals: {
                  type: 'number',
                  description: 'Number: `Intl.NumberFormat` `maximumFractionDigits`.',
                },
                notation: {
                  type: 'string',
                  enum: ['standard', 'scientific', 'engineering', 'compact'],
                  description:
                    'Number: `Intl.NumberFormat` notation. `compact` format sets this automatically.',
                },
                useGrouping: {
                  type: 'boolean',
                  default: true,
                  description: 'Number: include thousands separators.',
                },
                negative: {
                  type: 'string',
                  enum: ['minus', 'parentheses'],
                  default: 'minus',
                  description:
                    'Number: how to render negative numbers — `minus` (default) or `parentheses` for accounting.',
                },
                signColor: {
                  type: 'boolean',
                  default: false,
                  description:
                    'Number: when true, positives use `positiveColor` (default success token), negatives use `negativeColor` (default error token).',
                },
                positiveColor: {
                  type: 'string',
                  description: 'Number: CSS colour when value > 0 (requires `signColor: true`).',
                },
                negativeColor: {
                  type: 'string',
                  description: 'Number: CSS colour when value < 0 (requires `signColor: true`).',
                },
                zeroColor: {
                  type: 'string',
                  description: 'Number: CSS colour when value === 0 (requires `signColor: true`).',
                },
                color: {
                  type: 'string',
                  description:
                    'Number: CSS colour applied to all values (overridden by `signColor`).',
                },
                prefix: {
                  type: 'string',
                  description: 'Number: literal prefix (e.g. `Δ `, `~`).',
                },
                align: {
                  type: 'string',
                  enum: ['left', 'center', 'right'],
                  description:
                    'Cell horizontal alignment. Defaults to `right` for `cell.type: number`. Sets `cellStyle.justifyContent` and `ag-*-aligned-header` on the header.',
                },
              },
            },
          },
        },
      },
    },
  },
};
