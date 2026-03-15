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
    element: 'The search trigger button and modal root.',
    trigger: 'The trigger button.',
    triggerBadge: 'The keyboard shortcut badge on the trigger.',
    modal: 'The antd Modal container.',
    input: 'The search input field.',
    results: 'The scrollable results list.',
    group: 'A result group container.',
    groupHeading: 'A group heading label.',
    item: 'A result item row.',
    itemIcon: 'The icon in a result item.',
    itemTitle: 'The title in a result item.',
    itemDescription: 'The description/snippet in a result item.',
    highlight: 'Highlighted match text (<mark> elements).',
    empty: 'The empty state message.',
  },
  events: {
    onSelect: 'Trigger actions when a search result is selected.',
    onSearch: 'Trigger actions when the search query changes.',
    onOpen: 'Trigger actions when the search modal opens.',
    onClose: 'Trigger actions when the search modal closes.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      indexUrl: {
        type: ['string', 'array'],
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
        type: ['string', 'object'],
        description: 'Trigger button icon name or Icon block properties.',
        docs: {
          displayType: 'icon',
        },
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
          'Keyboard shortcut to open the modal. Use "mod" for Cmd on Mac, Ctrl elsewhere.',
        default: 'mod+k',
      },
      width: {
        type: 'number',
        description: 'Modal width in pixels.',
        default: 640,
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results displayed.',
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
          },
        },
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
        description: 'localStorage key prefix for recent searches.',
        default: 'search',
      },
      recentSearchesCount: {
        type: 'number',
        description: 'Maximum number of recent searches stored.',
        default: 5,
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
};
