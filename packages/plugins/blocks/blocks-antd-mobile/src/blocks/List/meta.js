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
  category: 'list',
  icons: [],
  valueType: 'array',
  slots: {
    content: 'Blocks rendered inside a List.Item for each list item.',
  },
  cssKeys: {
    element: 'The List element.',
    item: 'Each List.Item element.',
  },
  events: {
    onItemClick:
      'Trigger actions when a list item is clicked. The event object contains the item index as "index". Setting this event makes items clickable (pressed style and link arrow).',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      header: {
        type: 'string',
        description: 'Header text above the list.',
      },
      itemArrow: {
        type: 'boolean',
        description:
          'Show a link arrow on every item. By default the arrow only shows on clickable items (when onItemClick is set).',
      },
      mode: {
        type: 'string',
        enum: ['default', 'card'],
        default: 'default',
        description: 'List display mode - "card" renders the list as an inset card.',
      },
    },
  },
};
