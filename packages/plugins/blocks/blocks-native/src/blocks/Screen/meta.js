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

// The mobile page type. Its component lives in @lowdefy/client-native, which owns how a page meets
// the shell's router; this meta lets the build accept mobile pages of type Screen.
export default {
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    content: 'The page content, in a scroll view.',
    headerLeft:
      'Blocks drawn at the left of the screen header, at their natural size. Prefer `headerActions` for icon buttons.',
    headerRight:
      'Blocks drawn at the right of the screen header, at their natural size. Prefer `headerActions` for icon buttons.',
    footer:
      'Blocks pinned to the bottom of the screen, outside the scroll view, above the tab bar and the keyboard, on the bar background with a hairline above. For a Composer, or actions that stay in reach.',
  },
  events: {
    onFocus:
      'Trigger actions each time the screen becomes the one shown: on its first show (after onMount), when its tab is picked again, and when the screen above it is closed.',
    onRefresh:
      'Turns on pull-to-refresh. Trigger actions when the page is pulled down; the spinner shows until they finish.',
    onSearch:
      'Trigger actions when the search is submitted in the header search bar. `_event: value` is the search text.',
    onSearchChange:
      'Trigger actions when the header search text changes, once typing pauses (`headerSearch.debounce`), and with an empty value when the search is cancelled. `_event: value` is the search text.',
    onHeaderAction:
      'Trigger actions when a header action without its own `event` is pressed, or an item of its menu is picked. `_event: id` is the action id, or the picked item id.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'The screen title, shown in the header.',
      },
      largeTitle: {
        type: 'boolean',
        default: false,
        description:
          'Show the title as an iOS large title, which collapses into the header as the page scrolls. Other platforms show the standard title.',
      },
      presentation: {
        type: 'string',
        enum: ['card', 'modal', 'sheet'],
        default: 'card',
        description: 'How the screen is presented when opened.',
      },
      headerSearch: {
        type: 'object',
        additionalProperties: false,
        description:
          'A native search bar in the header (under a large title on iOS). Its text reaches the `onSearchChange` and `onSearch` events.',
        properties: {
          placeholder: {
            type: 'string',
            description: 'Text shown in the empty search field.',
          },
          autoFocus: {
            type: 'boolean',
            default: false,
            description:
              'Focus the search field, with the keyboard up, each time the screen is shown. For a search page, such as the page of a `role: search` tab.',
          },
          debounce: {
            type: 'number',
            default: 300,
            description: 'Milliseconds the text must stay unchanged before `onSearchChange` fires.',
          },
          hideWhenScrolling: {
            type: 'boolean',
            default: false,
            description: 'Hide the search bar as the page scrolls (iOS).',
          },
        },
      },
      headerActions: {
        type: 'array',
        description:
          'Icon buttons in the header, at their natural size. On iOS each is a native bar button drawing the icon as an SF Symbol (`sfSymbol`, or the symbol for the Lucide or semantic name); an icon with no symbol, and every icon elsewhere, draws as its Lucide icon.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'icon'],
          properties: {
            id: {
              type: 'string',
              description: 'The action id, the `_event: id` of the event it triggers.',
            },
            icon: {
              type: 'string',
              description:
                'Icon name: a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`.',
            },
            sfSymbol: {
              type: 'string',
              description:
                'The SF Symbol iOS draws, such as `square.and.pencil`. Defaults to the symbol mapped from `icon`.',
            },
            title: {
              type: 'string',
              description:
                'The label screen readers read and iOS shows in a long press. Defaults to a title from the icon name.',
            },
            placement: {
              type: 'string',
              enum: ['left', 'right'],
              default: 'right',
              description: 'The side of the header the button is on.',
            },
            event: {
              type: 'string',
              default: 'onHeaderAction',
              description:
                'The Screen event the button triggers, such as `onAdd`; list it under the Screen `events`.',
            },
            disabled: {
              type: 'boolean',
              default: false,
              description: 'Draw the button dimmed and ignore presses.',
            },
            items: {
              type: 'array',
              description:
                "Make the button open a menu of these items, a native menu on iOS, such as a ⋯ menu of a detail page. Picking an item triggers the button's `event` with the item's id as `_event: id`.",
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'title'],
                properties: {
                  id: { type: 'string', description: 'The item id, the `_event: id` it triggers.' },
                  title: { type: 'string', description: 'The item text.' },
                  symbol: {
                    type: 'string',
                    description:
                      'An SF Symbol name, such as `link` or `trash`, drawn beside the item on iOS.',
                  },
                  destructive: {
                    type: 'boolean',
                    default: false,
                    description: 'Draw the item in red, for actions such as Delete.',
                  },
                  disabled: {
                    type: 'boolean',
                    default: false,
                    description: 'Show the item, dimmed.',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
