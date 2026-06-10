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
  category: 'input',
  icons: [],
  valueType: 'any',
  cssKeys: {
    element: 'The list container.',
    card: 'Each Card element.',
    body: 'Each Card body.',
    selected: 'The selected card.',
    search: 'The search bar wrapper above the list.',
    noResults: 'The "no results" placeholder shown when the search filter matches zero items.',
    noData: 'The "no data" placeholder shown when the data array is empty.',
  },
  events: {
    onChange: {
      description: 'Triggered when the selection changes (only fires when `selectable` is true).',
      event: {
        value:
          'The newly selected value — the `valueKey` field when set, otherwise the whole data item; null when the selection is cleared.',
        index: 'Zero-based index of the clicked card.',
        item: 'The data item bound to the clicked card.',
      },
    },
    onClick: {
      description: 'Triggered when a card is clicked.',
      event: {
        index: 'Zero-based index of the clicked card.',
        item: 'The data item bound to the clicked card.',
      },
    },
    onSearch: {
      description:
        'Triggered when the debounced search query changes (only fires when the `search` property is set).',
      event: {
        value: 'The current debounced search query string.',
        resultCount:
          'Number of items currently visible. Equals data.length when the query is empty or below `minLength`.',
      },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      data: {
        type: 'array',
        default: [],
        description:
          'Array of items. Each item is rendered as one card by passing it to the html Nunjucks template as `item`.',
      },
      html: {
        type: 'string',
        description:
          'Nunjucks template used to render the body of each card. The context exposes `item` (the current data row) and `index` (the zero-based row index).',
      },
      selectable: {
        type: 'boolean',
        default: true,
        description:
          'Enable selecting a card. When true, clicking a card sets the block value to that data item and highlights it. When false, the block is a read-only card list that stores no value.',
      },
      allowDeselect: {
        type: 'boolean',
        default: true,
        description:
          'Allow clicking the selected card again to clear the selection (sets the value to null). Ignored when `selectable` is false.',
      },
      valueKey: {
        type: 'string',
        description:
          'Field of each data item stored as the block value when a card is selected (e.g. "id"). Omit to store the whole item. Lets the selection be driven with SetState using a simple key. Supports dotted paths.',
      },
      primaryKey: {
        type: 'string',
        description:
          'Field used to match the current value (e.g. set with SetState) back to a card for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole item but a single field (e.g. "id") uniquely identifies it. Supports dotted paths.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Toggles the border around each card.',
      },
      hoverable: {
        type: 'boolean',
        default: false,
        description: 'Lift each card up when hovered.',
      },
      size: {
        type: 'string',
        enum: ['default', 'small'],
        default: 'default',
        description: 'Card size.',
      },
      gap: {
        type: 'number',
        default: 8,
        description: 'Pixel gap between cards.',
      },
      height: {
        type: ['number', 'string'],
        description:
          'Optional pixel height (number) or CSS height string of the scroll container. When omitted, the list scrolls with the page.',
      },
      overscan: {
        type: 'number',
        default: 400,
        description:
          'Pixels of off-screen rows to render above and below the viewport. Increase for smoother fast-scroll, decrease to reduce DOM cost.',
      },
      noData: {
        type: 'string',
        description:
          'Text shown in place of the list when the `data` array is empty. Defaults to the `blocks.listSelector.noData` message ("No data").',
      },
      search: {
        type: 'object',
        additionalProperties: false,
        description:
          'Optional client-side search bar above the list. When this property is set, a debounced search input filters rows by text. Omit to hide the bar.',
        properties: {
          placeholder: {
            type: 'string',
            default: 'Search…',
            description: 'Placeholder text in the input.',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Dotted field paths to match against (e.g. "user.name"). When omitted, every field path is searched (whole-item stringify).',
          },
          caseSensitive: {
            type: 'boolean',
            default: false,
            description: 'Match case exactly.',
          },
          debounce: {
            type: 'number',
            default: 150,
            description: 'Milliseconds to wait after the last keystroke before filtering.',
          },
          sticky: {
            type: 'boolean',
            default: true,
            description: 'Stick the search bar to the top while scrolling.',
          },
          allowClear: {
            type: 'boolean',
            default: true,
            description: 'Show a clear (×) icon in the input.',
          },
          minLength: {
            type: 'number',
            default: 0,
            description: 'Skip filtering until the query is at least this many characters.',
          },
          noResultsText: {
            type: 'string',
            default: 'No results',
            description: 'Text shown when the filter matches zero items.',
          },
        },
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for the cards. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/card#design-token',
        },
        properties: {
          bodyPadding: {
            type: 'number',
            default: 24,
            description: 'Padding of each card body.',
          },
          bodyPaddingSM: {
            type: 'number',
            default: 12,
            description: 'Padding of each card body for small cards.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius of each card.',
          },
          colorBorderSecondary: {
            type: 'string',
            description: 'Border color of each card.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of each card body.',
          },
          colorText: {
            type: 'string',
            description: 'Text color inside each card.',
          },
          boxShadowTertiary: {
            type: 'string',
            description: 'Shadow applied to each card on hover when hoverable is true.',
          },
        },
      },
    },
  },
};
