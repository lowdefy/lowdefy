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
    element: 'The outer log container.',
    toolbar: 'The sticky toolbar row holding the search input and the level filters.',
    search: 'The search input wrapper.',
    filters: 'The level filter pill group.',
    list: 'The virtualised list container.',
    row: 'Each log row.',
    detail: 'The expanded detail area of a row.',
    context: 'The context key-value table in an expanded row.',
    noData: 'The placeholder shown when there are no records.',
    noResults: 'The placeholder shown when the search and level filter match no records.',
  },
  events: {
    onRowClick: {
      description: 'Triggered when a row is clicked.',
      event: {
        row: 'The record bound to the clicked row.',
      },
    },
    onExpand: {
      description: 'Triggered when a row is expanded or collapsed.',
      event: {
        row: 'The record bound to the row.',
        expanded: 'True when the row was expanded, false when it was collapsed.',
      },
    },
    onSearch: {
      description:
        'Triggered when the debounced search query changes, including when the search is cleared.',
      event: {
        value: 'The current debounced search query string.',
        resultCount:
          'Number of rows visible after the search and the level filter are applied. Equals the number of records when the query is empty or below `search.minLength` and the level filter is "all".',
      },
    },
  },
  methods: {
    setData:
      'Set the records imperatively, bypassing block properties, so a large log never round-trips through the operator pipeline. Call with a CallMethod action from the block onMount event, after a Request action has loaded the records. The page onInit event runs before the block mounts, so the method does not exist yet.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      data: {
        type: 'array',
        default: [],
        description:
          'Array of records, in the order they should be listed (usually newest first). Each record is read using the `fields` paths, so any record shape works.',
        docs: {
          displayType: 'yaml',
        },
      },
      fields: {
        type: 'object',
        additionalProperties: false,
        description:
          'Dot paths used to read each record. Set only the paths that differ from the defaults.',
        docs: {
          displayType: 'yaml',
        },
        properties: {
          id: {
            type: 'string',
            default: '_id',
            description:
              'Path to a unique row id, used as the list key, to track expanded rows and matched by the search. Ids that are not strings, such as MongoDB ObjectIds, are serialized. Falls back to the row index when the path is empty or the id repeats an earlier row.',
          },
          time: {
            type: 'string',
            default: 'created.timestamp',
            description:
              'Path to the row timestamp. Any value the JavaScript Date constructor accepts, such as an ISO string or a date.',
          },
          type: {
            type: 'string',
            default: 'type',
            description: 'Path to the event type, used as the key into `eventTypeConfig`.',
          },
          level: {
            type: 'string',
            default: 'level',
            description:
              'Path to the severity of the row. One of "error", "warning", "success" or "info". When the path is empty, the level on the matching `eventTypeConfig` entry is used, otherwise the row is "info".',
          },
          message: {
            type: 'string',
            default: 'title',
            description:
              'Path to the message shown on the row. Rendered as html, sanitized before it is inserted.',
          },
          detail: {
            type: 'string',
            default: 'description',
            description:
              'Path to the detail shown when the row is expanded. Rendered as html, sanitized before it is inserted.',
          },
          actor: {
            type: 'string',
            default: 'created.user',
            description:
              'Path to the actor of the row. A string is used as the actor name, an object is read using `actorName` and `actorPicture`.',
          },
          actorName: {
            type: 'string',
            default: 'name',
            description: 'Path to the actor name, relative to the actor object.',
          },
          actorPicture: {
            type: 'string',
            default: 'picture',
            description:
              'Path to the actor avatar image url, relative to the actor object. The actor initials are shown when it is empty.',
          },
          context: {
            type: 'string',
            default: 'metadata',
            description:
              'Path to the context object shown as a flattened key-value table when the row is expanded.',
          },
        },
      },
      eventTypeConfig: {
        type: 'object',
        default: {},
        description:
          'Map of event type to display config: `{ color, title, icon, level }`. `title` labels the type column, `icon` names an icon shown before the label, `color` colors the label and icon, and `level` sets the severity for every row of that type.',
        docs: {
          displayType: 'yaml',
        },
        additionalProperties: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: {
              type: 'string',
              description: 'Label shown in the type column. Defaults to the event type.',
            },
            color: {
              type: 'string',
              description: 'CSS color of the type label and icon.',
            },
            icon: {
              type: ['string', 'object'],
              description:
                'Name of an icon, or properties of an Icon block, shown before the type label.',
            },
            level: {
              type: 'string',
              enum: ['error', 'warning', 'success', 'info'],
              description:
                'Severity of every row of this type, used when the row has no level of its own.',
            },
          },
        },
      },
      reverse: {
        type: 'boolean',
        default: false,
        description: 'Reverse the order of the records before they are listed.',
      },
      search: {
        type: ['object', 'boolean'],
        additionalProperties: false,
        description:
          'Client-side search over the id, type, title, message, detail and context of every record. The search input is shown by default: omit the property or set it to true for the defaults, set an object to tune it, or set false to hide it.',
        properties: {
          placeholder: {
            type: 'string',
            description:
              'Placeholder text in the search input. Defaults to `text.searchPlaceholder`.',
          },
          debounce: {
            type: 'number',
            default: 150,
            description: 'Milliseconds to wait after the last keystroke before filtering.',
          },
          minLength: {
            type: 'number',
            default: 0,
            description: 'Skip filtering until the query is at least this many characters.',
          },
        },
      },
      levelFilters: {
        type: 'boolean',
        default: true,
        description: 'Show the severity filter pills in the toolbar.',
      },
      levelFilterOptions: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['all', 'error', 'warning', 'success', 'info'],
        },
        description:
          'The filter pills to show, in order. Defaults to "all" plus every level with at least one record.',
      },
      defaultExpanded: {
        type: 'boolean',
        default: false,
        description:
          'Expand every row. Rows added later are expanded when they first appear, and rows the user collapsed stay collapsed.',
      },
      height: {
        type: ['number', 'string'],
        description:
          'Pixel height (number) or css height string of the scroll container. When omitted, the log grows with its content and scrolls with the page.',
      },
      overscan: {
        type: 'number',
        default: 400,
        description:
          'Pixels of off-screen rows to render above and below the viewport. Increase for smoother fast-scroll, decrease to reduce DOM cost.',
      },
      text: {
        type: 'object',
        additionalProperties: false,
        description: 'All the text rendered by the block, so it can be changed or translated.',
        docs: {
          displayType: 'yaml',
        },
        properties: {
          all: {
            type: 'string',
            default: 'All',
            description: 'Label of the filter pill that shows every record.',
          },
          error: {
            type: 'string',
            default: 'Errors',
            description: 'Label of the error level filter pill.',
          },
          warning: {
            type: 'string',
            default: 'Warnings',
            description: 'Label of the warning level filter pill.',
          },
          success: {
            type: 'string',
            default: 'Successes',
            description: 'Label of the success level filter pill.',
          },
          info: {
            type: 'string',
            default: 'Info',
            description: 'Label of the info level filter pill.',
          },
          searchPlaceholder: {
            type: 'string',
            default: 'Search events, context, ids…',
            description: 'Placeholder text in the search input.',
          },
          clearSearch: {
            type: 'string',
            default: 'Clear search',
            description: 'Accessible label of the button that clears the search input.',
          },
          context: {
            type: 'string',
            default: 'Context',
            description: 'Heading of the context table in an expanded row.',
          },
          copy: {
            type: 'string',
            default: 'Copy JSON',
            description: 'Label of the button that copies the context object to the clipboard.',
          },
          copied: {
            type: 'string',
            default: 'Copied',
            description: 'Label shown on the copy button after the context was copied.',
          },
          systemActor: {
            type: 'string',
            default: 'System',
            description: 'Actor name shown when a record has no actor.',
          },
          noData: {
            type: 'string',
            default: 'No events.',
            description: 'Text shown when there are no records.',
          },
          noResults: {
            type: 'string',
            default: 'No matching events.',
            description: 'Text shown when the search and filters match no records.',
          },
        },
      },
    },
  },
};
