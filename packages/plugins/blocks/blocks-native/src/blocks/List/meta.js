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

import { theme } from '../../schemas/inputProperties.js';

export default {
  category: 'list',
  icons: [],
  valueType: 'array',
  slots: {
    content: 'Blocks rendered for each list item.',
  },
  cssKeys: {
    element: 'The List.',
    sectionHeader: 'The section headers, when sectionKey is set.',
  },
  events: {
    onRefresh:
      'Mobile only. Trigger actions when the List is pulled down to refresh. The refresh spinner shows while they run. Needs scroll: true.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      direction: {
        type: 'string',
        enum: ['row', 'column', 'row-reverse', 'column-reverse'],
        description: "List items along a 'row' or down a 'column'.",
      },
      scroll: {
        type: 'boolean',
        description:
          'Let the List scroll itself, in place of scrolling with the page. Give it a height in its style.',
      },
      sectionKey: {
        type: 'string',
        description:
          'Mobile only. The path in each item of its section title. Items with the same title next to each other share a sticky section header.',
      },
      swipeActions: {
        type: 'array',
        description:
          'Mobile only. Buttons an item shows when it is swiped to the left. Each fires the List event it names, with the item index as `_event: index`.',
        items: {
          type: 'object',
          required: ['title', 'event'],
          additionalProperties: false,
          properties: {
            title: { type: 'string', description: 'The button title.' },
            event: {
              type: 'string',
              description: 'The name of the List event the button fires, such as onDelete.',
            },
            color: { type: 'string', description: 'The button colour. Defaults to the primary colour.' },
            danger: {
              type: 'boolean',
              default: false,
              description: 'Draw the button in the danger colour.',
            },
          },
        },
      },
      theme,
      wrap: {
        type: 'string',
        enum: ['wrap', 'nowrap', 'wrap-reverse'],
        description: 'Ignored on mobile: list items do not wrap.',
      },
    },
  },
};
