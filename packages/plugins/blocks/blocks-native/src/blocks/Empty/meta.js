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

// Empty has no web block of its name: it is iOS's ContentUnavailableView (antd's Empty on the
// web), for a list or screen with nothing to show. A page that uses it is mobile only.
export default {
  category: 'container',
  icons: ['Inbox'],
  valueType: null,
  slots: {
    footer: 'Blocks under the description, such as a button that creates the first item.',
  },
  cssKeys: {
    element: 'The Empty element.',
    image: 'The box around the icon.',
    title: 'The title text.',
    description: 'The description text.',
    footer: 'The footer under the description.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      description: {
        type: 'string',
        description:
          'One line of text under the title. Without a title it defaults to "No data"; set it to an empty string to show the icon alone.',
      },
      icon: {
        ...icon,
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `CircleCheck`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block, drawn large above the title. Defaults to `Inbox`.',
      },
      image: {
        type: 'string',
        enum: ['default', 'simple'],
        default: 'default',
        description:
          'The size: `default` for a screen, `simple` (a smaller icon and text) for inside a list or card.',
      },
      title: {
        type: 'string',
        description: 'The title, such as "You\'re all caught up".',
      },
    },
  },
};
