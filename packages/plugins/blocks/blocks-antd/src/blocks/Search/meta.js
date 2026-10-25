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

import icon from '../../schemas/icon.js';

export default {
  category: 'display',
  icons: ['search', 'history', 'document', 'clear'],
  valueType: null,
  cssKeys: {
    element: 'The search trigger button and modal root.',
    trigger: 'The trigger button.',
    triggerBadge: 'The keyboard shortcut badge on the trigger.',
    modal: 'The antd Modal container.',
    input: 'The search input field.',
    results: 'The scrollable results list.',
    group: 'A result group container.',
    groupHeading: 'A group heading label.',
    groupCount: 'The match count in a group heading (shown when the group has a limit).',
    seeAll: 'A group\'s "See all N" row.',
    pinned: 'The pinned last row.',
    footer: 'The footer line of key hints.',
    item: 'A result item row.',
    itemIcon: 'The icon in a result item.',
    itemTitle: 'The title in a result item.',
    itemDescription: 'The description/snippet in a result item.',
    highlight: 'Highlighted match text (<mark> elements).',
    empty: 'The empty state message.',
    loading: 'The loading spinner container.',
  },
  methods: {
    toggleOpen: 'Toggle the search modal open or closed.',
    setOpen: 'Open or close the search modal. Accepts { open: boolean }.',
  },
  events: {
    onSelect: {
      description:
        'Trigger actions when a search result is selected. Result item stored fields are spread into the event object.',
      event: { query: 'The search term.', resultCount: 'Total results for the query.' },
    },
    onSearch: {
      description: 'Trigger actions when the search query changes.',
      event: { value: 'The search term.', resultCount: 'Number of matching results.' },
    },
    onPinned: {
      description:
        'Trigger actions when the pinned row is selected, by click, Enter or its shortcut. Fires the event named by `pinned.event` instead when that is set.',
      event: { query: 'The typed search term.' },
    },
    onSeeAll: {
      description:
        'Trigger actions when a group\'s "See all" row is clicked and the group\'s `seeAll` is an object. When `seeAll` is a string, the event of that name fires instead.',
      event: {
        group: 'The group label.',
        count: 'The full number of matches in the group.',
        query: 'The typed search term.',
        pageId: 'The `seeAll.pageId`.',
        urlQuery: 'The `seeAll.urlQuery`, with `{query}` replaced by the typed search term.',
      },
    },
    onOpen: 'Trigger actions when the search modal opens.',
    onClose: 'Trigger actions when the search modal closes.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      indexUrl: {
        type: ['string', 'array'],
        urlKind: 'src',
        description: 'URL or array of URLs to pre-built search index JSON files.',
        docs: {
          displayType: 'yaml',
        },
      },
      documents: {
        type: 'array',
        description: 'Array of document objects for client-side indexing.',
        items: {
          type: 'object',
        },
        docs: {
          displayType: 'yaml',
        },
      },
      fields: {
        type: 'array',
        description: 'Fields to index. Required when using documents, optional for indexUrl.',
        items: {
          type: 'string',
        },
      },
      storeFields: {
        type: 'array',
        description: 'Fields to store in the index and return in results.',
        items: {
          type: 'string',
        },
      },
      searchOptions: {
        type: 'object',
        description: 'MiniSearch search options.',
        docs: {
          displayType: 'yaml',
        },
        properties: {
          boost: {
            type: 'object',
            description: 'Field boost factors for relevance scoring.',
          },
          fuzzy: {
            type: 'number',
            description: 'Fuzzy matching tolerance as a fraction of term length (0 to 1).',
          },
          prefix: {
            type: 'boolean',
            description: 'Enable prefix matching.',
            default: true,
          },
          combineWith: {
            type: 'string',
            enum: ['OR', 'AND'],
            default: 'OR',
            description: 'How to combine search terms.',
          },
        },
      },
      label: {
        type: 'string',
        description: 'Trigger button text.',
        default: 'Search',
      },
      icon: {
        ...icon,
        default: 'search',
        description:
          'Trigger button icon: a semantic name like `search`, a Lucide icon name like `Search`, or a set-qualified name like `tabler:Search`, or properties of an Icon block.',
      },
      showShortcut: {
        type: 'boolean',
        description: 'Show keyboard shortcut badge on the trigger button.',
        default: true,
      },
      placeholder: {
        type: 'string',
        description: 'Search input placeholder text.',
        default: 'Search...',
      },
      shortcut: {
        type: 'string',
        description:
          'Keyboard shortcut to open the modal. Renders a shortcut badge on the trigger button (see showShortcut). Use "mod" for Cmd on Mac, Ctrl elsewhere.',
        default: 'mod+k',
      },
      width: {
        type: 'number',
        description: 'Modal width in pixels.',
        default: 640,
      },
      maxResults: {
        type: 'number',
        description:
          'Maximum number of results displayed. Ignored when any group sets a `limit`: the groups then cap themselves.',
        default: 20,
      },
      result: {
        type: 'object',
        description: 'Maps index fields to result UI slots.',
        docs: {
          displayType: 'yaml',
        },
        properties: {
          title: {
            type: 'string',
            description: 'Field name for result title.',
            default: 'title',
          },
          description: {
            type: 'string',
            description: 'Field name for result description/snippet.',
          },
          category: {
            type: 'string',
            description: 'Field name for result grouping category.',
          },
          icon: {
            type: 'string',
            description: 'Field name for result icon name.',
          },
          pageId: {
            type: 'string',
            description: 'Field name for Lowdefy page navigation.',
          },
          url: {
            type: 'string',
            urlKind: false,
            description: 'Field name for external URL navigation.',
          },
        },
      },
      groups: {
        type: 'array',
        description: 'Result grouping definitions.',
        docs: {
          displayType: 'yaml',
        },
        items: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
              description: 'Group display label.',
            },
            match: {
              type: 'object',
              description: 'Field/value pairs to match results to this group.',
            },
            icon: {
              type: 'string',
              description: 'Icon for the group header.',
            },
            limit: {
              type: 'number',
              description:
                'Number of results shown for the group. The heading then shows the number of matches, and a "See all N" row follows the shown rows when there are more.',
            },
            seeAll: {
              type: ['object', 'string'],
              description:
                'The "See all N" row of a group with a `limit`. An object fires `onSeeAll` with `{ group, count, query, pageId, urlQuery }`; a string is the name of the event to fire instead, with the same payload.',
              properties: {
                label: {
                  type: 'string',
                  description: 'Row text before the count.',
                  default: 'See all',
                },
                pageId: {
                  type: 'string',
                  description: 'Page id sent in the event, for a Link action.',
                },
                urlQuery: {
                  type: 'object',
                  description:
                    'Url query sent in the event. `{query}` in a string is replaced by the typed search term.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
              },
            },
          },
        },
      },
      pinned: {
        type: 'object',
        description:
          'An action row kept last in the list while a query is typed. It is selected when nothing matches, reached with the arrow keys, and fires `onPinned` with `{ query }`.',
        properties: {
          title: {
            type: 'string',
            description: 'Row text. `{query}` is replaced by the typed search term.',
          },
          icon: {
            ...icon,
            default: 'search',
            description:
              'Row icon: a semantic name, a Lucide icon name, or properties of an Icon block.',
          },
          shortcut: {
            type: 'string',
            description:
              'Keyboard shortcut that selects the row from any row, such as `mod+enter`. Shown as a badge on the row.',
          },
          event: {
            type: 'string',
            description: 'Name of the event to fire instead of `onPinned`.',
          },
        },
      },
      footer: {
        type: 'string',
        description: 'A line of key hints shown below the results.',
      },
      noResultsMessage: {
        type: 'string',
        description: 'Message shown when no results match.',
        default: 'No results found.',
      },
      highlightMatches: {
        type: 'boolean',
        description: 'Highlight matched terms in results.',
        default: true,
      },
      recentSearches: {
        type: 'boolean',
        description: 'Show recent searches when input is empty.',
        default: true,
      },
      recentSearchesKey: {
        type: 'string',
        description:
          'localStorage key prefix for recent searches. Recent searches are kept per app and per signed-in user, and cleared at sign-out.',
        default: 'search',
      },
      recentSearchesCount: {
        type: 'number',
        description: 'Maximum number of recent searches stored.',
        default: 5,
      },
      recentResults: {
        type: 'boolean',
        description:
          'Remember the results a person selects and list them when the input is empty. Kept per app and per signed-in user, like recent searches, and cleared at sign-out.',
        default: false,
      },
      recentResultsCount: {
        type: 'number',
        description: 'Maximum number of recent results stored and listed.',
        default: 4,
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for the trigger Button, the search Modal and its Input, e.g. `borderRadius`, `colorPrimary`, `colorBgElevated` or `fontSize`. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
};
