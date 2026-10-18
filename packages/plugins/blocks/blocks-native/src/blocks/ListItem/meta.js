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

// A mobile-only block: an iOS-style list cell. On a phone a table is a List of ListItems.
export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The ListItem row.',
    avatar: 'The ListItem avatar.',
    icon: 'The ListItem icon.',
    title: 'The ListItem title.',
    description: 'The ListItem description.',
    extra: 'The ListItem detail on the right.',
  },
  events: {
    onClick: 'Trigger actions when the ListItem is pressed.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      avatar: {
        type: 'object',
        additionalProperties: false,
        description: 'A round avatar at the start of the item: an image, or a short text.',
        properties: {
          src: { type: 'string', description: 'The image url.' },
          content: {
            type: 'string',
            description: 'Text shown when there is no image, such as initials.',
          },
          color: { type: 'string', description: 'Background colour of a text avatar.' },
        },
      },
      chevron: {
        type: 'boolean',
        description:
          'Show a chevron at the end of the item. Defaults to true when the item has an onClick event.',
      },
      description: {
        type: 'string',
        description: 'Secondary text under the title.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Stop the item from being pressed.',
      },
      extra: {
        type: 'string',
        description: 'A detail on the right of the item, such as a count or a value.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          'Name of an icon, or the properties of an Icon block, shown at the start of the item.',
      },
      theme,
      title: {
        type: 'string',
        description: 'The item title. Defaults to the block id.',
      },
    },
  },
};
